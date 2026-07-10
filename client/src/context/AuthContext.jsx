import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth, makeProvider, firebaseConfigured } from '../lib/firebase.js';
import { api, setTokenProvider } from '../lib/api.js';

// Turn Firebase auth error codes into friendly messages.
function friendlyAuthError(err) {
  const code = err?.code || '';
  if (code === 'auth/operation-not-allowed')
    return "That sign-in method isn't enabled yet. Turn it on in Firebase Console > Authentication > Sign-in method.";
  if (code === 'auth/popup-closed-by-user') return 'Sign-in was cancelled.';
  if (code === 'auth/account-exists-with-different-credential')
    return 'You already have an account with this email using a different sign-in method. Use that one.';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password')
    return 'Incorrect email or password.';
  if (code === 'auth/user-not-found') return 'No account found for that email.';
  if (code === 'auth/email-already-in-use') return 'An account with that email already exists — try signing in.';
  if (code === 'auth/weak-password') return 'Password should be at least 6 characters.';
  return err?.message || 'Sign-in failed.';
}

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const DEMO_KEY = 'sua_demo_email';
const demoModeEnv = String(import.meta.env.VITE_DEMO_MODE).toLowerCase() === 'true';

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [demoEmail, setDemoEmail] = useState(() => localStorage.getItem(DEMO_KEY) || null);
  const [profile, setProfile] = useState(null); // provisioned app user (role, etc.)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Provide the token used by the API client.
  useEffect(() => {
    setTokenProvider(async () => {
      if (demoEmail) return `demo:${demoEmail}`;
      if (firebaseUser) return firebaseUser.getIdToken();
      return null;
    });
  }, [demoEmail, firebaseUser]);

  // Watch Firebase auth state (only when configured).
  useEffect(() => {
    if (!firebaseConfigured || !auth) return undefined;
    return onAuthStateChanged(auth, (u) => setFirebaseUser(u));
  }, []);

  // Load the app profile whenever identity changes.
  const loadProfile = useCallback(async () => {
    if (!demoEmail && !firebaseUser) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const { user } = await api.get('/auth/me');
      setProfile(user);
    } catch (err) {
      setError(err.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [demoEmail, firebaseUser]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const enforceDomain = async (user) => {
    const allowed = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN;
    if (allowed && !user.email?.endsWith(`@${allowed}`)) {
      await signOut(auth);
      throw new Error(`Please sign in with your @${allowed} school account.`);
    }
  };

  // Sign in with any OAuth provider (google, microsoft, apple, facebook, github, twitter, yahoo).
  const loginWithProvider = async (key) => {
    if (!firebaseConfigured) throw new Error('Sign-in is not configured. Use a demo account or add Firebase keys.');
    setError(null);
    try {
      const result = await signInWithPopup(auth, makeProvider(key));
      await enforceDomain(result.user);
    } catch (err) {
      throw new Error(friendlyAuthError(err));
    }
  };

  // Backwards-compatible helper.
  const loginWithGoogle = () => loginWithProvider('google');

  // Email + password sign-in / sign-up.
  const loginWithEmail = async (email, password) => {
    if (!firebaseConfigured) throw new Error('Sign-in is not configured.');
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await enforceDomain(result.user);
    } catch (err) {
      throw new Error(friendlyAuthError(err));
    }
  };
  const signUpWithEmail = async (email, password) => {
    if (!firebaseConfigured) throw new Error('Sign-in is not configured.');
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await enforceDomain(result.user);
    } catch (err) {
      throw new Error(friendlyAuthError(err));
    }
  };

  const loginDemo = async (email) => {
    localStorage.setItem(DEMO_KEY, email);
    setDemoEmail(email);
    setLoading(true);
  };

  const logout = async () => {
    localStorage.removeItem(DEMO_KEY);
    setDemoEmail(null);
    setProfile(null);
    if (firebaseConfigured && auth) await signOut(auth);
  };

  const value = {
    profile,
    role: profile?.role || null,
    isAuthenticated: Boolean(profile),
    loading,
    error,
    demoMode: demoModeEnv,
    firebaseConfigured,
    loginWithGoogle,
    loginWithProvider,
    loginWithEmail,
    signUpWithEmail,
    loginDemo,
    logout,
    refresh: loadProfile,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
