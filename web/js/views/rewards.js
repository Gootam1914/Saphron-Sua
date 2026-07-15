import { el, icon, spinner, empty, modal, toast } from '../ui.js';
import { api } from '../api.js';

export default function rewardsView({ profile }) {
  const isStudent = profile.role === 'student';
  const canGrant = profile.role === 'teacher' || profile.role === 'admin';
  const root = el('div', {});
  const body = el('div', {}, spinner('Loading badges'));

  const load = () => api.get('/rewards').then((d) => {
    const hero = isStudent ? el('div', { class: 'card', style: 'display:flex;gap:16px;align-items:center;margin-bottom:16px;background:linear-gradient(120deg,rgba(250,199,39,.18),rgba(255,81,79,.14))' }, [
      el('div', { class: 'badge-ico', style: 'width:60px;height:60px', html: icon('trophy', 28) }),
      el('div', {}, [el('b', { style: 'font-size:22px', text: d.totalPoints + ' star points' }), el('div', { class: 'helper', text: d.rewards.length + ' badges earned. Amazing!' })]),
    ]) : null;
    const gridEl = d.rewards.length === 0 ? empty('No badges yet', isStudent ? 'Keep being awesome!' : 'Awarded badges appear here.')
      : el('div', { class: 'grid grid--3' }, d.rewards.map((r) => el('div', { class: 'card badge-card' }, [
        el('div', { class: 'badge-ico', html: icon('award', 30) }),
        el('b', { text: r.badge?.label || 'Badge' }),
        !isStudent && r.student ? el('span', { class: 'chip chip--green', text: r.student.displayName }) : null,
        r.reason ? el('div', { class: 'helper', text: r.reason }) : null,
        el('small', { class: 'helper', text: '+' + r.points + ' pts · ' + new Date(r.awardedAt).toLocaleDateString() }),
      ])));
    body.replaceChildren(hero || document.createComment(''), gridEl);
  }).catch((e) => body.replaceChildren(el('div', { class: 'error-box', text: e.message })));

  function grant() {
    const sEl = el('select', { class: 'select' }, [el('option', { value: '', text: 'Select student…' })]);
    const bEl = el('select', { class: 'select' }, [el('option', { value: '', text: 'Select badge…' })]);
    const reason = el('textarea', { class: 'textarea', placeholder: 'What did they do well?' });
    api.get('/admin/users?role=student').then(({ users }) => users.forEach((u) => sEl.appendChild(el('option', { value: u._id, text: u.displayName + ' (Grade ' + (u.gradeLevel || '—') + ')' })))).catch(() => {});
    api.get('/rewards/badges').then(({ badges }) => badges.forEach((b) => bEl.appendChild(el('option', { value: b.key, text: b.label + ' (+' + b.points + ')' })))).catch(() => {});
    const m = modal({ title: 'Award a badge', body: [
      el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Student' }), sEl]),
      el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Badge' }), bEl]),
      el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Reason' }), reason]),
    ], footer: [el('button', { class: 'btn btn--ghost', text: 'Cancel', onclick: () => m.close() }), el('button', { class: 'btn btn--gold', text: 'Award', onclick: async () => {
      if (!sEl.value || !bEl.value) { toast('Choose a student and badge', 'err'); return; }
      try { await api.post('/rewards', { studentId: sEl.value, badgeKey: bEl.value, reason: reason.value }); m.close(); toast('Badge awarded'); load(); } catch (e) { toast(e.message, 'err'); }
    } })] });
  }

  root.append(el('div', { class: 'page-head' }, [
    el('div', {}, [el('h1', { class: 'display', style: 'font-size:28px', text: isStudent ? 'My Badges' : 'Rewards' }), el('p', { text: isStudent ? 'Everything you have earned' : 'Recognize positive behavior' })]),
    canGrant ? el('button', { class: 'btn btn--gold', html: icon('plus', 16) + ' Award a badge', onclick: grant }) : null,
  ]), body);
  load();
  return root;
}
