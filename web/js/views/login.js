import { el, icon, toast } from '../ui.js';
import { CONFIG } from '../config.js';
import { LOGOS } from './providerLogos.js';
import { loginWithProvider, loginWithEmail, signUpWithEmail, loginDemo, firebaseConfigured, getState } from '../auth.js';
import { toggleTheme, currentTheme } from '../theme.js';

const BIG = [['google', 'Continue with Google'], ['microsoft', 'Continue with Microsoft'], ['apple', 'Continue with Apple']];
const SMALL = [['facebook', 'Facebook'], ['github', 'GitHub'], ['twitter', 'X'], ['yahoo', 'Yahoo']];
const DEMO = [
  ['admin@maplewood.edu', 'Admin', 'Dana Okafor'],
  ['teacher@maplewood.edu', 'Teacher', 'Mr. Reyes'],
  ['parent@maplewood.edu', 'Parent', 'Priya Sharma'],
  ['student@maplewood.edu', 'Student', 'Aanya'],
];

export default function loginView() {
  const errBox = el('div');
  const showErr = (m) => { errBox.replaceChildren(el('div', { class: 'error-box', text: m })); };
  const preErr = getState().error;
  if (preErr) showErr(preErr);

  let busy = false;
  const run = async (fn) => {
    if (busy) return; busy = true;
    try { await fn(); } catch (e) { showErr(e.message); } finally { busy = false; }
  };

  const marquee = el('div', { class: 'marquee' }, [
    el('div', { class: 'marquee__track' }, [
      el('span', { class: 'login__marquee', text: 'SAPHRON SUA' }),
      el('span', { class: 'login__marquee', text: 'SAPHRON SUA' }),
      el('span', { class: 'login__marquee', text: 'SAPHRON SUA' }),
    ]),
  ]);

  const hero = el('div', { class: 'login__hero' }, [
    el('div', { style: 'display:flex;align-items:center;gap:10px' }, [
      el('img', { src: '/assets/logo.webp', width: '40', height: '40', alt: '' }),
      el('b', { text: 'Saphron Sua', style: 'font-size:18px' }),
    ]),
    el('div', {}, [
      el('h1', { class: 'display login__heroTitle', html: 'ONE PLACE FOR<br>YOUR WHOLE<br><span class="g">SCHOOL.</span>' }),
      el('p', { style: 'max-width:460px;color:#c9ccd2;margin-top:18px;font-size:16px',
        text: 'Messaging, tickets, events, documents, surveys and rewards, together at last, for families, teachers and admins.' }),
      el('div', { style: 'margin-top:26px' }, marquee),
    ]),
    el('p', { style: 'color:#8b909a;font-size:12px', text: 'Built for K-5 school communities.' }),
  ]);

  const providerButtons = el('div', {}, BIG.map(([key, label]) =>
    el('button', { class: 'provider-big', disabled: !firebaseConfigured, onclick: () => run(() => loginWithProvider(key)), html: LOGOS[key] + `<span>${label}</span>` })
  ));

  const smallRow = el('div', { class: 'provider-row' }, [
    ...SMALL.map(([key, label]) =>
      el('button', { class: 'provider-icon', title: label, 'aria-label': label, disabled: !firebaseConfigured, onclick: () => run(() => loginWithProvider(key)), html: LOGOS[key] })),
    el('button', { class: 'provider-icon', title: 'Email', 'aria-label': 'Email', disabled: !firebaseConfigured, onclick: showEmail, html: icon('mail', 20) }),
  ]);

  const primary = el('div', {}, [
    providerButtons,
    el('div', { class: 'or', text: 'or continue with' }),
    smallRow,
    !firebaseConfigured ? el('p', { class: 'helper', style: 'margin-top:12px', text: 'Sign-in is not configured yet.' }) : null,
  ]);

  const card = el('div', { class: 'login__card reveal' }, [
    el('h2', { class: 'display', style: 'font-size:34px', text: 'Sign in' }),
    el('p', { class: 'helper', style: 'margin:6px 0 22px', text: 'Welcome back. Choose how to continue.' }),
    primary,
    errBox,
  ]);

  function showEmail() {
    let mode = 'signin';
    const email = el('input', { class: 'input', type: 'email', placeholder: 'you@school.org' });
    const pass = el('input', { class: 'input', type: 'password', placeholder: 'Password' });
    const submit = el('button', { class: 'btn btn--gold btn--block', text: 'Sign in',
      onclick: () => run(() => (mode === 'signup' ? signUpWithEmail(email.value, pass.value) : loginWithEmail(email.value, pass.value))) });
    const swap = el('button', { class: 'btn btn--ghost btn--block', style: 'border:0', text: 'New here? Create an account',
      onclick: () => { mode = mode === 'signup' ? 'signin' : 'signup'; submit.textContent = mode === 'signup' ? 'Create account' : 'Sign in'; swap.textContent = mode === 'signup' ? 'Have an account? Sign in' : 'New here? Create an account'; } });
    primary.replaceChildren(
      el('button', { class: 'btn btn--ghost btn--sm', style: 'border:0;margin-bottom:8px', html: icon('back', 15) + ' All sign-in options', onclick: () => primary.replaceChildren(providerButtons, el('div', { class: 'or', text: 'or continue with' }), smallRow) }),
      el('div', { style: 'display:grid;gap:12px' }, [
        el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Email' }), email]),
        el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Password' }), pass]),
        submit, swap,
      ]),
    );
  }

  if (CONFIG.DEMO_MODE) {
    card.appendChild(el('div', { class: 'or', text: 'demo accounts' }));
    card.appendChild(el('div', { class: 'demo-grid' }, DEMO.map(([em, label, name]) =>
      el('button', { class: 'demo-btn', onclick: () => run(async () => { loginDemo(em); toast('Signed in as ' + label); }) }, [
        el('span', { class: 'chip chip--gold', text: label }),
        el('div', { style: 'margin-top:6px;font-weight:600', text: name }),
      ]))));
  }

  const themeBtn = el('button', { class: 'iconbtn', style: 'position:absolute;top:16px;right:16px;z-index:5', html: icon(currentTheme() === 'dark' ? 'sun' : 'moon'),
    onclick: (e) => { const t = toggleTheme(); e.currentTarget.innerHTML = icon(t === 'dark' ? 'sun' : 'moon'); } });

  return el('div', { class: 'login', style: 'position:relative' }, [themeBtn, hero, el('div', { class: 'login__panel' }, card)]);
}
