import { Link } from 'react-router-dom';
import { MessageCircle, Award, CalendarDays, Star } from 'lucide-react';
import * as Icons from 'lucide-react';

export default function StudentDashboard({ data, profile }) {
  const first = profile.displayName.split(' ')[0];
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 rounded-blob bg-gradient-to-br from-brand-500 to-grape p-8 text-white shadow-pop">
        <p className="font-kid text-kid-lg">Hi {first}!</p>
        <p className="mt-1 text-white/90">You have <b>{data.totalPoints || 0}</b> star points. Keep it up!</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <BigTile to="/messages" icon={MessageCircle} color="bg-sky text-white" title="Messages" sub="Talk to your teacher" />
        <BigTile to="/rewards" icon={Award} color="bg-sun text-ink" title="My Badges" sub={`${data.recentBadges?.length || 0} earned`} />
        <BigTile to="/events" icon={CalendarDays} color="bg-grass text-white" title="What's Happening" sub="Fun events" />
        <BigTile to="/notifications" icon={Star} color="bg-grape text-white" title="Updates" sub="See what's new" />
      </div>

      {data.recentBadges?.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 font-kid text-kid-base font-semibold text-ink">Your latest badges</h2>
          <div className="flex flex-wrap gap-4">
            {data.recentBadges.map((r) => {
              const Icon = Icons[toPascal(r.badge?.icon || 'Star')] || Star;
              return (
                <div key={r._id} className="kid-card flex w-36 flex-col items-center p-5 text-center">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-sun/30 text-saffron-600"><Icon size={34} /></div>
                  <p className="mt-3 font-kid font-semibold text-ink">{r.badge?.label}</p>
                  <p className="text-xs text-slatey">+{r.points} pts</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BigTile({ to, icon: Icon, color, title, sub }) {
  return (
    <Link to={to} className="kid-card flex items-center gap-4 p-6 transition-transform hover:scale-[1.02]">
      <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-blob ${color}`}><Icon size={32} /></div>
      <div>
        <p className="font-kid text-kid-base font-semibold text-ink">{title}</p>
        <p className="text-slatey">{sub}</p>
      </div>
    </Link>
  );
}

function toPascal(s) {
  return String(s).split('-').map((w) => w[0]?.toUpperCase() + w.slice(1)).join('');
}
