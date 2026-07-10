import { useEffect, useState } from 'react';
import { UserPlus, Search, Shield } from 'lucide-react';
import { api } from '../lib/api.js';
import { PageHeader, Card, Button, Chip, Spinner, EmptyState, Modal, Input, Select, Avatar } from '../components/common/ui.jsx';

const ROLE_TONE = { admin: 'grape', teacher: 'sky', parent: 'brand', student: 'green' };

export default function UserManagement() {
  const [users, setUsers] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  const load = () => {
    const params = new URLSearchParams();
    if (roleFilter) params.set('role', roleFilter);
    if (q) params.set('q', q);
    return api.get(`/admin/users?${params}`).then((d) => setUsers(d.users));
  };
  useEffect(() => { load(); }, [roleFilter, q]);
  useEffect(() => { api.get('/admin/analytics').then(setAnalytics).catch(() => {}); }, []);

  const changeRole = async (u, role) => { await api.patch(`/admin/users/${u._id}`, { role }); load(); };
  const toggleActive = async (u) => { await api.patch(`/admin/users/${u._id}`, { isActive: !u.isActive }); load(); };

  return (
    <div>
      <PageHeader title="User management" subtitle="Provision accounts, roles and permissions" actions={<Button onClick={() => setCreateOpen(true)}><UserPlus size={16} /> Add user</Button>} />

      {analytics && (
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          {['admin', 'teacher', 'parent', 'student'].map((r) => (
            <Card key={r} className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-ink">{analytics.usersByRole?.[r] || 0}</p>
                <p className="text-sm capitalize text-slatey">{r}s</p>
              </div>
              <Chip tone={ROLE_TONE[r]}><Shield size={12} /> {r}</Chip>
            </Card>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" className="input pl-9" />
        </div>
        {['', 'admin', 'teacher', 'parent', 'student'].map((r) => (
          <button key={r || 'all'} onClick={() => setRoleFilter(r)} className={`chip capitalize ${roleFilter === r ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slatey'}`}>{r || 'all'}</button>
        ))}
      </div>

      {!users ? <Spinner /> : users.length === 0 ? (
        <EmptyState icon={UserPlus} title="No users found" message="Try a different search or add a new user." />
      ) : (
        <Card className="p-0">
          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <div key={u._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Avatar name={u.displayName} src={u.photoURL} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{u.displayName} {!u.isActive && <span className="text-xs text-rose-500">(inactive)</span>}</p>
                  <p className="truncate text-xs text-slatey">{u.email}{u.gradeLevel ? ` · Grade ${u.gradeLevel}` : ''}</p>
                </div>
                <select value={u.role} onChange={(e) => changeRole(u, e.target.value)} className="input w-32 py-1.5 text-sm">
                  <option value="admin">Admin</option><option value="teacher">Teacher</option><option value="parent">Parent</option><option value="student">Student</option>
                </select>
                <Button variant={u.isActive ? 'ghost' : 'secondary'} onClick={() => toggleActive(u)}>{u.isActive ? 'Deactivate' : 'Reactivate'}</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} onDone={() => { setCreateOpen(false); load(); }} />
    </div>
  );
}

function CreateUserModal({ open, onClose, onDone }) {
  const [form, setForm] = useState({ email: '', displayName: '', role: 'parent', gradeLevel: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.email || !form.displayName) { setErr('Name and email are required.'); return; }
    setBusy(true); setErr(null);
    try { await api.post('/admin/users', form); setForm({ email: '', displayName: '', role: 'parent', gradeLevel: '' }); onDone(); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add a user" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy}>Create</Button></>}>
      {err && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
      <div className="space-y-3">
        <Input label="Full name" value={form.displayName} onChange={set('displayName')} />
        <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="name@school.edu" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Role" value={form.role} onChange={set('role')}>
            <option value="admin">Admin</option><option value="teacher">Teacher</option><option value="parent">Parent</option><option value="student">Student</option>
          </Select>
          {form.role === 'student' && <Input label="Grade" value={form.gradeLevel} onChange={set('gradeLevel')} placeholder="K–5" />}
        </div>
        <p className="text-xs text-slate-400">The user signs in with this email via Google SSO (or a demo token). Roles are enforced server-side.</p>
      </div>
    </Modal>
  );
}
