import { useEffect, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Plus, Ticket as TicketIcon, Filter } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Card, Button, Chip, Spinner, EmptyState, Modal, Input, Textarea, Select } from '../components/common/ui.jsx';

const STATUS_TONE = { open: 'amber', in_progress: 'sky', resolved: 'green' };
const PRIORITY_TONE = { low: 'gray', medium: 'sky', high: 'amber', urgent: 'red' };
const CAT_LABEL = { it: 'IT', facilities: 'Facilities', general: 'General' };

export default function TicketManager() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [tickets, setTickets] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [admins, setAdmins] = useState([]);

  const load = () => {
    const q = statusFilter ? `?status=${statusFilter}` : '';
    return api.get(`/tickets${q}`).then((d) => setTickets(d.tickets));
  };
  useEffect(() => { load(); }, [statusFilter]);
  useEffect(() => { if (isAdmin) api.get('/admin/users?role=admin').then((d) => setAdmins(d.users)).catch(() => {}); }, [isAdmin]);

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'Ticketing dashboard' : 'My tickets'}
        subtitle={isAdmin ? 'Assign, prioritize and resolve requests' : 'Track your submitted requests'}
        actions={<Button onClick={() => setCreateOpen(true)}><Plus size={16} /> New ticket</Button>}
      />

      <div className="mb-4 flex items-center gap-2">
        <Filter size={16} className="text-slate-400" />
        {['', 'open', 'in_progress', 'resolved'].map((s) => (
          <button key={s || 'all'} onClick={() => setStatusFilter(s)} className={`chip ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-muted text-slatey'}`}>
            {s ? s.replace('_', ' ') : 'all'}
          </button>
        ))}
      </div>

      {!tickets ? <Spinner /> : tickets.length === 0 ? (
        <EmptyState icon={TicketIcon} title="No tickets" message={isAdmin ? 'No tickets match this filter.' : 'You have not submitted any tickets yet.'} action={<Button onClick={() => setCreateOpen(true)}>Submit a ticket</Button>} />
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <button key={t._id} onClick={() => setDetail(t)} className="block w-full text-left">
              <Card className="transition-all hover:shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{t.title}</p>
                    <p className="text-xs text-slatey">#{t._id.slice(-6)} • {CAT_LABEL[t.category]} • by {t.submittedBy?.displayName} • {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip tone={PRIORITY_TONE[t.priority]}>{t.priority}</Chip>
                    <Chip tone={STATUS_TONE[t.status]}>{t.status.replace('_', ' ')}</Chip>
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      <CreateTicketModal open={createOpen} onClose={() => setCreateOpen(false)} onDone={() => { setCreateOpen(false); load(); }} />
      <TicketDetail ticket={detail} isAdmin={isAdmin} admins={admins} onClose={() => setDetail(null)} onChanged={() => { load(); }} setDetail={setDetail} />
    </div>
  );
}

function CreateTicketModal({ open, onClose, onDone }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'general', priority: 'medium' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.title || !form.description) { setErr('Title and description are required.'); return; }
    setBusy(true); setErr(null);
    try { await api.post('/tickets', form); setForm({ title: '', description: '', category: 'general', priority: 'medium' }); onDone(); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Submit a ticket" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy}>Submit</Button></>}>
      {err && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
      <div className="space-y-3">
        <Input label="Title" value={form.title} onChange={set('title')} placeholder="Short summary" />
        <Textarea label="Description" value={form.description} onChange={set('description')} placeholder="Describe the issue…" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" value={form.category} onChange={set('category')}>
            <option value="it">IT / Technical</option>
            <option value="facilities">Facilities</option>
            <option value="general">General</option>
          </Select>
          <Select label="Priority" value={form.priority} onChange={set('priority')}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
          </Select>
        </div>
      </div>
    </Modal>
  );
}

function TicketDetail({ ticket, isAdmin, admins, onClose, onChanged, setDetail }) {
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  if (!ticket) return null;

  const patch = async (body) => {
    setBusy(true);
    try { const { ticket: t } = await api.patch(`/tickets/${ticket._id}`, body); setDetail(t); onChanged(); }
    finally { setBusy(false); }
  };
  const addComment = async () => {
    if (!comment.trim()) return;
    setBusy(true);
    try { const { ticket: t } = await api.post(`/tickets/${ticket._id}/comment`, { note: comment }); setComment(''); setDetail(t); onChanged(); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={!!ticket} onClose={onClose} title={ticket.title} size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Chip tone={STATUS_TONE[ticket.status]}>{ticket.status.replace('_', ' ')}</Chip>
          <Chip tone={PRIORITY_TONE[ticket.priority]}>{ticket.priority}</Chip>
          <Chip tone="gray">{CAT_LABEL[ticket.category]}</Chip>
        </div>
        <p className="rounded-lg bg-muted px-3 py-2 text-sm text-ink">{ticket.description}</p>

        {isAdmin && (
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-line p-3">
            <Select label="Status" value={ticket.status} onChange={(e) => patch({ status: e.target.value })} disabled={busy}>
              <option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option>
            </Select>
            <Select label="Priority" value={ticket.priority} onChange={(e) => patch({ priority: e.target.value })} disabled={busy}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
            </Select>
            <Select label="Assigned to" value={ticket.assignedTo?._id || ticket.assignedTo || ''} onChange={(e) => patch({ assignedTo: e.target.value })} disabled={busy}>
              <option value="">Unassigned</option>
              {admins.map((a) => <option key={a._id} value={a._id}>{a.displayName}</option>)}
            </Select>
          </div>
        )}

        <div>
          <p className="label">History</p>
          <ul className="space-y-2">
            {ticket.history?.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <div>
                  <span className="font-medium text-ink">{h.action.replace(/[:_]/g, ' ')}</span>
                  {h.note && <span className="text-slatey"> - {h.note}</span>}
                  <span className="ml-1 text-xs text-slate-400">{h.at ? format(new Date(h.at), 'MMM d, p') : ''}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-end gap-2">
          <Textarea label="Add a comment" value={comment} onChange={(e) => setComment(e.target.value)} className="min-h-[44px]" />
          <Button onClick={addComment} loading={busy}>Post</Button>
        </div>
      </div>
    </Modal>
  );
}
