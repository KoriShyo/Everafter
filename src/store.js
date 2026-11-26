// Persistence: projects live in Firestore (see backend.js) and are cached in memory here.
// Photos are uploaded as separate image documents so a project document stays small.
import { useSyncExternalStore } from 'react';
import { exampleProject, newProject, TR_FIELDS, uid } from './data.js';
import { DEFAULT_COPY } from './i18n.js';
import * as backend from './backend.js';

const LEGACY_KEY = 'everafter.studio.v1'; // old localStorage-only data, imported into the first account that signs in
const listeners = new Set();

let uid_ = null; // signed-in user (set by auth.js)
const dirty = new Set();
const tombstones = new Map(); // id -> project removed, waiting to be marked deleted online
const uploaded = new Set();
const imageCache = new Map(); // hash -> data URL

let state = {
  data: { projects: [] },
  mine: [],
  save: { status: 'saved', at: Date.now(), error: '' },
};
const emit = () => listeners.forEach((l) => l());
const rebuildMine = (data) =>
  data.projects.filter((p) => uid_ && p.ownerUid === uid_).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
const isOwner = (p) => Boolean(uid_) && p.ownerUid === uid_;

/** Called by auth.js when the signed-in user changes. Clears everything belonging to the previous user. */
export function setUser(uid) {
  if (uid === uid_) return;
  uid_ = uid;
  minePromise = null;
  dirty.clear();
  tombstones.clear();
  clearTimeout(saveTimer);
  state = {
    data: { projects: [] },
    mine: [],
    save: { status: 'saved', at: Date.now(), error: '' },
  };
  emit();
}

