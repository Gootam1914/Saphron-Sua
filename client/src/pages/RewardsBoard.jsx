import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import * as Icons from 'lucide-react';
import { Award, Plus, Star, Trophy } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Card, Button, Chip, Spinner, EmptyState, Modal, Select, Textarea } from '../components/common/ui.jsx';

const toPascal = (s) => String(s || 'star').split('-').map((w) => w[0]?.toUpperCase() + w.slice(1)).join('');

export default function RewardsBoard() {
  const { role } = useAuth();
  const isStudent = role === 'student';
  const canGrant = role === 'teacher' || role === 'admin';
  const [data, setData] = useState(null);
  const [grantOpen, setGrantOpen] = useState(false);

  const load = () => api.get('/rewards').then(setData);
  useEffect(() => { load(); }, []);

  if (!data) return <Spinner />;

  return (
    <div className={isStudent ? 'mx-auto max-w-4xl' : ''}>
      <PageHeader
        title={isStudent ? 'My Badges' : 'Rewards'}
        subtitle={isStudent ? 'Look at everything you have earned!' : 'Recognize positive behavior'}
        actions={canGrant ? <Button onClick={() => setGrantOpen(true)}><Plus size={16} /> Award a badge</Button> : null}
      />

      {isStudent && (
        <div className="mb-6 flex items-center gap-4 rounded-blob bg-gradient-to-br from-sun to-saffron-400 p-6 text-ink shadow-pop">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-card/40"><Trophy size={34} /></div>
          <div>
            <p className="font-kid text-kid-lg font-bold">{data.totalPoints} star points</p>
            <p className="text-ink/70">{data.rewards.length} badges earned. Amazing!</p>
          </div>
        </div>
      )}

      {data.rewards.length === 0 ? (
        <EmptyState icon={Award} title="No badges yet" message={isStudent ? 'Your badges will show up here. Keep being awesome!' : 'Awarded badges will appear here.'} />
      ) : (
        <div className={`grid gap-4 ${isStudent ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {data.rewards.map((r) => {
            const Icon = Icons[toPascal(r.badge?.icon)] || Star;
            return (
              <Card key={r._id} className={`flex flex-col items-center text-center ${isStudent ? 'kid-card' : ''}`}>
                <div className="grid h-16 w-16 place-items-center rounded-full bg-sun/30 text-saffron-600"><Icon size={32} /></div>
                <p className={`mt-3 font-semibold text-ink ${isStudent ? 'font-kid' : ''}`}>{r.badge?.label}</p>
                {!isStudent && r.student?.displayName && <Chip tone="green" className="mt-1">{r.student.displayName}</Chip>}
                {r.reason && <p className="mt-1 text-xs text-slatey">{r.reason}</p>}
                <p className="mt-1 text-xs text-slate-400">+{r.points} pts · {format(new Date(r.awardedAt), 'MMM d')}</p>
              </Card>
            );
          })}
        </div>
      )}

      {canGrant && <GrantModal open={grantOpen} onClose={() => setGrantOpen(false)} onDone={() => { setGrantOpen(false); load(); }} />}
    </div>
  );
}

function GrantModal({ open, onClose, onDone }) {
  const [students, setStudents] = useState([]);
  const [badges, setBadges] = useState([]);
  const [form, setForm] = useState({ studentId: '', badgeKey: '', reason: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!open) return;
    api.get('/admin/users?role=student').then((d) => setStudents(d.users)).catch(() => {
      // teachers can't hit admin users; fall back to recipients endpoint is not ideal, so keep empty
      setStudents([]);
    });
    api.get('/rewards/badges').then((d) => setBadges(d.badges)).catch(() => {});
  }, [open]);

  const submit = async () => {
    if (!form.studentId || !form.badgeKey) { setErr('Choose a student and a badge.'); return; }
    setBusy(true); setErr(null);
    try { await api.post('/rewards', form); onDone(); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Award a badge" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy}>Award</Button></>}>
      {err && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
      {students.length === 0 && <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">No students loaded. (Teachers award via their class roster in a full deployment.)</p>}
      <div className="space-y-3">
        <Select label="Student" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
          <option value="">Select a student…</option>
          {students.map((s) => <option key={s._id} value={s._id}>{s.displayName} (Grade {s.gradeLevel || '-'})</option>)}
        </Select>
        <Select label="Badge" value={form.badgeKey} onChange={(e) => setForm({ ...form, badgeKey: e.target.value })}>
          <option value="">Select a badge…</option>
          {badges.map((b) => <option key={b.key} value={b.key}>{b.label} (+{b.points})</option>)}
        </Select>
        <Textarea label="Reason (optional)" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="What did they do well?" />
      </div>
    </Modal>
  );
}
