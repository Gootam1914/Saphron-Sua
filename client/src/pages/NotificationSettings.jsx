import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, Settings, MessagesSquare, Ticket, CalendarDays, Megaphone, ClipboardList, Award } from 'lucide-react';
import { api } from '../lib/api.js';
import { PageHeader, Card, Button, Spinner, EmptyState } from '../components/common/ui.jsx';

const TYPE_ICON = { message: MessagesSquare, ticket: Ticket, event: CalendarDays, announcement: Megaphone, survey: ClipboardList, reward: Award, moderation: Bell, document: Check };

const PREF_ROWS = [
  { key: 'messages', label: 'Direct messages', icon: MessagesSquare },
  { key: 'tickets', label: 'Ticket updates', icon: Ticket },
  { key: 'events', label: 'Events & RSVPs', icon: CalendarDays },
  { key: 'announcements', label: 'Announcements', icon: Megaphone },
  { key: 'surveys', label: 'Surveys', icon: ClipboardList },
  { key: 'rewards', label: 'Rewards & badges', icon: Award },
];

export default function NotificationSettings() {
  const [tab, setTab] = useState('inbox');
  const [items, setItems] = useState(null);
  const [prefs, setPrefs] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadInbox = () => api.get('/notifications').then((d) => setItems(d.notifications));
  useEffect(() => { loadInbox(); api.get('/notifications/settings').then((d) => setPrefs(d.notificationPrefs)); }, []);

  const markAll = async () => { await api.post('/notifications/read-all'); loadInbox(); };
  const markOne = async (id) => { await api.post(`/notifications/${id}/read`); loadInbox(); };

  const savePrefs = async (next) => {
    setPrefs(next); setSaving(true);
    try { await api.patch('/notifications/settings', next); } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Your inbox and delivery preferences"
        actions={tab === 'inbox' ? <Button variant="secondary" onClick={markAll}><Check size={16} /> Mark all read</Button> : null}
      />

      <div className="mb-4 flex gap-1 rounded-xl bg-muted p-1">
        {[['inbox', 'Inbox', Bell], ['settings', 'Settings', Settings]].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)} className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${tab === id ? 'bg-card text-ink shadow-sm' : 'text-slatey'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'inbox' ? (
        !items ? <Spinner /> : items.length === 0 ? (
          <EmptyState icon={Bell} title="You're all caught up" message="New notifications will show up here." />
        ) : (
          <div className="space-y-2">
            {items.map((n) => {
              const Icon = TYPE_ICON[n.type] || Bell;
              return (
                <Card key={n._id} className={`flex items-start gap-3 ${n.read ? '' : 'ring-1 ring-brand-200'}`}>
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${n.read ? 'bg-muted text-slatey' : 'bg-brand-50 text-brand-600'}`}><Icon size={18} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{n.title}</p>
                    {n.body && <p className="text-sm text-slatey">{n.body}</p>}
                    <p className="mt-0.5 text-xs text-slate-400">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                  </div>
                  {!n.read && <button onClick={() => markOne(n._id)} className="shrink-0 rounded-lg p-1.5 text-slatey hover:bg-muted" title="Mark read"><Check size={16} /></button>}
                </Card>
              );
            })}
          </div>
        )
      ) : (
        !prefs ? <Spinner /> : (
          <Card className="max-w-lg">
            <p className="mb-4 text-sm text-slatey">Choose which in-app notifications you receive.{saving ? ' Saving…' : ''}</p>
            <div className="space-y-1">
              {PREF_ROWS.map(({ key, label, icon: Icon }) => (
                <label key={key} className="flex items-center justify-between rounded-xl px-2 py-3 hover:bg-muted">
                  <span className="flex items-center gap-3 text-sm font-medium text-ink"><Icon size={18} className="text-slatey" /> {label}</span>
                  <input type="checkbox" checked={prefs[key] !== false} onChange={(e) => savePrefs({ ...prefs, [key]: e.target.checked })} className="h-5 w-5 rounded" />
                </label>
              ))}
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <label className="label">Delivery channel</label>
              <select className="input" value={prefs.channel || 'in_app'} onChange={(e) => savePrefs({ ...prefs, channel: e.target.value })}>
                <option value="in_app">In-app only</option>
                <option value="email">Email only</option>
                <option value="both">In-app + email</option>
              </select>
              <p className="mt-1 text-xs text-slate-400">Email delivery is wired in the backend interface; connect an email provider to enable it in production.</p>
            </div>
          </Card>
        )
      )}
    </div>
  );
}
