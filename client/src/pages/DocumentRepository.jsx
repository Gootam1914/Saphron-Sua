import { useEffect, useState } from 'react';
import { FileText, Upload, Download, PenLine, CheckCircle2, Filter } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Card, Button, Chip, Spinner, EmptyState, Modal, Input, Textarea, Select } from '../components/common/ui.jsx';

const TYPE_LABEL = { permission_slip: 'Permission slip', newsletter: 'Newsletter', tardy_slip: 'Tardy slip', policy: 'Policy', form: 'Form', other: 'Document' };
const TYPE_TONE = { permission_slip: 'amber', newsletter: 'brand', tardy_slip: 'sky', policy: 'grape', form: 'green', other: 'gray' };

export default function DocumentRepository() {
  const { role, profile } = useAuth();
  const canUpload = role === 'teacher' || role === 'admin';
  const [docs, setDocs] = useState(null);
  const [filter, setFilter] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [signDoc, setSignDoc] = useState(null);

  const load = () => api.get(`/documents${filter ? `?docType=${filter}` : ''}`).then((d) => setDocs(d.documents));
  useEffect(() => { load(); }, [filter]);

  const download = async (doc) => {
    const res = await api.raw(`/documents/${doc._id}/download`);
    if (!res.ok) { alert('This demo document has no file attached. Upload a real file to enable downloads.'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = doc.fileName; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Documents" subtitle="Permission slips, newsletters and policies" actions={canUpload ? <Button onClick={() => setUploadOpen(true)}><Upload size={16} /> Upload</Button> : null} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filter size={16} className="text-slate-400" />
        {['', 'permission_slip', 'newsletter', 'policy', 'form'].map((t) => (
          <button key={t || 'all'} onClick={() => setFilter(t)} className={`chip ${filter === t ? 'bg-brand-600 text-white' : 'bg-muted text-slatey'}`}>{t ? TYPE_LABEL[t] : 'All'}</button>
        ))}
      </div>

      {!docs ? <Spinner /> : docs.length === 0 ? (
        <EmptyState icon={FileText} title="No documents" message="Documents shared with your role will appear here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {docs.map((d) => (
            <Card key={d._id} className="flex flex-col">
              <div className="flex items-start justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-slatey"><FileText size={22} /></div>
                <Chip tone={TYPE_TONE[d.docType]}>{TYPE_LABEL[d.docType]}</Chip>
              </div>
              <p className="mt-3 font-medium text-ink">{d.title}</p>
              {d.description && <p className="mt-1 line-clamp-2 text-sm text-slatey">{d.description}</p>}
              <p className="mt-1 text-xs text-slate-400">by {d.uploadedBy?.displayName}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={() => download(d)}><Download size={15} /> Download</Button>
                {d.requiresAcknowledgement && (
                  d.acknowledgedByMe
                    ? <Chip tone="green"><CheckCircle2 size={13} /> Signed</Chip>
                    : role === 'parent' && <Button onClick={() => setSignDoc(d)}><PenLine size={15} /> Sign</Button>
                )}
                {d.requiresAcknowledgement && (role === 'teacher' || role === 'admin') && (
                  <Chip tone="gray">{d.acknowledgementCount} signed</Chip>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {canUpload && <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onDone={() => { setUploadOpen(false); load(); }} />}
      <SignModal doc={signDoc} me={profile} onClose={() => setSignDoc(null)} onDone={() => { setSignDoc(null); load(); }} />
    </div>
  );
}

function UploadModal({ open, onClose, onDone }) {
  const [form, setForm] = useState({ title: '', description: '', docType: 'other', requiresAcknowledgement: false, visibleToRoles: [] });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const toggleRole = (r) => setForm((f) => ({ ...f, visibleToRoles: f.visibleToRoles.includes(r) ? f.visibleToRoles.filter((x) => x !== r) : [...f.visibleToRoles, r] }));

  const submit = async () => {
    if (!file || !form.title) { setErr('A title and a file are required.'); return; }
    setBusy(true); setErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('docType', form.docType);
      fd.append('requiresAcknowledgement', String(form.requiresAcknowledgement));
      fd.append('visibleToRoles', JSON.stringify(form.visibleToRoles));
      await api.post('/documents', fd);
      onDone();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload a document" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy}>Upload</Button></>}>
      {err && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
      <div className="space-y-3">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Select label="Type" value={form.docType} onChange={(e) => setForm({ ...form, docType: e.target.value })}>
          {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <div>
          <label className="label">Visible to (none = everyone)</label>
          <div className="flex flex-wrap gap-2">
            {['parent', 'teacher', 'student', 'admin'].map((r) => (
              <button key={r} type="button" onClick={() => toggleRole(r)} className={`chip capitalize ${form.visibleToRoles.includes(r) ? 'bg-brand-600 text-white' : 'bg-muted text-slatey'}`}>{r}</button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slatey">
          <input type="checkbox" checked={form.requiresAcknowledgement} onChange={(e) => setForm({ ...form, requiresAcknowledgement: e.target.checked })} />
          Requires parent signature (e.g. permission slip)
        </label>
        <div>
          <label className="label">File</label>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} className="block w-full text-sm text-slatey file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-brand-700" />
        </div>
      </div>
    </Modal>
  );
}

function SignModal({ doc, me, onClose, onDone }) {
  const [name, setName] = useState('');
  const [child, setChild] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  if (!doc) return null;

  const submit = async () => {
    if (!name.trim()) { setErr('Please type your full name to sign.'); return; }
    setBusy(true); setErr(null);
    try { await api.post(`/documents/${doc._id}/acknowledge`, { signedName: name, onBehalfOf: child || undefined }); onDone(); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={!!doc} onClose={onClose} title={`Sign: ${doc.title}`} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy}>Sign & acknowledge</Button></>}>
      {err && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
      <p className="mb-3 text-sm text-slatey">By typing your name below you acknowledge and agree to this document. A timestamped record is kept.</p>
      <div className="space-y-3">
        {(me?.children || []).length > 0 && (
          <Select label="On behalf of" value={child} onChange={(e) => setChild(e.target.value)}>
            <option value="">Select child (optional)</option>
            {me.children.map((c) => <option key={c._id} value={c._id}>{c.displayName}</option>)}
          </Select>
        )}
        <Input label="Type your full name to sign" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
      </div>
    </Modal>
  );
}
