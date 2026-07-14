// Tiny DOM + UX helpers (no framework).
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else node.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c == null || c === false) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}
export const clear = (n) => { while (n.firstChild) n.removeChild(n.firstChild); };
export const initials = (name = '?') => name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export function avatar(name, size = 40) {
  return el('div', { class: 'avatar', style: `width:${size}px;height:${size}px;font-size:${size * 0.38}px`, text: initials(name) });
}

export function toast(message, kind) {
  const root = document.getElementById('toast-root');
  root.className = 'toast-root';
  const t = el('div', { class: 'toast' + (kind === 'err' ? ' toast--err' : ''), text: message });
  root.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 2600);
}

export function modal({ title, body, footer, size }) {
  const root = document.getElementById('modal-root');
  const close = () => clear(root);
  const scrim = el('div', { class: 'modal-scrim', onclick: (e) => { if (e.target === scrim) close(); } }, [
    el('div', { class: 'modal' + (size === 'lg' ? ' modal--lg' : '') }, [
      el('div', { class: 'modal__head' }, [
        el('h3', { text: title }),
        el('button', { class: 'iconbtn', html: icon('x'), onclick: close }),
      ]),
      el('div', { class: 'modal__body' }, body),
      footer ? el('div', { class: 'modal__foot' }, footer) : null,
    ]),
  ]);
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
  clear(root); root.appendChild(scrim);
  return { close };
}

export function spinner(label = 'Loading') {
  return el('div', { class: 'center-load' }, [el('div', { class: 'spinner' }), el('div', { text: label })]);
}
export function empty(title, sub) {
  return el('div', { class: 'empty' }, [el('b', { text: title }), sub ? el('div', { text: sub }) : null]);
}
export function timeago(d) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  if (s < 604800) return Math.floor(s / 86400) + 'd ago';
  return new Date(d).toLocaleDateString();
}

// Minimal inline icon set (stroke, currentColor). Keeps us framework-free.
const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  ticket: '<path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  clipboard: '<rect x="4" y="4" width="16" height="18" rx="2"/><path d="M9 4h6v3H9z"/>',
  award: '<circle cx="12" cy="8" r="5"/><path d="M8.5 12l-1.5 8 5-3 5 3-1.5-8"/>',
  bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3.5-6 7-6s7 2 7 6"/><path d="M17 6a3.5 3.5 0 0 1 0 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
  megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M14 8a4 4 0 0 1 0 8"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  back: '<path d="M15 18l-6-6 6-6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
};
export function icon(name, size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}
