import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  OAuthProvider,
} from 'firebase/auth';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase is only initialized when a real config is present. In demo mode the
// app never touches Firebase, so a missing config is fine.
export const firebaseConfigured = Boolean(cfg.apiKey && cfg.projectId);

let auth = null;
if (firebaseConfigured) {
  const app = initializeApp(cfg);
  auth = getAuth(app);
}

/**
 * Build a fresh provider instance for a given key. Each must also be ENABLED in
 * the Firebase console (Authentication > Sign-in method); some (Apple, Facebook,
 * Microsoft, GitHub, X, Yahoo) additionally require an app registration on that
 * platform. Until enabled, the button will show a friendly "not enabled" error.
 */
export function makeProvider(key) {
  switch (key) {
    case 'google': {
      const p = new GoogleAuthProvider();
      p.setCustomParameters({ prompt: 'select_account' });
      return p;
    }
    case 'microsoft': {
      const p = new OAuthProvider('microsoft.com');
      p.setCustomParameters({ prompt: 'select_account' });
      return p;
    }
    case 'apple': {
      const p = new OAuthProvider('apple.com');
      p.addScope('email');
      p.addScope('name');
      return p;
    }
    case 'yahoo':
      return new OAuthProvider('yahoo.com');
    case 'facebook':
      return new FacebookAuthProvider();
    case 'github':
      return new GithubAuthProvider();
    case 'twitter': // X
      return new TwitterAuthProvider();
    default:
      throw new Error(`Unknown auth provider: ${key}`);
  }
}

// Backwards-compatible export used by earlier code paths.
export const googleProvider = firebaseConfigured ? makeProvider('google') : null;

export { auth };
