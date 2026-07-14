import { el, icon, spinner, modal, toast } from '../ui.js';
import { api } from '../api.js';

export default function eventsView({ profile }) {
  const canCreate = profile.role === 'teacher' || profile.role === 'admin';
  const root = el('div', {});
  const grid = el('div', {}, spinner('Loading calendar'));
  let cursor = new Date(); cursor.setDate(1);
  let events = [];

  const load = () => api.get('/events').then((d) => { events = d.events; render(); }).catch((e) => grid.replaceChildren(el('div', { class: 'error-box', text: e.message })));

  function render() {
    const y = cursor.getFullYear(), mo = cursor.getMonth();
    const first = new Date(y, mo, 1); const start = new Date(first); start.setDate(1 - ((first.getDay())));
    const cells = [];
    const byDay = {};
    events.forEach((e) => { const k = new Date(e.startsAt).toDateString(); (byDay[k] = byDay[k] || []).push(e); });
    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const out = d.getMonth() !== mo;
      const isToday = d.toDateString() === new Date().toDateString();
      const dayEv = byDay[d.toDateString()] || [];
      cells.push(el('div', { class: 'cal__cell' + (out ? ' out' : '') }, [
        el('div', { class: 'cal__date' + (isToday ? ' today' : ''), text: String(d.getDate()) }),
        ...dayEv.slice(0, 3).map((e) => el('button', { class: 'cal__ev', style: 'border:0', text: e.title, onclick: () => detail(e) })),
        dayEv.length > 3 ? el('div', { class: 'helper', style: 'font-size:10px', text: '+' + (dayEv.length - 3) + ' more' }) : null,
      ]));
    }
    grid.replaceChildren(el('div', { class: 'card card--pad0' }, [
      el('div', { style: 'display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid var(--line)' }, [
        el('h3', { style: 'font-size:18px', text: cursor.toLocaleString('en', { month: 'long', year: 'numeric' }) }),
        el('div', { style: 'display:flex;gap:6px' }, [
          el('button', { class: 'iconbtn', html: icon('back'), onclick: () => { cursor.setMonth(mo - 1); render(); } }),
          el('button', { class: 'btn btn--ghost btn--sm', text: 'Today', onclick: () => { cursor = new Date(); cursor.setDate(1); render(); } }),
          el('button', { class: 'iconbtn', style: 'transform:scaleX(-1)', html: icon('back'), onclick: () => { cursor.setMonth(mo + 1); render(); } }),
        ]),
      ]),
      el('div', { class: 'cal', style: 'padding:1px' }, [...['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => el('div', { class: 'cal__dow', text: d })), ...cells]),
    ]));
  }

  function detail(e) {
    const counts = e.rsvpCounts || {};
    const rsvp = async (status) => { try { await api.post('/events/' + e._id + '/rsvp', { status }); toast('RSVP saved'); load(); m.close(); } catch (err) { toast(err.message, 'err'); } };
    const m = modal({ title: e.title, body: [
      el('span', { class: 'chip chip--gold', text: (e.category || '').replace('_', ' ') }),
      el('div', { class: 'helper', html: icon('calendar', 15) + ' ' + new Date(e.startsAt).toLocaleString('en', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) }),
      e.location ? el('div', { class: 'helper', text: '📍 ' + e.location }) : null,
      e.description ? el('div', { text: e.description }) : null,
      el('div', { class: 'helper', text: `${counts.going || 0} going · ${counts.maybe || 0} maybe` }),
      e.rsvpEnabled ? el('div', {}, [el('div', { class: 'helper', style: 'margin-bottom:6px', text: 'Will you attend?' }), el('div', { style: 'display:flex;gap:8px' }, ['going', 'maybe', 'not_going'].map((s) => el('button', { class: 'btn ' + (e.myRsvp === s ? 'btn--gold' : 'btn--ghost') + ' btn--sm', text: s.replace('_', ' '), onclick: () => rsvp(s) })))]) : null,
    ] });
  }

  function create() {
    const f = { title: el('input', { class: 'input' }), desc: el('textarea', { class: 'textarea' }), loc: el('input', { class: 'input' }),
      cat: el('select', { class: 'select' }, ['school_wide', 'pta', 'field_trip', 'classroom', 'holiday', 'other'].map((v) => el('option', { value: v, text: v.replace('_', ' ') }))),
      start: el('input', { class: 'input', type: 'datetime-local' }), end: el('input', { class: 'input', type: 'datetime-local' }) };
    const m = modal({ title: 'Create event', body: [
      el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Title' }), f.title]),
      el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Description' }), f.desc]),
      el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Location' }), f.loc]),
      el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Category' }), f.cat]),
      el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:12px' }, [
        el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Starts' }), f.start]),
        el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Ends' }), f.end]),
      ]),
    ], footer: [el('button', { class: 'btn btn--ghost', text: 'Cancel', onclick: () => m.close() }), el('button', { class: 'btn btn--gold', text: 'Create', onclick: async () => {
      if (!f.title.value || !f.start.value) { toast('Title and start time required', 'err'); return; }
      try { await api.post('/events', { title: f.title.value, description: f.desc.value, location: f.loc.value, category: f.cat.value, startsAt: f.start.value, endsAt: f.end.value || f.start.value }); m.close(); toast('Event created'); load(); } catch (e) { toast(e.message, 'err'); }
    } })] });
  }

  root.append(el('div', { class: 'page-head' }, [
    el('div', {}, [el('h1', { class: 'display', style: 'font-size:28px', text: 'EVENTS' }), el('p', { text: 'School calendar & RSVPs' })]),
    canCreate ? el('button', { class: 'btn btn--gold', html: icon('plus', 16) + ' New event', onclick: create }) : null,
  ]), grid);
  load();
  return root;
}
