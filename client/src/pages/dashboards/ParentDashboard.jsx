import { Link } from 'react-router-dom';
import { MessagesSquare, Ticket, Award, FileSignature } from 'lucide-react';
import { PageHeader, Card, Avatar, Chip } from '../../components/common/ui.jsx';
import { StatCard, UpcomingEvents } from './parts.jsx';

export default function ParentDashboard({ data, profile }) {
  return (
    <div>
      <PageHeader title={`Hello, ${profile.displayName.split(' ')[0]}`} subtitle="Your family at a glance" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={MessagesSquare} tone="brand" label="Unread messages" value={data.unreadMessages ?? 0} />
        <StatCard icon={Ticket} tone="amber" label="My open tickets" value={data.myOpenTickets ?? 0} />
        <StatCard icon={Award} tone="grape" label="Badges earned" value={data.childRewardCount ?? 0} hint="by your children" />
        <StatCard icon={FileSignature} tone="sky" label="Notifications" value={data.unreadNotifications ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="mb-3 font-semibold text-ink">My children</h3>
            {(data.children || []).length === 0 ? (
              <p className="text-sm text-slatey">No children linked to your account yet. Contact your school admin.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.children.map((c) => (
                  <div key={c._id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                    <Avatar name={c.displayName} src={c.photoURL} />
                    <div>
                      <p className="font-medium text-ink">{c.displayName}</p>
                      <Chip tone="green">Grade {c.gradeLevel || '-'}</Chip>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/messages" className="btn-secondary">Message a teacher</Link>
              <Link to="/documents" className="btn-secondary">Sign permission slips</Link>
              <Link to="/tickets" className="btn-secondary">Submit a ticket</Link>
            </div>
          </Card>
        </div>
        <UpcomingEvents events={data.upcomingEvents} />
      </div>
    </div>
  );
}
