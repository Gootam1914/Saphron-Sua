import { Link } from 'react-router-dom';
import { Ticket, Users, MessagesSquare, ShieldAlert, ClipboardList, Bell } from 'lucide-react';
import { PageHeader, Card } from '../../components/common/ui.jsx';
import { StatCard, UpcomingEvents } from './parts.jsx';

export default function AdminDashboard({ data, profile }) {
  return (
    <div>
      <PageHeader title={`Welcome, ${profile.displayName.split(' ')[0]}`} subtitle="School-wide overview" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Ticket} tone="amber" label="Open tickets" value={data.tickets?.open ?? 0} hint={`${data.tickets?.inProgress ?? 0} in progress`} />
        <StatCard icon={ShieldAlert} tone="red" label="Messages to review" value={data.pendingModeration ?? 0} />
        <StatCard icon={Users} tone="grape" label="Active users" value={data.totalUsers ?? 0} />
        <StatCard icon={MessagesSquare} tone="brand" label="Unread messages" value={data.unreadMessages ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="mb-4 font-semibold text-ink">Quick actions</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Action to="/tickets" icon={Ticket} title="Ticketing dashboard" desc="Assign, prioritize, resolve" />
              <Action to="/admin/users" icon={Users} title="User management" desc="Roles & permissions" />
              <Action to="/surveys" icon={ClipboardList} title="Survey builder" desc="Create & analyze feedback" />
              <Action to="/messages" icon={Bell} title="Announcements" desc="Message the community" />
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <UpcomingEvents events={data.upcomingEvents} />
        </div>
      </div>
    </div>
  );
}

function Action({ to, icon: Icon, title, desc }) {
  return (
    <Link to={to} className="group flex items-start gap-3 rounded-xl border border-line p-4 transition-all hover:border-brand-300 hover:shadow-card">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-100"><Icon size={20} /></div>
      <div>
        <p className="font-medium text-ink">{title}</p>
        <p className="text-xs text-slatey">{desc}</p>
      </div>
    </Link>
  );
}
