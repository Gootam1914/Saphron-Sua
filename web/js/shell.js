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
  { to: '/settings', label: 'Settings', ic: 'settings', roles: ['admin'] },
  { to: '/notifications', label: 'Notifications', ic: 'bell', roles: ['admin', 'parent', 'teacher', 'student'] },
];

export function renderShell(content) {
  const { profile } = getState();
  const path = currentPath();
  const role = profile?.role;

  const orgName = el('span', { class: 'rail__org', text: '' });
  api.get('/auth/org').then((d) => { if (d.org?.name) orgName.textContent = d.org.name; }).catch(() => {});

  const rail = el('aside', { class: 'rail', id: 'rail' }, [
    el('div', { class: 'rail__brand' }, [
      el('span', { class: 'dashmark', style: 'width:34px;height:34px;color:var(--gold)' }, el('img', { src: '/assets/logo.webp', alt: '' })),
      el('div', {}, [el('b', { text: 'Saphron Sua' }), orgName]),
    ]),
    el('nav', { class: 'rail__nav' },
      NAV.filter((n) => n.roles.includes(role)).map((n) =>
        el('a', { class: 'nav-item' + (path === n.to ? ' active' : ''), href: '#' + n.to, html: icon(n.ic) + `<span>${n.label}</span>` })
      )),
  ]);

  // ---- top bar (user menu lives here, top-right) ----
  const menuBtn = el('button', { class: 'iconbtn topbar__menu', html: icon('menu'),
    onclick: () => document.getElementById('rail')?.classList.toggle('open') });

  const themeBtn = el('button', { class: 'iconbtn', title: 'Toggle theme', html: icon(currentTheme() === 'dark' ? 'sun' : 'moon'),
    onclick: (e) => { const t = toggleTheme(); e.currentTarget.innerHTML = icon(t === 'dark' ? 'sun' : 'moon'); } });

  const bell = el('a', { href: '#/notifications', class: 'iconbtn', style: 'position:relative', html: icon('bell') });
  api.get('/notifications?unread=true').then((d) => {
    if (d.unreadCount > 0) bell.appendChild(el('span', { class: 'badge-dot', text: d.unreadCount > 9 ? '9+' : String(d.unreadCount) }));
  }).catch(() => {});

  // User menu: avatar button + dropdown
  const menuPanel = el('div', { class: 'usermenu__panel', hidden: true }, [
    el('div', { class: 'usermenu__head' }, [
      avatar(profile?.displayName || '?', 40),
      el('div', { style: 'min-width:0' }, [
        el('b', { text: profile?.displayName || '', style: 'display:block;overflow:hidden;text-overflow:ellipsis' }),
        el('small', { class: 'helper', text: profile?.email || '' }),
      ]),
    ]),
    el('div', { class: 'usermenu__role' }, el('span', { class: 'chip chip--gold', style: 'text-transform:capitalize', text: role })),
    el('hr', { class: 'divider' }),
    role === 'admin' ? el('a', { href: '#/settings', class: 'usermenu__item', html: icon('settings', 16) + '<span>Organization settings</span>', onclick: () => toggle(false) }) : null,
    el('a', { href: '#/notifications', class: 'usermenu__item', html: icon('bell', 16) + '<span>Notifications</span>', onclick: () => toggle(false) }),
    el('button', { class: 'usermenu__item', html: icon('logout', 16) + '<span>Sign out</span>', onclick: async () => { await logout(); navigate('/login'); } }),
  ]);
  const avatarBtn = el('button', { class: 'usermenu__btn', 'aria-label': 'Account', onclick: (e) => { e.stopPropagation(); toggle(); } }, [
    avatar(profile?.displayName || '?', 34),
  ]);
  function toggle(force) {
    const show = force === undefined ? menuPanel.hidden : force;
    menuPanel.hidden = !show;
  }
  document.addEventListener('click', () => { menuPanel.hidden = true; }, { once: false });
  const userMenu = el('div', { class: 'usermenu', onclick: (e) => e.stopPropagation() }, [avatarBtn, menuPanel]);

  const topbar = el('div', { class: 'topbar' }, [
    menuBtn,
    el('div', { class: 'search' }, [el('span', { html: icon('search') }), el('input', { placeholder: 'Search Saphron Sua', 'aria-label': 'Search' })]),
    el('div', { style: 'display:flex;align-items:center;gap:6px' }, [themeBtn, bell, userMenu]),
  ]);

  const contentWrap = el('div', { class: 'content' }, [el('div', { class: 'content__wrap' }, content)]);
  const main = el('div', { class: 'main' }, [topbar, contentWrap]);
  return el('div', { class: 'shell' }, [rail, main]);
}
