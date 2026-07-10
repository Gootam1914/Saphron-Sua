import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../lib/api.js';
import { Spinner } from '../../components/common/ui.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import ParentDashboard from './ParentDashboard.jsx';
import TeacherDashboard from './TeacherDashboard.jsx';
import StudentDashboard from './StudentDashboard.jsx';

export default function DashboardRouter() {
  const { role, profile } = useAuth();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="rounded-lg bg-rose-50 px-4 py-3 text-rose-700">{err}</p>;
  if (!data) return <Spinner label="Loading your dashboard…" />;

  const props = { data, profile };
  if (role === 'admin') return <AdminDashboard {...props} />;
  if (role === 'teacher') return <TeacherDashboard {...props} />;
  if (role === 'parent') return <ParentDashboard {...props} />;
  return <StudentDashboard {...props} />;
}
