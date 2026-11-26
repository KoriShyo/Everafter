// Local persistence (this version is a frontend prototype — data lives in this browser's localStorage).
import { useSyncExternalStore } from 'react';
import { exampleProject, newProject, TR_FIELDS, uid } from './data.js';
import { DEFAULT_COPY } from './i18n.js';

const KEY = 'everafter.studio.v1';
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fall through to seed */
  }
  const seeded = { projects: [exampleProject()] };
  try {
    localStorage.setItem(KEY, JSON.stringify(seeded));
  } catch {
    /* storage unavailable: keep working in memory */
  }
  return seeded;
}

let state = { data: load(), save: { status: 'saved', at: Date.now(), error: '' } };
const emit = () => listeners.forEach((l) => l());

let saveTimer;
function scheduleSave() {
  state = { ...state, save: { ...state.save, status: 'saving' } };
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state.data));
      state = { ...state, save: { status: 'saved', at: Date.now(), error: '' } };
    } catch (e) {
      const full = e && (e.name === 'QuotaExceededError' || e.code === 22);
      state = {
        ...state,
        save: {
          status: 'error',
          at: state.save.at,
          error: full
            ? 'Browser storage is full — remove a few photos so changes can be saved.'
            : 'Changes could not be saved in this browser.',
        },
      };
    }
    emit();
  }, 450);
}

function setData(next) {
  state = { ...state, data: next };
  scheduleSave();
  emit();
}

export function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}
export const getState = () => state;

export function useStore(selector) {
  return useSyncExternalStore(subscribe, () => selector(state));
}
export const useProjects = () => useStore((s) => s.data.projects);
export const useProject = (id) => useStore((s) => s.data.projects.find((p) => p.id === id));
export const useSaveState = () => useStore((s) => s.save);

export function getProject(id) {
  return state.data.projects.find((p) => p.id === id);
}

export function createProject(details) {
  const p = newProject(details);
  setData({ ...state.data, projects: [p, ...state.data.projects] });
  return p;
}

export function deleteProject(id) {
  const projects = state.data.projects;
  const idx = projects.findIndex((p) => p.id === id);
  const removed = projects[idx];
  setData({ ...state.data, projects: projects.filter((p) => p.id !== id) });
  return () => {
    const next = [...state.data.projects];
    next.splice(Math.min(idx, next.length), 0, removed);
    setData({ ...state.data, projects: next });
  };
}

export function restoreExample() {
  setData({ ...state.data, projects: [...state.data.projects, exampleProject()] });
}

/* ---------- edits with undo history ---------- */
const histories = new Map(); // id -> { past: [], group, time }
const HISTORY_LIMIT = 50;

function snapshot(p) {
  return { template: p.template, content: p.content, design: p.design };
}

export function updateProject(id, recipe, { group, history = true } = {}) {
  const projects = state.data.projects;
  const idx = projects.findIndex((p) => p.id === id);
  if (idx < 0) return;
  const prev = projects[idx];
  const next = recipe(prev);
  if (!next || next === prev) return;
  if (history) {
    const h = histories.get(id) || { past: [], group: null, time: 0 };
    const now = Date.now();
    const coalesce = group && h.group === group && now - h.time < 1200;
    if (!coalesce) {
      h.past.push(snapshot(prev));
      if (h.past.length > HISTORY_LIMIT) h.past.shift();
    }
    h.group = group || null;
    h.time = now;
    histories.set(id, h);
  }
  const copy = [...projects];
  copy[idx] = { ...next, updatedAt: Date.now() };
  setData({ ...state.data, projects: copy });
}

export const setContent = (id, patch, group) =>
  updateProject(id, (p) => ({ ...p, content: { ...p.content, ...patch } }), { group });
export const setDesign = (id, patch, group) =>
  updateProject(id, (p) => ({ ...p, design: { ...p.design, ...patch } }), { group });

export function canUndo(id) {
  return (histories.get(id)?.past.length || 0) > 0;
}
export function undo(id) {
  const h = histories.get(id);
  if (!h || !h.past.length) return false;
  const snap = h.past.pop();
  h.group = null;
  updateProject(id, (p) => ({ ...p, ...snap }), { history: false });
  return true;
}
export function useCanUndo(id) {
  // re-evaluates whenever the store changes
  return useStore(() => canUndo(id));
}

