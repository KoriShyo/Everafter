// Storage + accounts. Cloud mode = Firebase (Auth + Firestore); otherwise a single local user and localStorage.
// Collections: projects/{id}, images/{hash}, coupleTokens/{token}
import { firebaseConfig } from './firebaseConfig.js';

export const cloud = Boolean(firebaseConfig.projectId);
export const LOCAL_UID = 'local';

/* ---------- Firebase boot ---------- */
let bootPromise;
function boot() {
  if (!bootPromise) {
    bootPromise = Promise.all([import('firebase/app'), import('firebase/firestore/lite'), import('firebase/auth')]).then(
      async ([appMod, m, a]) => {
        const app = appMod.initializeApp(firebaseConfig);
        const auth = a.getAuth(app);
        await auth.authStateReady(); // so Firestore requests carry the signed-in user's token
        return { m, a, auth, db: m.getFirestore(app) };
      },
    );
  }
  return bootPromise;
}

/* ---------- accounts ---------- */
const toUser = (u) => (u ? { uid: u.uid, email: u.email || '', name: u.displayName || '' } : null);

/** Calls cb with the signed-in user (or null) now and whenever it changes. Returns an unsubscribe. */
export function onAuth(cb) {
  if (!cloud) {
    cb({ uid: LOCAL_UID, email: '', name: '' });
    return () => {};
  }
  let off = () => {};
  let dead = false;
  boot()
    .then(({ a, auth }) => {
      if (!dead) off = a.onAuthStateChanged(auth, (u) => cb(toUser(u)));
    })
    .catch(() => !dead && cb(null));
  return () => {
    dead = true;
    off();
  };
}

export async function signUp(name, email, password) {
  const { a, auth } = await boot();
  const cred = await a.createUserWithEmailAndPassword(auth, email, password);
  if (name) await a.updateProfile(cred.user, { displayName: name });
  return toUser({ ...cred.user, displayName: name || cred.user.displayName });
}
export async function signIn(email, password) {
  const { a, auth } = await boot();
  return toUser((await a.signInWithEmailAndPassword(auth, email, password)).user);
}
export async function signInGoogle() {
  const { a, auth } = await boot();
  return toUser((await a.signInWithPopup(auth, new a.GoogleAuthProvider())).user);
}
export async function resetPassword(email) {
  const { a, auth } = await boot();
  await a.sendPasswordResetEmail(auth, email);
}
export async function signOut() {
  if (!cloud) return;
  const { a, auth } = await boot();
  await a.signOut(auth);
}

/* ---------- Firestore ---------- */
async function cloudGet(col, id) {
  const { m, db } = await boot();
  const snap = await m.getDoc(m.doc(db, col, id));
  return snap.exists() ? snap.data() : null;
}
async function cloudSet(col, id, data) {
  const { m, db } = await boot();
  await m.setDoc(m.doc(db, col, id), data);
}

/* ---------- localStorage fallback ---------- */
const lk = (col, id) => `everafter.local.${col}.${id}`;
async function localGet(col, id) {
  try {
    const raw = localStorage.getItem(lk(col, id));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
async function localSet(col, id, data) {
  localStorage.setItem(lk(col, id), JSON.stringify(data));
}

const get = cloud ? cloudGet : localGet;
const set = cloud ? cloudSet : localSet;

/* ---------- projects ---------- */
// Stored as { id, ownerUid, updatedAt, deleted, json, guestsJson }. Nested data lives in JSON strings so Firestore never
// trips on nested arrays; guests are a separate field so a couple (not signed in) can update only the guest list.
function fromDoc(d) {
  if (!d || !d.json || d.deleted) return null;
  const p = JSON.parse(d.json);
  p.guests = d.guestsJson ? JSON.parse(d.guestsJson) : [];
  return p;
}
export async function getProject(id) {
  return fromDoc(await get('projects', id));
}
export const putProject = (p) =>
  set('projects', p.id, {
    id: p.id,
    ownerUid: p.ownerUid || null,
    updatedAt: p.updatedAt || Date.now(),
    deleted: Boolean(p.deleted),
    json: JSON.stringify({ ...p, guests: [] }),
    guestsJson: JSON.stringify(p.guests || []),
  });

/** Guest-list-only update (what a couple is allowed to do). */
export async function putGuests(id, guests) {
  const patch = { guestsJson: JSON.stringify(guests || []), updatedAt: Date.now() };
  if (!cloud) {
    const d = await localGet('projects', id);
    if (d) await localSet('projects', id, { ...d, ...patch });
    return;
  }
  const { m, db } = await boot();
  await m.updateDoc(m.doc(db, 'projects', id), patch);
}

/** All invitations owned by `uid`. */
export async function listMine(uid) {
  if (!cloud) {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('everafter.local.projects.')) {
        try {
          out.push(fromDoc(JSON.parse(localStorage.getItem(k))));
        } catch {
          /* skip */
        }
      }
    }
    return out.filter((p) => p && p.ownerUid === uid);
  }
  const { m, db } = await boot();
  const snap = await m.getDocs(m.query(m.collection(db, 'projects'), m.where('ownerUid', '==', uid)));
  return snap.docs.map((d) => fromDoc(d.data())).filter(Boolean);
}

/* ---------- images + couple tokens ---------- */
export async function getImage(hash) {
  const d = await get('images', hash);
  return d ? d.data : null;
}
export const putImage = (hash, data) => set('images', hash, { data });

export async function getToken(token) {
  const d = await get('coupleTokens', token);
  return d ? d.projectId || null : null;
}
export const putToken = (token, projectId) => set('coupleTokens', token, { projectId: projectId || null });
