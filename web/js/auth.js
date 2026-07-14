import {
  auth, firebaseConfigured, makeProvider, onAuthStateChanged, signInWithPopup, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
} from './firebase.js';
import { api, setTokenGetter } from './api.js';
import { CONFIG } from './config.js';

const state = {
  loading: true,
  fbUser: null,
  demoEmail: localStorage.getItem('sua_demo_email') || null,
  profile: null,
  error: null,
};
const subs = new Set();
const emit = () => subs.forEach((fn) => fn(state));
export const getState = () => state;
export const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };

setTokenGetter(async () => {
  if (state.demoEmail) return 'demo:' + state.demoEmail;
  if (state.fbUser) return state.fbUser.getIdToken();
  return null;
});

async function loadProfile() {
  if (!state.demoEmail && !state.fbUser) { state.profile = null; state.loading = false; emit(); return; }
  try {
    state.error = null;
    const { user } = await api.get('/auth/me');
    state.profile = user;
  } catch (e) {
    state.error = e.message;
    state.profile = null;
  } finally {
    state.loading = false;
    emit();
  }
}

export function initAuth() {
  if (firebaseConfigured) {
    onAuthStateChanged(auth, (u) => { state.fbUser = u; loadProfile(); });
  } else {
    loadProfile();
  }
}

function enforceDomain(user) {
  const dom = CONFIG.ALLOWED_EMAIL_DOMAIN;
  if (dom && !(user.email || '').endsWith('@' + dom)) {
    signOut(auth);
    throw new Error('Please sign in with your @' + dom + ' account.');
  }
}
function friendly(err) {
  const c = err?.code || '';
  if (c === 'auth/operation-not-allowed') return "That sign-in method isn't enabled yet in Firebase.";
  if (c === 'auth/popup-closed-by-user') return 'Sign-in was cancelled.';
  if (c === 'auth/invalid-credential' || c === 'auth/wrong-password') return 'Incorrect email or password.';
  if (c === 'auth/email-already-in-use') return 'That email already has an account — sign in instead.';
  if (c === 'auth/weak-password') return 'Password must be at least 6 characters.';
  return err?.message || 'Sign-in failed.';
}

export async function loginWithProvider(key) {
  if (!firebaseConfigured) throw new Error('Sign-in is not configured.');
  try { const r = await signInWithPopup(auth, makeProvider(key)); enforceDomain(r.user); }
  catch (e) { throw new Error(friendly(e)); }
}
export async function loginWithEmail(email, password) {
  try { const r = await signInWithEmailAndPassword(auth, email, password); enforceDomain(r.user); }
  catch (e) { throw new Error(friendly(e)); }
}
export async function signUpWithEmail(email, password) {
  try { const r = await createUserWithEmailAndPassword(auth, email, password); enforceDomain(r.user); }
  catch (e) { throw new Error(friendly(e)); }
}
export function loginDemo(email) {
  localStorage.setItem('sua_demo_email', email);
  state.demoEmail = email; state.loading = true; emit(); loadProfile();
}
export async function logout() {
  localStorage.removeItem('sua_demo_email');
  state.demoEmail = null; state.profile = null;
  if (firebaseConfigured) { try { await signOut(auth); } catch (e) { void e; } }
  emit();
}
export const refresh = loadProfile;
export { firebaseConfigured };
