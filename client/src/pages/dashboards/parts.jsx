import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { Card, EmptyState } from '../../components/common/ui.jsx';

export function StatCard({ icon: Icon, label, value, tone = 'brand', hint }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-rose-50 text-rose-600',
    sky: 'bg-sky-50 text-sky-600',
    grape: 'bg-violet-50 text-violet-600',
  };
  return (
    <Card className="flex items-center gap-4">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none text-ink">{value}</p>
        <p className="mt-1 truncate text-sm text-slatey">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </Card>
  );
}

export function UpcomingEvents({ events = [] }) {
  return (
    <Card>
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-ink"><CalendarDays size={18} /> Upcoming events</h3>
      {events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nothing scheduled" message="New events will appear here." />
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e._id} className="flex items-center gap-3 rounded-xl border border-line p-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-center">
                <span className="text-[10px] font-semibold uppercase text-brand-500">{format(new Date(e.startsAt), 'MMM')}</span>
                <span className="text-base font-bold leading-none text-brand-700">{format(new Date(e.startsAt), 'd')}</span>
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{e.title}</p>
                <p className="truncate text-xs text-slatey">{format(new Date(e.startsAt), 'EEE p')}{e.location ? ` • ${e.location}` : ''}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
