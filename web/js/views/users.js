import { el, icon, avatar, spinner, empty, modal, toast } from '../ui.js';
import { api } from '../api.js';

export default function usersView() {
  const root = el('div', {});
  const wrap = el('div', {}, spinner('Loading users'));
  let role = ''; let q = '';

  const load = () => { const p = new URLSearchParams(); if (role) p.set('role', role); if (q) p.set('q', q);
    api.get('/admin/users?' + p.toString()).then(({ users }) => {
      if (!users.length) { wrap.replaceChildren(empty('No users found', 'Try a different search or add a user.')); return; }
      wrap.replaceChildren(el('div', { class: 'card card--pad0' }, el('div', { class: 'list', style: 'padding:8px' }, users.map((u) => el('div', { class: 'row' }, [
        avatar(u.displayName, 40),
        el('div', { class: 'row__main' }, [el('b', { text: u.displayName + (u.isActive ? '' : ' (inactive)') }), el('small', { text: u.email + (u.gradeLevel ? ' · Grade ' + u.gradeLevel : '') })]),
        el('select', { class: 'select', style: 'width:130px;padding:6px 10px', onchange: async (e) => { try { await api.patch('/admin/users/' + u._id, { role: e.target.value }); toast('Role updated'); } catch (err) { toast(err.message, 'err'); } } },
          ['admin', 'teacher', 'parent', 'student'].map((r) => el('option', { value: r, text: r, selected: r === u.role }))),
        el('button', { class: 'btn btn--ghost btn--sm', text: u.isActive ? 'Deactivate' : 'Reactivate', onclick: async () => { await api.patch('/admin/users/' + u._id, { isActive: !u.isActive }); load(); } }),
      ])))));
    }).catch((e) => wrap.replaceChildren(el('div', { class: 'error-box', text: e.message }))); };

  const search = el('input', { class: 'input', placeholder: 'Search name or email…', oninput: (e) => { q = e.target.value; clearTimeout(window.__u); window.__u = setTimeout(load, 250); } });
  const tabs = el('div', { class: 'tabs' }, ['', 'admin', 'teacher', 'parent', 'student'].map((r) => el('button', { class: 'tab' + (role === r ? ' active' : ''), text: r || 'all', onclick: (e) => { role = r; [...e.target.parentNode.children].forEach((c) => c.classList.remove('active')); e.target.classList.add('active'); load(); } })));

  function add() {
    const f = { name: el('input', { class: 'input' }), email: el('input', { class: 'input', type: 'email', placeholder: 'name@school.org' }),
      role: el('select', { class: 'select' }, ['parent', 'teacher', 'student', 'admin'].map((r) => el('option', { value: r, text: r }))), grade: el('input', { class: 'input', placeholder: 'K–5' }) };
    const m = modal({ title: 'Add a user', body: [
      el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Full name' }), f.name]),
      el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Email' }), f.email]),
      el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:12px' }, [el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Role' }), f.role]), el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Grade (students)' }), f.grade])]),
      el('div', { class: 'helper', text: 'They sign in with this email via Google/SSO. Roles are enforced server-side.' }),
    ], footer: [el('button', { class: 'btn btn--ghost', text: 'Cancel', onclick: () => m.close() }), el('button', { class: 'btn btn--gold', text: 'Create', onclick: async () => {
      if (!f.name.value || !f.email.value) { toast('Name and email required', 'err'); return; }
      try { await api.post('/admin/users', { displayName: f.name.value, email: f.email.value, role: f.role.value, gradeLevel: f.grade.value }); m.close(); toast('User created'); load(); } catch (e) { toast(e.message, 'err'); }
    } })] });
  }

  root.append(el('div', { class: 'page-head' }, [
    el('div', {}, [el('h1', { class: 'display', style: 'font-size:28px', text: 'Users' }), el('p', { text: 'Provision accounts, roles and permissions' })]),
    el('button', { class: 'btn btn--gold', html: icon('plus', 16) + ' Add user', onclick: add }),
  ]), el('div', { style: 'display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center' }, [el('div', { style: 'flex:1;min-width:200px' }, search), tabs]), wrap);
  load();
  return root;
}
