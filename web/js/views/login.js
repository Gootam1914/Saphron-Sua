import { el, icon } from '../ui.js';
import { LOGOS } from './providerLogos.js';
import { loginWithProvider, loginWithEmail, signUpWithEmail, firebaseConfigured, getState } from '../auth.js';
import { toggleTheme, currentTheme } from '../theme.js';

const BIG = [['google', 'Continue with Google'], ['microsoft', 'Continue with Microsoft']];

function heroMarquee() {
  const group = () => el('span', {}, [
    ...Array.from({ length: 6 }).flatMap(() => [document.createTextNode('EDUCATION FOR ALL '), el('em', { text: '✳ ' })]),
  ]);
  return el('div', { class: 'hero-marquee' }, el('div', { class: 'hero-marquee__track' }, [group(), group()]));
}

export default function loginView() {
  const errBox = el('div');
  const showErr = (m) => errBox.replaceChildren(el('div', { class: 'error-box', style: 'margin-top:14px', text: m }));
  const preErr = getState().error;
  if (preErr) showErr(preErr);

  let busy = false;
  const run = async (fn) => { if (busy) return; busy = true; try { await fn(); } catch (e) { showErr(e.message); } finally { busy = false; } };

  const hero = el('div', { class: 'login__hero' }, [
    el('div', { class: 'hero-brand' }, [
      el('span', { class: 'dashmark', style: 'width:30px;height:30px' }, el('img', { src: '/assets/logo.webp', alt: '' })),
      el('b', { text: 'Saphron Sua', style: 'font-size:17px' }),
    ]),
    el('div', { class: 'hero-body' }, [
      el('div', { class: 'hero-eyebrow', text: 'Saphron Initiative' }),
      el('h1', { class: 'hero-word', html: 'SAPHRON<span class="g">SUA</span>' }),
      el('div', { class: 'hero-rule' }),
      el('p', { class: 'hero-tag', text: 'The school’s messages, tickets, events, documents and feedback — gathered into one calm place for families, teachers and admins.' }),
    ]),
    heroMarquee(),
  ]);

  // Provider buttons: Google + Microsoft.
  const providers = el('div', {}, BIG.map(([key, label]) =>
    el('button', { class: 'provider-big', disabled: !firebaseConfigured, onclick: () => run(() => loginWithProvider(key)), html: LOGOS[key] + `<span>${label}</span>` })));

  // Always-visible email + password form.
  let mode = 'signin';
  const email = el('input', { class: 'input', type: 'email', placeholder: 'you@school.org', autocomplete: 'email' });
  const pass = el('input', { class: 'input', type: 'password', placeholder: 'Password', autocomplete: 'current-password' });
  const submit = el('button', { class: 'btn btn--gold btn--block', style: 'padding:13px', text: 'Sign in',
    onclick: () => run(() => (mode === 'signup' ? signUpWithEmail(email.value, pass.value) : loginWithEmail(email.value, pass.value))) });
  const swap = el('button', { class: 'btn btn--ghost btn--block', style: 'border:0;color:var(--muted)', text: 'New here? Create an account',
    onclick: () => {
      mode = mode === 'signup' ? 'signin' : 'signup';
      submit.textContent = mode === 'signup' ? 'Create account' : 'Sign in';
      swap.textContent = mode === 'signup' ? 'Have an account? Sign in' : 'New here? Create an account';
    } });
  email.addEventListener('keydown', (e) => e.key === 'Enter' && pass.focus());
  pass.addEventListener('keydown', (e) => e.key === 'Enter' && submit.click());

  const emailForm = el('div', { style: 'display:grid;gap:12px' }, [
    el('label', { class: 'field' }, [el('span', {}, 'Email'), email]),
    el('label', { class: 'field' }, [el('span', {}, 'Password'), pass]),
    submit,
    swap,
  ]);

  const card = el('div', { class: 'login__card' }, [
    el('div', { class: 'login__card-mobilebrand' }, el('span', { class: 'dashmark', style: 'width:34px;height:34px' }, el('img', { src: '/assets/logo.webp', width: '34', alt: '' }))),
    el('h2', { class: 'display', style: 'font-size:32px', text: 'Sign in' }),
    el('p', { class: 'helper', style: 'margin:8px 0 22px', text: 'Welcome back to Saphron Sua.' }),
    providers,
    el('div', { class: 'or', text: 'or' }),
    emailForm,
    !firebaseConfigured ? el('p', { class: 'helper', style: 'margin-top:12px', text: 'Sign-in is not configured yet.' }) : null,
    errBox,
  ]);

  const themeBtn = el('button', { class: 'iconbtn', style: 'position:absolute;top:16px;right:16px;z-index:5', html: icon(currentTheme() === 'dark' ? 'sun' : 'moon'),
    onclick: (e) => { const t = toggleTheme(); e.currentTarget.innerHTML = icon(t === 'dark' ? 'sun' : 'moon'); } });

  return el('div', { class: 'login', style: 'position:relative' }, [themeBtn, hero, el('div', { class: 'login__panel' }, card)]);
}
