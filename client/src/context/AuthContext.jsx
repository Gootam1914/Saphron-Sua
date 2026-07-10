import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, firebaseConfigured } from '../lib/firebase.js';
import { api, setTokenProvider } from '../lib/api.js';

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

  const loginWithGoogle = async () => {
    if (!firebaseConfigured) throw new Error('Google sign-in is not configured. Use a demo account or add Firebase keys.');
    setError(null);
    const result = await signInWithPopup(auth, googleProvider);
    const allowed = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN;
    if (allowed && !result.user.email?.endsWith(`@${allowed}`)) {
      await signOut(auth);
      throw new Error(`Please sign in with your @${allowed} school account.`);
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
    loginDemo,
    logout,
    refresh: loadProfile,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
