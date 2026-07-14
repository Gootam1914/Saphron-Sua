import { initTheme } from './theme.js';
import { initAuth, getState, subscribe } from './auth.js';
import { route, setNavigateHandler, resolve, navigate } from './router.js';
import { renderShell } from './shell.js';
import { el, spinner, icon } from './ui.js';

import loginView from './views/login.js';
import dashboardView from './views/dashboard.js';
import messagesView from './views/messages.js';
import moderationView from './views/moderation.js';
import ticketsView from './views/tickets.js';
import eventsView from './views/events.js';
import documentsView from './views/documents.js';
import surveysView from './views/surveys.js';
import rewardsView from './views/rewards.js';
import notificationsView from './views/notifications.js';
import usersView from './views/users.js';

route('/login', loginView, { public: true });
route('/', dashboardView);
route('/messages', messagesView);
route('/messages/:id', messagesView);
route('/moderation', moderationView, { roles: ['teacher', 'admin'] });
route('/tickets', ticketsView, { roles: ['admin', 'parent', 'teacher'] });
route('/events', eventsView);
route('/documents', documentsView, { roles: ['admin', 'parent', 'teacher'] });
route('/surveys', surveysView, { roles: ['admin', 'parent', 'teacher'] });
route('/rewards', rewardsView);
route('/notifications', notificationsView);
route('/users', usersView, { roles: ['admin'] });
route('/404', () => el('div', { class: 'empty' }, [el('b', { text: 'Page not found' })]), { public: true });

const app = document.getElementById('app');
const mount = (node) => { app.replaceChildren(node); };

setNavigateHandler((found, path) => {
  const st = getState();
  if (st.loading) { mount(el('div', { style: 'display:grid;place-items:center;min-height:100vh' }, spinner('Loading Saphron Sua'))); return; }

  const isPublic = found?.opts?.public;
  if (!st.profile && !isPublic) { navigate('/login'); return; }
  if (st.profile && path === '/login') { navigate('/'); return; }
  if (!found) { navigate('/404'); return; }
  if (found.opts?.roles && !found.opts.roles.includes(st.profile?.role)) { navigate('/'); return; }

  const node = found.render({ params: found.params || {}, profile: st.profile });
  mount(isPublic ? node : renderShell(node));
});

// Re-resolve whenever auth state changes (login/logout/profile load).
let lastKey = '';
subscribe((st) => {
  const key = `${st.loading}|${st.profile?._id || ''}|${st.error || ''}`;
  if (key !== lastKey) { lastKey = key; resolve(); }
});

initTheme();
initAuth();
resolve();
