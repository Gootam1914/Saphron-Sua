import { useEffect, useMemo, useState } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, addMonths, subMonths, isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, MapPin, Users, CalendarDays } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageHeader, Card, Button, Chip, Spinner, Modal, Input, Textarea, Select } from '../components/common/ui.jsx';

const CAT_TONE = { pta: 'brand', field_trip: 'green', classroom: 'sky', school_wide: 'grape', holiday: 'amber', other: 'gray' };
// Static, fully-spelled classes so Tailwind's JIT compiler keeps them.
const PILL = {
  pta: 'bg-brand-100 text-brand-700',
  field_trip: 'bg-emerald-100 text-emerald-700',
  classroom: 'bg-sky-100 text-sky-700',
  school_wide: 'bg-violet-100 text-violet-700',
  holiday: 'bg-amber-100 text-amber-700',
  other: 'bg-slate-100 text-slate-700',
};

export default function EventCalendar() {
  const { role } = useAuth();
  const canCreate = role === 'teacher' || role === 'admin';
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState(null);
  const [selected, setSelected] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = () => api.get('/events').then((d) => setEvents(d.events));
  useEffect(() => { load(); }, []);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = {};
    (events || []).forEach((e) => {
      const k = format(new Date(e.startsAt), 'yyyy-MM-dd');
      (map[k] = map[k] || []).push(e);
    });
    return map;
  }, [events]);

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle="School calendar & RSVPs"
        actions={canCreate ? <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> New event</Button> : null}
      />

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h3 className="text-lg font-semibold text-ink">{format(cursor, 'MMMM yyyy')}</h3>
          <div className="flex gap-1">
            <button className="rounded-lg p-2 text-slatey hover:bg-slate-100" onClick={() => setCursor(subMonths(cursor, 1))}><ChevronLeft size={18} /></button>
            <button className="btn-ghost" onClick={() => setCursor(new Date())}>Today</button>
            <button className="rounded-lg p-2 text-slatey hover:bg-slate-100" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight size={18} /></button>
          </div>
        </div>

        {!events ? <Spinner /> : (
          <div className="grid grid-cols-7 gap-px bg-slate-100 p-px">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="bg-slate-50 py-2 text-center text-xs font-semibold text-slate-500">{d}</div>
            ))}
            {days.map((day) => {
              const k = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay[k] || [];
              return (
                <div key={k} className={`min-h-[92px] bg-white p-1.5 ${isSameMonth(day, cursor) ? '' : 'bg-slate-50/60'}`}>
                  <div className={`mb-1 grid h-6 w-6 place-items-center rounded-full text-xs ${isToday(day) ? 'bg-brand-600 font-bold text-white' : 'text-slatey'}`}>{format(day, 'd')}</div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((e) => (
                      <button key={e._id} onClick={() => setSelected(e)} className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium hover:opacity-80 ${PILL[e.category] || PILL.other}`}>
                        {e.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && <p className="px-1 text-[10px] text-slate-400">+{dayEvents.length - 3} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <EventDetail event={selected} onClose={() => setSelected(null)} onChanged={load} />
      {canCreate && <CreateEventModal open={createOpen} onClose={() => setCreateOpen(false)} onDone={() => { setCreateOpen(false); load(); }} />}
    </div>
  );
}

function EventDetail({ event, onClose, onChanged }) {
  const [busy, setBusy] = useState(false);
  if (!event) return null;

  const rsvp = async (status) => {
    setBusy(true);
    try { await api.post(`/events/${event._id}/rsvp`, { status }); await onChanged(); onClose(); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={!!event} onClose={onClose} title={event.title}>
      <div className="space-y-3">
        <Chip tone={CAT_TONE[event.category]}>{event.category.replace('_', ' ')}</Chip>
        <p className="flex items-center gap-2 text-sm text-slatey"><CalendarDays size={16} /> {format(new Date(event.startsAt), 'EEEE, MMM d • p')}</p>
        {event.location && <p className="flex items-center gap-2 text-sm text-slatey"><MapPin size={16} /> {event.location}</p>}
        {event.description && <p className="text-sm text-ink">{event.description}</p>}
        <p className="flex items-center gap-2 text-sm text-slatey"><Users size={16} /> {event.rsvpCounts?.going || 0} going · {event.rsvpCounts?.maybe || 0} maybe</p>

        {event.rsvpEnabled && (
          <div>
            <p className="label">Will you attend?</p>
            <div className="flex gap-2">
              {['going', 'maybe', 'not_going'].map((s) => (
                <Button key={s} variant={event.myRsvp === s ? 'primary' : 'secondary'} onClick={() => rsvp(s)} loading={busy}>
                  {s.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function CreateEventModal({ open, onClose, onDone }) {
  const [form, setForm] = useState({ title: '', description: '', location: '', category: 'school_wide', startsAt: '', endsAt: '', rsvpEnabled: true });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.title || !form.startsAt) { setErr('Title and start time are required.'); return; }
    setBusy(true); setErr(null);
    try {
      await api.post('/events', { ...form, endsAt: form.endsAt || form.startsAt });
      onDone();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create event" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy}>Create</Button></>}>
      {err && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
      <div className="space-y-3">
        <Input label="Title" value={form.title} onChange={set('title')} />
        <Textarea label="Description" value={form.description} onChange={set('description')} />
        <Input label="Location" value={form.location} onChange={set('location')} />
        <Select label="Category" value={form.category} onChange={set('category')}>
          <option value="pta">PTA</option><option value="field_trip">Field trip</option><option value="classroom">Classroom</option>
          <option value="school_wide">School-wide</option><option value="holiday">Holiday</option><option value="other">Other</option>
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Starts" type="datetime-local" value={form.startsAt} onChange={set('startsAt')} />
          <Input label="Ends" type="datetime-local" value={form.endsAt} onChange={set('endsAt')} />
        </div>
      </div>
    </Modal>
  );
}
