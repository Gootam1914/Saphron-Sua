import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, ShieldCheck, HeartHandshake, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Input } from '../components/common/ui.jsx';
import ThemeToggle from '../components/common/ThemeToggle.jsx';
import {
  GoogleLogo, MicrosoftLogo, AppleLogo, FacebookLogo, GithubLogo, XLogo, YahooLogo,
} from '../components/common/ProviderIcons.jsx';

// The most-used providers get big rectangular buttons.
const BIG = [
  { key: 'google', label: 'Continue with Google', Logo: GoogleLogo },
  { key: 'microsoft', label: 'Continue with Microsoft', Logo: MicrosoftLogo },
  { key: 'apple', label: 'Continue with Apple', Logo: AppleLogo },
];
// The rest are compact logo-only icons.
const SMALL = [
  { key: 'facebook', label: 'Facebook', Logo: FacebookLogo },
  { key: 'github', label: 'GitHub', Logo: GithubLogo },
  { key: 'twitter', label: 'X', Logo: XLogo },
  { key: 'yahoo', label: 'Yahoo', Logo: YahooLogo },
];

const DEMO_ACCOUNTS = [
  { email: 'admin@maplewood.edu', label: 'Admin', desc: 'Dana Okafor', tone: 'bg-violet-100 text-violet-700' },
  { email: 'teacher@maplewood.edu', label: 'Teacher', desc: 'Mr. Reyes', tone: 'bg-sky-100 text-sky-700' },
  { email: 'parent@maplewood.edu', label: 'Parent', desc: 'Priya Sharma', tone: 'bg-brand-100 text-brand-700' },
  { email: 'student@maplewood.edu', label: 'Student', desc: 'Aanya (age 8)', tone: 'bg-emerald-100 text-emerald-700' },
];

export default function Login() {
  const {
    isAuthenticated, loginWithProvider, loginWithEmail, signUpWithEmail,
    loginDemo, demoMode, firebaseConfigured, error,
  } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [showEmail, setShowEmail] = useState(false);
  const [emailMode, setEmailMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const from = location.state?.from?.pathname || '/';
  useEffect(() => { if (isAuthenticated) nav(from, { replace: true }); }, [isAuthenticated, from, nav]);

  const run = async (fn) => {
    setBusy(true); setLocalError(null);
    try { await fn(); } catch (e) { setLocalError(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="relative grid min-h-screen bg-surface lg:grid-cols-2">
      <ThemeToggle className="absolute right-4 top-4 z-10" />

      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><GraduationCap size={22} /></div>
          <span className="text-lg font-bold">Saphron Sua</span>
        </div>
        <div>
          <h1 className="max-w-md text-4xl font-bold leading-tight">One calm place for your whole school community.</h1>
          <p className="mt-4 max-w-md text-brand-50">Messaging, tickets, events, documents, surveys and rewards, replacing the scattered mix of forms, email and calendars.</p>
          <div className="mt-8 space-y-3 text-sm text-brand-50">
            <div className="flex items-center gap-2"><ShieldCheck size={18} /> Teacher-moderated student messaging</div>
            <div className="flex items-center gap-2"><HeartHandshake size={18} /> Built for healthy parent involvement</div>
          </div>
        </div>
        <p className="text-xs text-brand-100">Designed for K-5 school communities.</p>
      </div>

      {/* Auth panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white"><GraduationCap size={24} /></div>
            <h1 className="text-2xl font-bold text-ink">Saphron Sua</h1>
          </div>
          <h2 className="text-xl font-bold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-slatey">Choose how to continue.</p>

          {!showEmail ? (
            <>
              {/* Big provider buttons */}
              <div className="mt-6 space-y-2.5">
                {BIG.map(({ key, label, Logo }) => (
                  <button
                    key={key}
                    onClick={() => run(() => loginWithProvider(key))}
                    disabled={busy || !firebaseConfigured}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-card px-4 py-3 text-sm font-semibold text-ink transition-all hover:bg-muted disabled:opacity-50"
                  >
                    <Logo /> {label}
                  </button>
                ))}
              </div>

              {/* Small icon buttons + email */}
              <div className="mt-4">
                <p className="mb-2 text-center text-xs text-slate-400">Or continue with</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {SMALL.map(({ key, label, Logo }) => (
                    <button
                      key={key}
                      onClick={() => run(() => loginWithProvider(key))}
                      disabled={busy || !firebaseConfigured}
                      title={label}
                      aria-label={label}
                      className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-card transition-all hover:bg-muted disabled:opacity-50"
                    >
                      <Logo />
                    </button>
                  ))}
                  <button
                    onClick={() => { setShowEmail(true); setLocalError(null); }}
                    disabled={!firebaseConfigured}
                    title="Email & password"
                    aria-label="Email & password"
                    className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-card text-slatey transition-all hover:bg-muted disabled:opacity-50"
                  >
                    <Mail size={20} />
                  </button>
                </div>
              </div>

              {!firebaseConfigured && (
                <p className="mt-3 text-xs text-amber-600">Sign-in is not configured yet. Add Firebase keys to enable it, or use a demo account below.</p>
              )}
            </>
          ) : (
            /* Email + password form */
            <div className="mt-6">
              <button onClick={() => setShowEmail(false)} className="mb-3 flex items-center gap-1 text-sm text-slatey hover:text-ink">
                <ArrowLeft size={15} /> Back to all options
              </button>
              <div className="space-y-3">
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.org" />
                <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                <Button
                  className="w-full justify-center py-3"
                  loading={busy}
                  onClick={() => run(() => (emailMode === 'signup' ? signUpWithEmail(email, password) : loginWithEmail(email, password)))}
                >
                  {emailMode === 'signup' ? 'Create account' : 'Sign in'}
                </Button>
                <button
                  onClick={() => setEmailMode((m) => (m === 'signup' ? 'signin' : 'signup'))}
                  className="w-full text-center text-sm text-slatey hover:text-ink"
                >
                  {emailMode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}
                </button>
              </div>
            </div>
          )}

          {(localError || error) && (
            <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{localError || error}</p>
          )}

          {demoMode && (
            <div className="mt-8">
              <div className="mb-3 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
                <span className="h-px flex-1 bg-line" /> Demo accounts <span className="h-px flex-1 bg-line" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    onClick={() => run(() => loginDemo(a.email))}
                    disabled={busy}
                    className="rounded-xl border border-line bg-card p-3 text-left transition-all hover:border-brand-300 hover:shadow-card disabled:opacity-50"
                  >
                    <span className={`chip ${a.tone}`}>{a.label}</span>
                    <p className="mt-2 text-sm font-medium text-ink">{a.desc}</p>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">Demo mode signs you in instantly, no password needed. Turn it off in production.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
