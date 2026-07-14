import { el, icon, spinner, toast } from '../ui.js';
import { api } from '../api.js';

export default function settingsView() {
  const root = el('div', {});
  const body = el('div', {}, spinner('Loading organization'));

  const load = () => api.get('/admin/school').then(({ org }) => render(org)).catch((e) => body.replaceChildren(el('div', { class: 'error-box', text: e.message })));

  function render(org) {
    const name = el('input', { class: 'input', placeholder: 'e.g. Maplewood Elementary', value: org?.name || '' });
    const domain = el('input', { class: 'input', placeholder: 'yourschool.org (optional)', value: org?.emailDomain || '' });
    const tz = el('input', { class: 'input', placeholder: 'America/New_York', value: org?.timezone || 'America/New_York' });
    const save = el('button', { class: 'btn btn--gold', style: 'padding:12px 20px', text: org ? 'Save changes' : 'Create organization',
      onclick: async () => {
        if (!name.value.trim()) { toast('Enter an organization name', 'err'); return; }
        save.disabled = true;
        try { await api.post('/admin/school', { name: name.value, emailDomain: domain.value.trim(), timezone: tz.value.trim() }); toast('Saved'); load(); }
        catch (e) { toast(e.message, 'err'); } finally { save.disabled = false; }
      } });

    body.replaceChildren(
      !org ? el('div', { class: 'card', style: 'margin-bottom:16px;display:flex;gap:12px;align-items:flex-start;border-color:var(--gold)' }, [
        el('div', { class: 'stat__ico', html: icon('building', 20) }),
        el('div', {}, [el('b', { text: 'Set up your organization' }), el('div', { class: 'helper', text: 'Name your school or district. New members who sign in are attached to it automatically.' })]),
      ]) : null,
      el('div', { class: 'card', style: 'max-width:560px' }, [
        el('div', { class: 'eyebrow', style: 'margin-bottom:12px', text: 'Organization' }),
        el('div', { style: 'display:grid;gap:14px' }, [
          el('label', { class: 'field' }, [el('span', {}, 'Name'), name]),
          el('label', { class: 'field' }, [el('span', {}, 'Email domain (optional)'), domain]),
          el('label', { class: 'field' }, [el('span', {}, 'Timezone'), tz]),
          el('div', {}, save),
        ]),
      ]),
      el('div', { class: 'card', style: 'max-width:560px;margin-top:16px' }, [
        el('div', { class: 'eyebrow', style: 'margin-bottom:8px', text: 'Members' }),
        el('p', { class: 'helper', text: 'Add teachers, parents and students under Users. Anyone who signs in with Google or Microsoft is added automatically with the default role, and you can promote them there.' }),
        el('a', { href: '#/users', class: 'btn btn--ghost', style: 'margin-top:10px', html: icon('users', 16) + ' Manage users' }),
      ]),
    );
  }

  root.append(
    el('div', { class: 'page-head' }, [el('div', {}, [el('h1', { class: 'display', style: 'font-size:28px', text: 'SETTINGS' }), el('p', { text: 'Set up and manage your organization' })])]),
    body,
  );
  load();
  return root;
}
