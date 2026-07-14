import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithPopup, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  GoogleAuthProvider, FacebookAuthProvider, GithubAuthProvider, TwitterAuthProvider, OAuthProvider,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { CONFIG } from './config.js';

export const firebaseConfigured = Boolean(CONFIG.FIREBASE.apiKey && CONFIG.FIREBASE.projectId);
const app = firebaseConfigured ? initializeApp(CONFIG.FIREBASE) : null;
export const auth = app ? getAuth(app) : null;

export function makeProvider(key) {
  switch (key) {
    case 'google': { const p = new GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' }); return p; }
    case 'microsoft': { const p = new OAuthProvider('microsoft.com'); p.setCustomParameters({ prompt: 'select_account' }); return p; }
    case 'apple': { const p = new OAuthProvider('apple.com'); p.addScope('email'); p.addScope('name'); return p; }
    case 'yahoo': return new OAuthProvider('yahoo.com');
    case 'facebook': return new FacebookAuthProvider();
    case 'github': return new GithubAuthProvider();
    case 'twitter': return new TwitterAuthProvider();
    default: throw new Error('Unknown provider ' + key);
  }
}

export {
  onAuthStateChanged, signInWithPopup, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
};
