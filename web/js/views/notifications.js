import { el, icon, spinner, empty, timeago, toast } from '../ui.js';
import { api } from '../api.js';

const PREFS = [['messages', 'Direct messages'], ['tickets', 'Ticket updates'], ['events', 'Events & RSVPs'], ['announcements', 'Announcements'], ['surveys', 'Surveys'], ['rewards', 'Rewards & badges']];

export default function notificationsView() {
  const root = el('div', {});
  const panel = el('div', {}, spinner('Loading'));
  let tab = 'inbox';

  const tabs = el('div', { class: 'tabs', style: 'margin-bottom:16px' }, [
    el('button', { class: 'tab active', text: 'Inbox', onclick: (e) => { tab = 'inbox'; setActive(e); loadInbox(); } }),
    el('button', { class: 'tab', text: 'Settings', onclick: (e) => { tab = 'settings'; setActive(e); loadSettings(); } }),
  ]);
  const setActive = (e) => { [...e.target.parentNode.children].forEach((c) => c.classList.remove('active')); e.target.classList.add('active'); };

  function loadInbox() {
    panel.replaceChildren(spinner('Loading'));
    api.get('/notifications').then(({ notifications }) => {
      if (!notifications.length) { panel.replaceChildren(empty("You're all caught up", 'New notifications show up here.')); return; }
      panel.replaceChildren(el('div', { class: 'card card--pad0' }, el('div', { class: 'list', style: 'padding:8px' }, notifications.map((n) => el('div', { class: 'row', style: n.read ? '' : 'background:color-mix(in srgb,var(--gold) 8%,transparent)' }, [
        el('div', { style: 'width:38px;height:38px;border-radius:10px;background:var(--card-2);display:grid;place-items:center;color:var(--gold)', html: icon('bell', 16) }),
        el('div', { class: 'row__main' }, [el('b', { text: n.title }), n.body ? el('small', { text: n.body }) : null, el('div', { class: 'helper', style: 'font-size:11px', text: timeago(n.createdAt) })]),
        !n.read ? el('button', { class: 'iconbtn', html: icon('check', 16), onclick: async () => { await api.post('/notifications/' + n._id + '/read'); loadInbox(); } }) : null,
      ])))));
    }).catch((e) => panel.replaceChildren(el('div', { class: 'error-box', text: e.message })));
  }

  function loadSettings() {
    panel.replaceChildren(spinner('Loading'));
    api.get('/notifications/settings').then(({ notificationPrefs }) => {
      const prefs = notificationPrefs || {};
      const save = async (patch) => { Object.assign(prefs, patch); try { await api.patch('/notifications/settings', patch); toast('Saved'); } catch (e) { toast(e.message, 'err'); } };
      panel.replaceChildren(el('div', { class: 'card', style: 'max-width:520px' }, [
        el('div', { class: 'helper', style: 'margin-bottom:10px', text: 'Choose which in-app notifications you receive.' }),
        ...PREFS.map(([k, label]) => { const cb = el('input', { type: 'checkbox', checked: prefs[k] !== false, onchange: () => save({ [k]: cb.checked }) }); return el('label', { class: 'row', style: 'justify-content:space-between' }, [el('span', { text: label }), cb]); }),
        el('hr', { class: 'divider', style: 'margin:12px 0' }),
        el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Delivery channel' }), el('select', { class: 'select', onchange: (e) => save({ channel: e.target.value }) }, [['in_app', 'In-app only'], ['email', 'Email only'], ['both', 'In-app + email']].map(([v, t]) => el('option', { value: v, text: t, selected: (prefs.channel || 'in_app') === v })))]),
        el('div', { class: 'helper', style: 'font-size:12px', text: 'Email delivery is wired in the backend; connect a provider to enable it.' }),
      ]));
    }).catch((e) => panel.replaceChildren(el('div', { class: 'error-box', text: e.message })));
  }

  root.append(el('div', { class: 'page-head' }, [
    el('div', {}, [el('h1', { class: 'display', style: 'font-size:28px', text: 'Notifications' }), el('p', { text: 'Your inbox and preferences' })]),
    el('button', { class: 'btn btn--ghost', html: icon('check', 15) + ' Mark all read', onclick: async () => { await api.post('/notifications/read-all'); if (tab === 'inbox') loadInbox(); } }),
  ]), tabs, panel);
  loadInbox();
  return root;
}
