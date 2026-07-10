import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

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
let googleProvider = null;
if (firebaseConfigured) {
  const app = initializeApp(cfg);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
}

export { auth, googleProvider };
