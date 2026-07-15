import { el, icon, spinner, empty, modal, toast, timeago } from '../ui.js';
import { api } from '../api.js';

const STATUS = { open: 'chip--gold', in_progress: 'chip--blue', resolved: 'chip--green' };
const PRIO = { low: 'chip--mute', medium: 'chip--blue', high: 'chip--gold', urgent: 'chip--coral' };

export default function ticketsView({ profile }) {
  const isAdmin = profile.role === 'admin';
  const root = el('div', {});
  const list = el('div', {}, spinner('Loading tickets'));
  let filter = '';

  const load = () => api.get('/tickets' + (filter ? '?status=' + filter : '')).then(({ tickets }) => {
    if (!tickets.length) { list.replaceChildren(empty('No tickets', isAdmin ? 'No tickets match this filter.' : 'You have not submitted any tickets yet.')); return; }
    list.replaceChildren(el('div', { class: 'card card--pad0' }, el('div', { class: 'list', style: 'padding:8px' }, tickets.map((t) => el('button', { class: 'row', style: 'width:100%;text-align:left;background:none;border:0', onclick: () => detail(t) }, [
      el('div', { class: 'row__main' }, [el('b', { text: t.title }), el('small', { text: `#${t._id.slice(-6)} · ${t.category} · ${t.submittedBy?.displayName || ''} · ${timeago(t.createdAt)}` })]),
      el('span', { class: 'chip ' + (PRIO[t.priority] || 'chip--mute'), text: t.priority }),
      el('span', { class: 'chip ' + (STATUS[t.status] || 'chip--mute'), text: t.status.replace('_', ' ') }),
    ])))));
  }).catch((e) => list.replaceChildren(el('div', { class: 'error-box', text: e.message })));

  const tabs = el('div', { class: 'tabs', style: 'margin-bottom:16px' }, ['', 'open', 'in_progress', 'resolved'].map((s) =>
    el('button', { class: 'tab' + (filter === s ? ' active' : ''), text: s ? s.replace('_', ' ') : 'all', onclick: (e) => { filter = s; [...e.target.parentNode.children].forEach((c) => c.classList.remove('active')); e.target.classList.add('active'); load(); } })));

  function create() {
    const f = { title: el('input', { class: 'input' }), desc: el('textarea', { class: 'textarea' }),
      cat: el('select', { class: 'select' }, ['it', 'facilities', 'general'].map((v) => el('option', { value: v, text: v }))),
      prio: el('select', { class: 'select' }, ['low', 'medium', 'high', 'urgent'].map((v) => el('option', { value: v, text: v, selected: v === 'medium' }))) };
    const m = modal({ title: 'Submit a ticket', body: [
      el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Title' }), f.title]),
      el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Description' }), f.desc]),
      el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:12px' }, [
        el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Category' }), f.cat]),
        el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Priority' }), f.prio]),
      ]),
    ], footer: [el('button', { class: 'btn btn--ghost', text: 'Cancel', onclick: () => m.close() }), el('button', { class: 'btn btn--gold', text: 'Submit', onclick: async () => {
      if (!f.title.value || !f.desc.value) { toast('Title and description required', 'err'); return; }
      try { await api.post('/tickets', { title: f.title.value, description: f.desc.value, category: f.cat.value, priority: f.prio.value }); m.close(); toast('Ticket submitted'); load(); } catch (e) { toast(e.message, 'err'); }
    } })] });
  }

  async function detail(t) {
    let admins = [];
    if (isAdmin) { try { admins = (await api.get('/admin/users?role=admin')).users; } catch (e) { void e; } }
    const hist = el('div', { class: 'list' });
    const renderHist = (tk) => hist.replaceChildren(...(tk.history || []).map((h) => el('div', { style: 'display:flex;gap:8px;font-size:13px' }, [el('span', { style: 'color:var(--gold)', text: '•' }), el('div', {}, [el('b', { text: h.action.replace(/[:_]/g, ' ') }), h.note ? el('span', { class: 'helper', text: ' — ' + h.note }) : null])])));
    renderHist(t);
    const note = el('textarea', { class: 'textarea', placeholder: 'Add a comment' });
    const patch = async (b) => { try { const { ticket } = await api.patch('/tickets/' + t._id, b); renderHist(ticket); toast('Updated'); load(); } catch (e) { toast(e.message, 'err'); } };
    const adminControls = isAdmin ? el('div', { style: 'display:grid;grid-template-columns:repeat(3,1fr);gap:10px' }, [
      selField('Status', ['open', 'in_progress', 'resolved'], t.status, (v) => patch({ status: v })),
      selField('Priority', ['low', 'medium', 'high', 'urgent'], t.priority, (v) => patch({ priority: v })),
      selField('Assigned', [['', 'Unassigned'], ...admins.map((a) => [a._id, a.displayName])], t.assignedTo?._id || t.assignedTo || '', (v) => patch({ assignedTo: v })),
    ]) : null;
    modal({ size: 'lg', title: t.title, body: [
      el('div', { style: 'display:flex;gap:8px' }, [el('span', { class: 'chip ' + STATUS[t.status], text: t.status.replace('_', ' ') }), el('span', { class: 'chip ' + PRIO[t.priority], text: t.priority }), el('span', { class: 'chip chip--mute', text: t.category })]),
      el('div', { style: 'background:var(--card-2);padding:10px 12px;border-radius:12px', text: t.description }),
      adminControls,
      el('div', {}, [el('div', { class: 'helper', style: 'margin-bottom:6px', text: 'History' }), hist]),
      el('div', { style: 'display:flex;gap:8px;align-items:flex-end' }, [note, el('button', { class: 'btn btn--gold', text: 'Post', onclick: async () => { if (!note.value.trim()) return; try { const { ticket } = await api.post('/tickets/' + t._id + '/comment', { note: note.value }); note.value = ''; renderHist(ticket); } catch (e) { toast(e.message, 'err'); } } })]),
    ] });
  }

  root.append(el('div', { class: 'page-head' }, [
    el('div', {}, [el('h1', { class: 'display', style: 'font-size:28px', text: isAdmin ? 'Ticketing' : 'My tickets' }), el('p', { text: isAdmin ? 'Assign, prioritize and resolve' : 'Track your requests' })]),
    el('button', { class: 'btn btn--gold', html: icon('plus', 16) + ' New ticket', onclick: create }),
  ]), tabs, list);
  load();
  return root;
}

function selField(label, opts, val, onchange) {
  const s = el('select', { class: 'select', onchange: (e) => onchange(e.target.value) },
    opts.map((o) => { const [v, t] = Array.isArray(o) ? o : [o, o]; return el('option', { value: v, text: t, selected: v === val }); }));
  return el('label', { class: 'field' }, [el('span', { class: 'helper', text: label }), s]);
}
