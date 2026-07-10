import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/common/ui.jsx';

const DEMO_ACCOUNTS = [
  { email: 'admin@maplewood.edu', label: 'Admin', desc: 'Dana Okafor', tone: 'bg-violet-100 text-violet-700' },
  { email: 'teacher@maplewood.edu', label: 'Teacher', desc: 'Mr. Reyes', tone: 'bg-sky-100 text-sky-700' },
  { email: 'parent@maplewood.edu', label: 'Parent', desc: 'Priya Sharma', tone: 'bg-brand-100 text-brand-700' },
  { email: 'student@maplewood.edu', label: 'Student', desc: 'Aanya (age 8)', tone: 'bg-emerald-100 text-emerald-700' },
];

export default function Login() {
  const { isAuthenticated, loginWithGoogle, loginDemo, demoMode, firebaseConfigured, error } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState(null);

  const from = location.state?.from?.pathname || '/';
  useEffect(() => { if (isAuthenticated) nav(from, { replace: true }); }, [isAuthenticated, from, nav]);

  const handleGoogle = async () => {
    setBusy(true); setLocalError(null);
    try { await loginWithGoogle(); } catch (e) { setLocalError(e.message); } finally { setBusy(false); }
  };
  const handleDemo = async (email) => {
    setBusy(true); setLocalError(null);
    try { await loginDemo(email); } catch (e) { setLocalError(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><GraduationCap size={22} /></div>
          <span className="text-lg font-bold">Saphron Sua</span>
        </div>
        <div>
          <h1 className="max-w-md text-4xl font-bold leading-tight">One calm place for your whole school community.</h1>
          <p className="mt-4 max-w-md text-brand-100">Messaging, tickets, events, documents, surveys and rewards - replacing the scattered mix of forms, email and calendars.</p>
          <div className="mt-8 space-y-3 text-sm text-brand-50">
            <div className="flex items-center gap-2"><ShieldCheck size={18} /> Teacher-moderated student messaging</div>
            <div className="flex items-center gap-2"><HeartHandshake size={18} /> Built for healthy parent involvement</div>
          </div>
        </div>
        <p className="text-xs text-brand-200">Designed for K–5 school communities.</p>
      </div>

      {/* Auth panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white"><GraduationCap size={24} /></div>
            <h1 className="text-2xl font-bold">Saphron Sua</h1>
          </div>
          <h2 className="text-xl font-bold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-slatey">Use your school Google account to continue.</p>

          <div className="mt-6">
            <Button variant="secondary" className="w-full justify-center py-3" onClick={handleGoogle} loading={busy} disabled={!firebaseConfigured}>
              <GoogleIcon /> Continue with Google
            </Button>
            {!firebaseConfigured && (
              <p className="mt-2 text-xs text-amber-600">Google sign-in is not configured yet. Add Firebase keys to enable it, or use a demo account below.</p>
            )}
          </div>

          {(localError || error) && (
            <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{localError || error}</p>
          )}

          {demoMode && (
            <div className="mt-8">
              <div className="mb-3 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
                <span className="h-px flex-1 bg-slate-200" /> Demo accounts <span className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    onClick={() => handleDemo(a.email)}
                    disabled={busy}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-left transition-all hover:border-brand-300 hover:shadow-card disabled:opacity-50"
                  >
                    <span className={`chip ${a.tone}`}>{a.label}</span>
                    <p className="mt-2 text-sm font-medium text-ink">{a.desc}</p>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">Demo mode signs you in instantly - no password needed. Turn it off in production.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
