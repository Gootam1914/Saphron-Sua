import { el, icon, avatar, spinner, empty, toast, timeago } from '../ui.js';
import { api } from '../api.js';

export default function moderationView() {
  const root = el('div', {});
  const list = el('div', {}, spinner('Loading queue'));
  const load = () => api.get('/messages/moderation').then(({ items }) => {
    if (!items.length) { list.replaceChildren(empty('All clear', 'No student messages waiting for review.')); return; }
    list.replaceChildren(el('div', { class: 'grid', style: 'gap:12px' }, items.map((m) => el('div', { class: 'card', style: 'display:flex;gap:14px;justify-content:space-between;align-items:center;flex-wrap:wrap' }, [
      el('div', { style: 'display:flex;gap:12px;align-items:flex-start' }, [
        avatar(m.sender?.displayName || '?', 42),
        el('div', {}, [
          el('div', { style: 'display:flex;gap:8px;align-items:center;flex-wrap:wrap' }, [
            el('b', { text: m.sender?.displayName || 'Student' }),
            m.sender?.gradeLevel ? el('span', { class: 'chip chip--green', text: 'Grade ' + m.sender.gradeLevel }) : null,
            m.moderationStatus === 'flagged' ? el('span', { class: 'chip chip--coral', text: 'flagged: ' + (m.flaggedTerms || []).join(', ') }) : el('span', { class: 'chip chip--gold', text: 'pending' }),
          ]),
          el('div', { style: 'margin-top:6px;background:var(--card-2);padding:8px 12px;border-radius:12px', text: m.body }),
          el('small', { class: 'helper', text: timeago(m.createdAt) }),
        ]),
      ]),
      el('div', { style: 'display:flex;gap:8px' }, [
        el('button', { class: 'btn btn--ghost', html: icon('x', 15) + ' Reject', onclick: () => decide(m._id, 'reject') }),
        el('button', { class: 'btn btn--gold', html: icon('check', 15) + ' Approve', onclick: () => decide(m._id, 'approve') }),
      ]),
    ]))));
  }).catch((e) => list.replaceChildren(el('div', { class: 'error-box', text: e.message })));
  const decide = async (id, decision) => { try { await api.post('/messages/moderation/' + id, { decision }); toast(decision === 'approve' ? 'Approved' : 'Rejected'); load(); } catch (e) { toast(e.message, 'err'); } };

  root.append(
    el('div', { class: 'page-head' }, [el('div', {}, [el('h1', { class: 'display', style: 'font-size:28px', text: 'MODERATION' }), el('p', { text: 'Review student messages before they are delivered' })])]),
    el('div', { class: 'card', style: 'margin-bottom:16px;display:flex;gap:10px;align-items:flex-start', html: icon('shield', 18) + '<span class="helper">Every message a student sends waits here until you approve it. Approved messages are delivered; rejected ones are never sent.</span>' }),
    list,
  );
  load();
  return root;
}
