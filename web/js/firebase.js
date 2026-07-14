import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  GoogleAuthProvider, OAuthProvider,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { CONFIG } from './config.js';

export const firebaseConfigured = Boolean(CONFIG.FIREBASE.apiKey && CONFIG.FIREBASE.projectId);
const app = firebaseConfigured ? initializeApp(CONFIG.FIREBASE) : null;
export const auth = app ? getAuth(app) : null;

export function makeProvider(key) {
  switch (key) {
    case 'google': { const p = new GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' }); return p; }
    case 'microsoft': { const p = new OAuthProvider('microsoft.com'); p.setCustomParameters({ prompt: 'select_account' }); return p; }
    default: throw new Error('Unknown provider ' + key);
  }
}

export {
  onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
};
