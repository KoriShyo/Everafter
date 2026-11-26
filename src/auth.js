// Signed-in user state (Firebase Auth in cloud mode, a single local user otherwise).
import { useSyncExternalStore } from 'react';
import * as backend from './backend.js';
import { setUser } from './store.js';

let auth = { status: 'loading', user: null }; // status: loading | in | out
const listeners = new Set();

backend.onAuth((user) => {
  setUser(user ? user.uid : null);
  auth = { status: user ? 'in' : 'out', user };
  listeners.forEach((l) => l());
});

export function useAuth() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => auth,
  );
}

export const { signUp, signIn, signInGoogle, resetPassword, signOut } = backend;

/** Turn a Firebase error into a short message (English key; translated by the caller). */
export function authMessage(e) {
  switch (e && e.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Wrong email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in.';
    case 'auth/weak-password':
      return 'Choose a password with at least 6 characters.';
    case 'auth/invalid-email':
      return 'That email address doesn’t look right.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '';
    case 'auth/network-request-failed':
      return 'No internet connection. Please try again.';
    case 'auth/operation-not-allowed':
    case 'auth/unauthorized-domain':
      return 'This sign-in method isn’t enabled yet. Check the Firebase setup.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