/* ---------- images ---------- */
function hashString(str) {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(36)}${(h1 >>> 0).toString(36)}${str.length.toString(36)}`;
}

async function externalize(v) {
  if (typeof v !== 'string' || !v.startsWith('data:')) return v;
  const h = hashString(v);
  if (!uploaded.has(h)) {
    await backend.putImage(h, v);
    uploaded.add(h);
  }
  imageCache.set(h, v);
  return `fb:${h}`;
}
async function internalize(v) {
  if (typeof v !== 'string' || !v.startsWith('fb:')) return v;
  const h = v.slice(3);
  if (imageCache.has(h)) return imageCache.get(h);
  const data = await backend.getImage(h);
  if (data) {
    imageCache.set(h, data);
    uploaded.add(h);
  }
  return data || '';
}
async function hydrate(p) {
  const c = p.content;
  const [coverPhoto, gallery] = await Promise.all([internalize(c.coverPhoto), Promise.all((c.gallery || []).map(internalize))]);
  return { ...p, content: { ...c, coverPhoto, gallery: gallery.filter(Boolean) } };
}

/* ---------- loading ---------- */
async function fetchProject(id) {
  const p = await backend.getProject(id);
  return p ? hydrate(p) : null;
}

function putLoaded(projects) {
  const map = new Map(state.data.projects.map((p) => [p.id, p]));
  projects.forEach((p) => map.set(p.id, p));
  const data = { ...state.data, projects: [...map.values()] };
  state = { ...state, data, mine: rebuildMine(data) };
  emit();
}

/** Load one invitation (by its id) into memory. Resolves to the project, or null if it doesn't exist. */
export async function loadProject(id) {
  const have = state.data.projects.find((p) => p.id === id);
  if (have) return have;
  const p = await fetchProject(id);
  if (p) putLoaded([p]);
  return p;
}

/** Resolve a couple (owner) link token to its project. */
export async function loadByOwnerToken(token) {
  const id = await backend.getToken(token);
  return id ? loadProject(id) : null;
}

let minePromise;
/** Load the signed-in user's invitations (importing old local data / seeding the example on first use). */
export function loadMine() {
  if (!minePromise) {
    const uid = uid_;
    minePromise = (async () => {
      const mine = await backend.listMine(uid);
      const hydrated = await Promise.all(mine.map((p) => hydrate(p)));
      const seededKey = `everafter.seeded.${uid}`;
      let seeded = false;
      try {
        seeded = Boolean(localStorage.getItem(seededKey));
      } catch {
        /* ignore */
      }
      if (!hydrated.length && !seeded) {
        let legacy = [];
        try {
          legacy = JSON.parse(localStorage.getItem(LEGACY_KEY))?.projects || [];
        } catch {
          legacy = [];
        }
        const starters = (legacy.length ? legacy : [exampleProject()]).map((p) => ({ ...p, ownerUid: uid }));
        try {
          localStorage.setItem(seededKey, '1');
        } catch {
          /* ignore */
        }
        starters.forEach((p) => dirty.add(p.id));
        putLoaded(starters);
        scheduleSave();
        return;
      }
      putLoaded(hydrated);
    })().catch((e) => {
      minePromise = null;
      throw e;
    });
  }
  return minePromise;
}

/* ---------- saving ---------- */
let saveTimer;
let flushing = false;

async function persist(p) {
  if (!isOwner(p)) {
    // not the designer (e.g. the couple managing guests): only the guest list may be written
    await backend.putGuests(p.id, p.guests);
    return;
  }
  const coverPhoto = await externalize(p.content.coverPhoto);
  const gallery = [];
  for (const g of p.content.gallery || []) gallery.push(await externalize(g));
  await backend.putProject({ ...p, content: { ...p.content, coverPhoto, gallery } });
  if (p.ownerToken) await backend.putToken(p.ownerToken, p.id);
}

async function flush() {
  if (flushing) return;
  flushing = true;
  const ids = [...dirty];
  dirty.clear();
  const dead = [...tombstones.entries()];
  tombstones.clear();
  let failed = false;
  try {
    for (const id of ids) {
      const p = state.data.projects.find((x) => x.id === id);
      if (p) await persist(p);
    }
    for (const [, p] of dead) await backend.putProject({ ...p, deleted: true });
    state = { ...state, save: { status: 'saved', at: Date.now(), error: '' } };
  } catch (e) {
    failed = true;
    ids.forEach((id) => dirty.add(id));
    dead.forEach(([id, p]) => tombstones.set(id, p));
    const tooBig = e && /too large|exceeds|size/i.test(String(e.message || ''));
    state = {
      ...state,
      save: {
        status: 'error',
        at: state.save.at,
        error: tooBig
          ? 'A photo is too large to save online — try a smaller one.'
          : 'Changes could not be saved — check your internet connection.',
      },
    };
  }
  flushing = false;
  if (failed) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 8000); // retry
  } else if (dirty.size || tombstones.size) {
    scheduleSave();
  }
  emit();
}

function scheduleSave() {
  state = { ...state, save: { ...state.save, status: 'saving' } };
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 700);
  emit();
}

addEventListener('beforeunload', (e) => {
  if (dirty.size || tombstones.size || flushing) {
    e.preventDefault();
    e.returnValue = '';
  }
});

function setData(next) {
  const prev = new Map(state.data.projects.map((p) => [p.id, p]));
  next.projects.forEach((p) => {
    if (prev.get(p.id) !== p) dirty.add(p.id);
  });
  state = { ...state, data: next, mine: rebuildMine(next) };
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
export const useProjects = () => useStore((s) => s.mine);
export const useProject = (id) => useStore((s) => s.data.projects.find((p) => p.id === id));
export const useSaveState = () => useStore((s) => s.save);

export function getProject(id) {
  return state.data.projects.find((p) => p.id === id);
}

export function createProject(details) {
  const p = { ...newProject(details), ownerUid: uid_ };
  setData({ ...state.data, projects: [p, ...state.data.projects] });
  return p;
}

export function deleteProject(id) {
  const projects = state.data.projects;
  const removed = projects.find((p) => p.id === id);
  dirty.delete(id);
  if (removed) tombstones.set(id, removed);
  setData({ ...state.data, projects: projects.filter((p) => p.id !== id) });
  return () => {
    tombstones.delete(id);
    // a fresh object marks it dirty, which also clears the deleted flag online
    setData({ ...state.data, projects: [...state.data.projects, { ...removed }] });
  };
}

export function restoreExample() {
  setData({ ...state.data, projects: [...state.data.projects, { ...exampleProject(), ownerUid: uid_ }] });
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
  const old = getProject(id)?.ownerToken;
  if (old) backend.putToken(old, null).catch(() => {}); // old link stops working
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
      // each photo is stored as one online document (1 MB limit), so shrink until it fits
      let q = quality;
      let out = c.toDataURL('image/jpeg', q);
      while (out.length > 850000 && q > 0.4) {
        q -= 0.1;
        out = c.toDataURL('image/jpeg', q);
      }
      resolve(out);
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