/* ---------- guests (not part of design undo) ---------- */
export function setGuests(id, fn) {
  updateProject(id, (p) => ({ ...p, guests: fn(p.guests) }), { history: false });
}
/* ---------- couple (owner) links ---------- */
export function ensureOwnerToken(id) {
  const p = getProject(id);
  if (!p) return null;
  if (p.ownerToken) return p.ownerToken;
  const token = uid(16);
  updateProject(id, (x) => ({ ...x, ownerToken: token }), { history: false });
  return token;
}
export function resetOwnerToken(id) {
  const token = uid(16);
  updateProject(id, (x) => ({ ...x, ownerToken: token }), { history: false });
  return token;
}
export const useProjectByOwnerToken = (token) =>
  useStore((s) => (token ? s.data.projects.find((p) => p.ownerToken === token) : undefined));

export function setInviteLang(id, lang) {
  updateProject(
    id,
    (p) => {
      const old = p.design.lang === 'km' ? 'km' : 'en';
      if (old === lang) return p;
      const content = { ...p.content };
      const tr = { ...(content.tr || {}) };
      const incoming = tr[lang] || {};
      const keep = {};
      TR_FIELDS.forEach((f) => {
        keep[f] = content[f];
        const v = incoming[f];
        if (typeof v === 'string' && v.trim()) content[f] = v;
        else if (DEFAULT_COPY[old] && content[f] === DEFAULT_COPY[old][f]) content[f] = DEFAULT_COPY[lang][f];
      });
      const keepSched = {};
      content.schedule = (content.schedule || []).map((s) => {
        keepSched[s.id] = { title: s.title, note: s.note };
        const x = incoming.schedule && incoming.schedule[s.id];
        return x ? { ...s, title: x.title && x.title.trim() ? x.title : s.title, note: x.note && x.note.trim() ? x.note : s.note } : s;
      });
      tr[old] = { ...keep, schedule: keepSched };
      delete tr[lang];
      content.tr = tr;
      return { ...p, content, design: { ...p.design, lang } };
    },
    { group: null },
  );
}

/** Write typed text into one language version (main language = the base fields). */
export function setContentIn(id, lang, patch, group) {
  updateProject(
    id,
    (p) => {
      const main = p.design.lang === 'km' ? 'km' : 'en';
      if (lang === main) return { ...p, content: { ...p.content, ...patch } };
      const tr = { ...(p.content.tr || {}) };
      tr[lang] = { ...(tr[lang] || {}), ...patch };
      return { ...p, content: { ...p.content, tr } };
    },
    { group },
  );
}

export function setScheduleIn(id, lang, sid, k, v, group) {
  updateProject(
    id,
    (p) => {
      const main = p.design.lang === 'km' ? 'km' : 'en';
      if (lang === main || k === 'time') {
        return { ...p, content: { ...p.content, schedule: p.content.schedule.map((s) => (s.id === sid ? { ...s, [k]: v } : s)) } };
      }
      const tr = { ...(p.content.tr || {}) };
      const t = { ...(tr[lang] || {}) };
      const sch = { ...(t.schedule || {}) };
      sch[sid] = { ...(sch[sid] || {}), [k]: v };
      t.schedule = sch;
      tr[lang] = t;
      return { ...p, content: { ...p.content, tr } };
    },
    { group },
  );
}

export function setStatus(id, status) {
  updateProject(id, (p) => ({ ...p, status }), { history: false });
}

/* ---------- toasts ---------- */
let toasts = [];
const toastListeners = new Set();
export function toast(message, opts = {}) {
  const t = { id: Math.random().toString(36).slice(2), message, ...opts };
  toasts = [...toasts.slice(-2), t];
  toastListeners.forEach((l) => l());
  setTimeout(() => dismissToast(t.id), opts.action ? 5200 : 2400);
}
export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  toastListeners.forEach((l) => l());
}
export function useToasts() {
  return useSyncExternalStore(
    (l) => {
      toastListeners.add(l);
      return () => toastListeners.delete(l);
    },
    () => toasts,
  );
}

/* ---------- helpers ---------- */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

export function imageFileToDataUrl(file, max = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) return reject(new Error('Please choose an image file.'));
    if (file.size > 20 * 1024 * 1024) return reject(new Error('That image is larger than 20 MB.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That image could not be read.'));
    };
    img.src = url;
  });
}

export const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
