import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, LogOut, Bell, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { navForRole } from './nav.js';
import { Avatar, Chip } from '../common/ui.jsx';
import { api } from '../../lib/api.js';

const ROLE_TONE = { admin: 'grape', teacher: 'sky', parent: 'brand', student: 'green' };

export default function AppShell() {
  const { profile, role, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const isStudent = role === 'student';

  useEffect(() => {
    let alive = true;
    const load = () => api.get('/notifications?unread=true').then((d) => alive && setUnread(d.unreadCount)).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const items = navForRole(role);

  const SidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
          <GraduationCap size={20} />
        </div>
        <div>
          <p className="text-base font-bold leading-none text-ink">Saphron Sua</p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">School Comms</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slatey hover:bg-slate-100'
              } ${isStudent ? 'text-base py-3' : ''}`
            }
          >
            <Icon size={isStudent ? 22 : 18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={profile?.displayName} src={profile?.photoURL} size={38} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{profile?.displayName}</p>
            <Chip tone={ROLE_TONE[role]} className="mt-0.5 capitalize">{role}</Chip>
          </div>
        </div>
        <button
          onClick={async () => { await logout(); nav('/login'); }}
          className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slatey hover:bg-slate-100"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">{SidebarInner}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-soft animate-fade-in">{SidebarInner}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur">
          <button className="rounded-lg p-2 text-slatey hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="hidden lg:block" />
          <NavLink to="/notifications" className="relative rounded-lg p-2 text-slatey hover:bg-slate-100" aria-label="Notifications">
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </NavLink>
        </header>
        <main className={`flex-1 ${isStudent ? 'p-5 sm:p-8' : 'p-4 sm:p-6 lg:p-8'} animate-fade-in`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
