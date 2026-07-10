import { Link } from 'react-router-dom';
import { ShieldAlert, MessagesSquare, ClipboardList, Award, FolderPlus, CalendarPlus } from 'lucide-react';
import { PageHeader, Card } from '../../components/common/ui.jsx';
import { StatCard, UpcomingEvents } from './parts.jsx';

export default function TeacherDashboard({ data, profile }) {
  return (
    <div>
      <PageHeader title={`Welcome, ${profile.displayName}`} subtitle={`${data.classroomCount || 0} classroom(s)`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShieldAlert} tone="red" label="Student messages to review" value={data.pendingModeration ?? 0} />
        <StatCard icon={MessagesSquare} tone="brand" label="Unread messages" value={data.unreadMessages ?? 0} />
        <StatCard icon={ClipboardList} tone="sky" label="My surveys" value={data.mySurveys ?? 0} />
        <StatCard icon={Award} tone="amber" label="My open tickets" value={data.myOpenTickets ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 font-semibold text-ink">Quick actions</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Action to="/moderation" icon={ShieldAlert} title="Moderation queue" desc="Approve student messages" />
            <Action to="/messages" icon={MessagesSquare} title="Broadcast to class" desc="Send an announcement" />
            <Action to="/events" icon={CalendarPlus} title="Create an event" desc="Field trips, meetings" />
            <Action to="/documents" icon={FolderPlus} title="Upload a document" desc="Slips, newsletters" />
            <Action to="/rewards" icon={Award} title="Award a badge" desc="Recognize good behavior" />
            <Action to="/surveys" icon={ClipboardList} title="Build a survey" desc="Post-lesson feedback" />
          </div>
        </Card>
        <UpcomingEvents events={data.upcomingEvents} />
      </div>
    </div>
  );
}

function Action({ to, icon: Icon, title, desc }) {
  return (
    <Link to={to} className="group flex items-start gap-3 rounded-xl border border-line p-4 transition-all hover:border-brand-300 hover:shadow-card">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-sky-50 text-sky-600"><Icon size={20} /></div>
      <div><p className="font-medium text-ink">{title}</p><p className="text-xs text-slatey">{desc}</p></div>
    </Link>
  );
}
