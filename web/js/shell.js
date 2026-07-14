import { el, icon, avatar, clear } from './ui.js';
import { navigate, currentPath } from './router.js';
import { getState, logout } from './auth.js';
import { toggleTheme, currentTheme } from './theme.js';
import { api } from './api.js';

const NAV = [
  { to: '/', label: 'Home', ic: 'home', roles: ['admin', 'parent', 'teacher', 'student'] },
  { to: '/messages', label: 'Messages', ic: 'chat', roles: ['admin', 'parent', 'teacher', 'student'] },
  { to: '/moderation', label: 'Moderation', ic: 'shield', roles: ['teacher', 'admin'] },
  { to: '/tickets', label: 'Tickets', ic: 'ticket', roles: ['admin', 'parent', 'teacher'] },
  { to: '/events', label: 'Events', ic: 'calendar', roles: ['admin', 'parent', 'teacher', 'student'] },
  { to: '/documents', label: 'Documents', ic: 'folder', roles: ['admin', 'parent', 'teacher'] },
  { to: '/surveys', label: 'Surveys', ic: 'clipboard', roles: ['admin', 'parent', 'teacher'] },
  { to: '/rewards', label: 'Rewards', ic: 'award', roles: ['admin', 'parent', 'teacher', 'student'] },
  { to: '/users', label: 'Users', ic: 'users', roles: ['admin'] },
  { to: '/notifications', label: 'Notifications', ic: 'bell', roles: ['admin', 'parent', 'teacher', 'student'] },
];

export function renderShell(content) {
  const { profile } = getState();
  const path = currentPath();
  const role = profile?.role;

  const rail = el('aside', { class: 'rail', id: 'rail' }, [
    el('div', { class: 'rail__brand' }, [
      el('img', { src: '/assets/logo.webp', alt: 'Saphron Sua' }),
      el('b', { text: 'Saphron Sua' }),
    ]),
    ...NAV.filter((n) => n.roles.includes(role)).map((n) =>
      el('a', {
        class: 'nav-item' + (path === n.to ? ' active' : ''),
        href: '#' + n.to,
        html: icon(n.ic) + `<span>${n.label}</span>`,
      })
    ),
    el('div', { class: 'rail__spacer' }),
    el('div', { class: 'rail__user' }, [
      avatar(profile?.displayName || '?', 36),
      el('div', { class: 'row__main' }, [
        el('b', { text: profile?.displayName || '', style: 'font-size:13px' }),
        el('small', { class: 'chip chip--gold', text: role, style: 'text-transform:capitalize' }),
      ]),
    ]),
    el('button', { class: 'nav-item', style: 'background:none;border:0;width:100%;text-align:left',
      html: icon('logout') + '<span>Sign out</span>',
      onclick: async () => { await logout(); navigate('/login'); } }),
  ]);

  const menuBtn = el('button', { class: 'iconbtn topbar__menu', html: icon('menu'),
    onclick: () => document.getElementById('rail')?.classList.toggle('open') });

  const themeBtn = el('button', { class: 'iconbtn', html: icon(currentTheme() === 'dark' ? 'sun' : 'moon'),
    onclick: (e) => { const t = toggleTheme(); e.currentTarget.innerHTML = icon(t === 'dark' ? 'sun' : 'moon'); } });

  const bell = el('a', { href: '#/notifications', class: 'iconbtn', style: 'position:relative', html: icon('bell') });
  api.get('/notifications?unread=true').then((d) => {
    if (d.unreadCount > 0) bell.appendChild(el('span', { class: 'badge-dot', text: d.unreadCount > 9 ? '9+' : String(d.unreadCount) }));
  }).catch(() => {});

  const topbar = el('div', { class: 'topbar' }, [
    menuBtn,
    el('div', { class: 'search' }, [
      el('span', { html: icon('search') }),
      el('input', { placeholder: 'Search Saphron Sua', 'aria-label': 'Search' }),
    ]),
    themeBtn,
    bell,
  ]);

  const contentWrap = el('div', { class: 'content' }, [el('div', { class: 'content__wrap' }, content)]);
  const main = el('div', { class: 'main' }, [topbar, contentWrap]);
  return el('div', { class: 'shell' }, [rail, main]);
}
