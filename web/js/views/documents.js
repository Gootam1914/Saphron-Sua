import { el, icon, spinner, empty, modal, toast } from '../ui.js';
import { api } from '../api.js';

const LABEL = { permission_slip: 'Permission slip', newsletter: 'Newsletter', tardy_slip: 'Tardy slip', policy: 'Policy', form: 'Form', other: 'Document' };

export default function documentsView({ profile }) {
  const canUpload = profile.role === 'teacher' || profile.role === 'admin';
  const root = el('div', {});
  const grid = el('div', {}, spinner('Loading documents'));

  const load = () => api.get('/documents').then(({ documents }) => {
    if (!documents.length) { grid.replaceChildren(empty('No documents', 'Documents shared with your role appear here.')); return; }
    grid.replaceChildren(el('div', { class: 'grid grid--3' }, documents.map((d) => el('div', { class: 'card' }, [
      el('div', { style: 'display:flex;justify-content:space-between;align-items:flex-start' }, [
        el('div', { style: 'width:42px;height:42px;border-radius:12px;background:var(--card-2);display:grid;place-items:center;color:var(--gold)', html: icon('folder', 20) }),
        el('span', { class: 'chip chip--gold', text: LABEL[d.docType] || 'Document' }),
      ]),
      el('b', { style: 'margin-top:10px;display:block', text: d.title }),
      d.description ? el('div', { class: 'helper', style: 'margin-top:4px', text: d.description }) : null,
      el('div', { style: 'display:flex;gap:8px;margin-top:12px;flex-wrap:wrap' }, [
        el('button', { class: 'btn btn--ghost btn--sm', html: icon('download', 14) + ' Download', onclick: () => download(d) }),
        d.requiresAcknowledgement && (d.acknowledgedByMe ? el('span', { class: 'chip chip--green', html: icon('check', 12) + ' Signed' })
          : profile.role === 'parent' ? el('button', { class: 'btn btn--gold btn--sm', html: icon('pen', 14) + ' Sign', onclick: () => sign(d) }) : null),
        d.requiresAcknowledgement && canUpload ? el('span', { class: 'chip chip--mute', text: (d.acknowledgementCount || 0) + ' signed' }) : null,
      ]),
    ]))));
  }).catch((e) => grid.replaceChildren(el('div', { class: 'error-box', text: e.message })));

  const download = async (d) => { const res = await api.raw('/documents/' + d._id + '/download'); if (!res.ok) { toast('Demo document has no file attached', 'err'); return; } const b = await res.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = d.fileName; a.click(); URL.revokeObjectURL(u); };

  function sign(d) {
    const name = el('input', { class: 'input', placeholder: 'Type your full name' });
    const m = modal({ title: 'Sign: ' + d.title, body: [el('p', { class: 'helper', text: 'By typing your name you acknowledge this document. A timestamped record is kept.' }), el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Full name' }), name])],
      footer: [el('button', { class: 'btn btn--ghost', text: 'Cancel', onclick: () => m.close() }), el('button', { class: 'btn btn--gold', text: 'Sign', onclick: async () => { if (!name.value.trim()) { toast('Type your name', 'err'); return; } try { await api.post('/documents/' + d._id + '/acknowledge', { signedName: name.value }); m.close(); toast('Signed'); load(); } catch (e) { toast(e.message, 'err'); } } })] });
  }

  function upload() {
    const title = el('input', { class: 'input' }); const desc = el('textarea', { class: 'textarea' });
    const type = el('select', { class: 'select' }, Object.entries(LABEL).map(([v, t]) => el('option', { value: v, text: t })));
    const file = el('input', { type: 'file' });
    const ack = el('input', { type: 'checkbox' });
    const roles = ['parent', 'teacher', 'student', 'admin']; const chosen = new Set();
    const roleRow = el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' }, roles.map((r) => el('button', { class: 'chip chip--mute', text: r, onclick: (e) => { if (chosen.has(r)) { chosen.delete(r); e.target.className = 'chip chip--mute'; } else { chosen.add(r); e.target.className = 'chip chip--gold'; } } })));
    const m = modal({ title: 'Upload a document', body: [
      el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Title' }), title]),
      el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Description' }), desc]),
      el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'Type' }), type]),
      el('div', {}, [el('div', { class: 'helper', style: 'margin-bottom:6px', text: 'Visible to (none = everyone)' }), roleRow]),
      el('label', { style: 'display:flex;gap:8px;align-items:center' }, [ack, el('span', { class: 'helper', text: 'Requires parent signature' })]),
      el('label', { class: 'field' }, [el('span', { class: 'helper', text: 'File' }), file]),
    ], footer: [el('button', { class: 'btn btn--ghost', text: 'Cancel', onclick: () => m.close() }), el('button', { class: 'btn btn--gold', text: 'Upload', onclick: async () => {
      if (!file.files[0] || !title.value) { toast('Title and file required', 'err'); return; }
      const fd = new FormData(); fd.append('file', file.files[0]); fd.append('title', title.value); fd.append('description', desc.value); fd.append('docType', type.value); fd.append('requiresAcknowledgement', String(ack.checked)); fd.append('visibleToRoles', JSON.stringify([...chosen]));
      try { await api.post('/documents', fd); m.close(); toast('Uploaded'); load(); } catch (e) { toast(e.message, 'err'); }
    } })] });
  }

  root.append(el('div', { class: 'page-head' }, [
    el('div', {}, [el('h1', { class: 'display', style: 'font-size:28px', text: 'DOCUMENTS' }), el('p', { text: 'Permission slips, newsletters and policies' })]),
    canUpload ? el('button', { class: 'btn btn--gold', html: icon('plus', 16) + ' Upload', onclick: upload }) : null,
  ]), grid);
  load();
  return root;
}
