import { el, icon, spinner, empty } from '../ui.js';
import { api } from '../api.js';
import { navigate } from '../router.js';

const stat = (ic, tone, value, label, hint) => el('div', { class: 'card stat' }, [
  el('div', { class: 'stat__ico ' + (tone || ''), html: icon(ic, 22) }),
  el('div', {}, [el('b', { text: String(value ?? 0) }), el('span', { text: label }), hint ? el('div', { class: 'helper', style: 'font-size:12px', text: hint }) : null]),
]);

const action = (to, ic, title, sub) => el('a', { href: '#' + to, class: 'action' }, [
  el('div', { class: 'action__ico', html: icon(ic, 20) }),
  el('div', {}, [el('b', { text: title }), el('span', { text: sub })]),
]);

function eventsCard(events = []) {
  return el('div', { class: 'card' }, [
    el('h3', { style: 'font-size:16px;margin-bottom:12px', text: 'Upcoming events' }),
    events.length === 0 ? empty('Nothing scheduled', 'New events show up here.') :
      el('div', { class: 'list' }, events.map((e) => {
        const d = new Date(e.startsAt);
        return el('a', { href: '#/events', class: 'row' }, [
          el('div', { style: 'width:44px;height:44px;border-radius:12px;background:var(--card-2);display:grid;place-items:center;text-align:center;line-height:1' }, [
            el('div', { class: 'chip--gold', style: 'font-size:10px;font-weight:800;color:var(--gold)', text: d.toLocaleString('en', { month: 'short' }).toUpperCase() }),
            el('div', { style: 'font-weight:800', text: String(d.getDate()) }),
          ]),
          el('div', { class: 'row__main' }, [el('b', { text: e.title }), el('small', { text: d.toLocaleString('en', { weekday: 'short', hour: 'numeric', minute: '2-digit' }) + (e.location ? ' · ' + e.location : '') })]),
        ]);
      })),
  ]);
}

export default function dashboardView({ profile }) {
  const root = el('div', {}, spinner('Loading your dashboard'));
  const first = (profile.displayName || '').split(' ')[0];

  api.get('/dashboard').then((d) => {
    const head = el('div', { class: 'page-head reveal' }, [
      el('div', {}, [
        el('span', { class: 'eyebrow', text: profile.role }),
        el('h1', { class: 'display', style: 'font-size:32px;margin-top:6px', text: (d.role === 'student' ? 'Hi, ' : 'Welcome, ') + (first || '') }),
        el('p', { text: role_subtitle(d.role) }),
      ]),
    ]);

    let stats, actions;
    if (d.role === 'admin') {
      stats = [
        stat('ticket', '', d.tickets?.open, 'Open tickets', (d.tickets?.inProgress || 0) + ' in progress'),
        stat('shield', 'coral', d.pendingModeration, 'Messages to review'),
        stat('users', 'grape', d.totalUsers, 'Active users'),
        stat('chat', 'blue', d.unreadMessages, 'Unread messages'),
      ];
      actions = [
        action('/tickets', 'ticket', 'Ticketing dashboard', 'Assign, prioritize, resolve'),
        action('/users', 'users', 'User management', 'Roles & permissions'),
        action('/surveys', 'clipboard', 'Survey builder', 'Create & analyze feedback'),
        action('/messages', 'megaphone', 'Announcements', 'Message the community'),
      ];
    } else if (d.role === 'teacher') {
      stats = [
        stat('shield', 'coral', d.pendingModeration, 'Student messages to review'),
        stat('chat', 'blue', d.unreadMessages, 'Unread messages'),
        stat('clipboard', '', d.mySurveys, 'My surveys'),
        stat('ticket', 'grape', d.myOpenTickets, 'My open tickets'),
      ];
      actions = [
        action('/moderation', 'shield', 'Moderation queue', 'Approve student messages'),
        action('/messages', 'megaphone', 'Broadcast to class', 'Send an announcement'),
        action('/events', 'calendar', 'Create an event', 'Field trips, meetings'),
        action('/documents', 'folder', 'Upload a document', 'Slips, newsletters'),
        action('/rewards', 'award', 'Award a badge', 'Recognize good behavior'),
        action('/surveys', 'clipboard', 'Build a survey', 'Post-lesson feedback'),
      ];
    } else if (d.role === 'parent') {
      stats = [
        stat('chat', 'blue', d.unreadMessages, 'Unread messages'),
        stat('ticket', '', d.myOpenTickets, 'My open tickets'),
        stat('award', 'grape', d.childRewardCount, 'Badges earned', 'by your children'),
        stat('bell', 'coral', d.unreadNotifications, 'Notifications'),
      ];
      actions = [
        action('/messages', 'chat', 'Message a teacher', 'Parent to teacher'),
        action('/documents', 'pen', 'Sign permission slips', 'Digital signature'),
        action('/tickets', 'ticket', 'Submit a ticket', 'IT, facilities, general'),
        action('/events', 'calendar', 'RSVP to events', 'PTA, field trips'),
      ];
    } else {
      stats = [
        stat('trophy', '', d.totalPoints, 'Star points'),
        stat('award', 'grape', (d.recentBadges || []).length, 'Badges earned'),
        stat('chat', 'blue', d.unreadMessages, 'Messages'),
        stat('bell', 'coral', d.unreadNotifications, 'Updates'),
      ];
      actions = [
        action('/messages', 'chat', 'Message my teacher', 'Ask a question'),
        action('/rewards', 'award', 'My badges', 'See what you earned'),
        action('/events', 'calendar', "What's happening", 'Fun events'),
        action('/notifications', 'bell', 'Updates', "See what's new"),
      ];
    }

    root.replaceChildren(
      head,
      el('div', { class: 'grid grid--stats reveal d1', style: 'margin-bottom:16px' }, stats),
      el('div', { style: 'display:grid;grid-template-columns:1.6fr 1fr;gap:16px;align-items:start', class: 'reveal d2' }, [
        el('div', { class: 'card' }, [
          el('h3', { style: 'font-size:16px;margin-bottom:12px', text: 'Quick actions' }),
          el('div', { class: 'grid grid--2' }, actions),
        ]),
        eventsCard(d.upcomingEvents),
      ]),
    );
    // responsive: collapse two-col on small screens
    const two = root.querySelector('[style*="grid-template-columns:1.6fr"]');
    if (two && window.matchMedia('(max-width: 860px)').matches) two.style.gridTemplateColumns = '1fr';
  }).catch((e) => root.replaceChildren(el('div', { class: 'error-box', text: e.message })));

  return root;
}

function role_subtitle(role) {
  return { admin: 'School-wide overview', teacher: 'Your classroom at a glance', parent: 'Your family at a glance', student: 'You have new things to see!' }[role] || '';
}
