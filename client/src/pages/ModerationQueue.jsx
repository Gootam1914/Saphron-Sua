import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ShieldCheck, Check, X, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api.js';
import { PageHeader, Card, Button, Avatar, Chip, Spinner, EmptyState } from '../components/common/ui.jsx';

export default function ModerationQueue() {
  const [items, setItems] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = () => api.get('/messages/moderation').then((d) => setItems(d.items));
  useEffect(() => { load(); }, []);

  const decide = async (id, decision) => {
    setBusyId(id);
    try { await api.post(`/messages/moderation/${id}`, { decision }); await load(); }
    finally { setBusyId(null); }
  };

  return (
    <div>
      <PageHeader title="Moderation queue" subtitle="Review student messages before they are delivered" />
      <Card className="mb-4 flex items-start gap-3 bg-brand-50/50">
        <ShieldCheck className="mt-0.5 text-brand-600" size={20} />
        <p className="text-sm text-slatey">Every message a student sends waits here until you approve it. Approved messages are delivered to the recipient; rejected messages are never sent. Flagged messages tripped the automatic safety filter.</p>
      </Card>

      {!items ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="All clear" message="There are no student messages waiting for review." />
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <Card key={m._id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Avatar name={m.sender?.displayName} src={m.sender?.photoURL} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">{m.sender?.displayName}</p>
                    {m.sender?.gradeLevel && <Chip tone="green">Grade {m.sender.gradeLevel}</Chip>}
                    {m.moderationStatus === 'flagged'
                      ? <Chip tone="red"><AlertTriangle size={12} /> flagged: {m.flaggedTerms?.join(', ')}</Chip>
                      : <Chip tone="amber">pending</Chip>}
                  </div>
                  <p className="mt-1 max-w-xl rounded-lg bg-muted px-3 py-2 text-sm text-ink">{m.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="secondary" onClick={() => decide(m._id, 'reject')} loading={busyId === m._id}><X size={16} /> Reject</Button>
                <Button onClick={() => decide(m._id, 'approve')} loading={busyId === m._id}><Check size={16} /> Approve</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
