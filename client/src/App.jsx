import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import AppShell from './components/layout/AppShell.jsx';

import Login from './pages/Login.jsx';
import DashboardRouter from './pages/dashboards/DashboardRouter.jsx';
import MessagingCenter from './pages/MessagingCenter.jsx';
import ModerationQueue from './pages/ModerationQueue.jsx';
import TicketManager from './pages/TicketManager.jsx';
import EventCalendar from './pages/EventCalendar.jsx';
import DocumentRepository from './pages/DocumentRepository.jsx';
import SurveyCenter from './pages/SurveyCenter.jsx';
import RewardsBoard from './pages/RewardsBoard.jsx';
import NotificationSettings from './pages/NotificationSettings.jsx';
import UserManagement from './pages/UserManagement.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardRouter />} />
        <Route path="messages" element={<MessagingCenter />} />
        <Route path="messages/:conversationId" element={<MessagingCenter />} />
        <Route path="moderation" element={<ProtectedRoute allow={['teacher', 'admin']}><ModerationQueue /></ProtectedRoute>} />
        <Route path="tickets" element={<ProtectedRoute allow={['admin', 'parent', 'teacher']}><TicketManager /></ProtectedRoute>} />
        <Route path="tickets/:ticketId" element={<ProtectedRoute allow={['admin', 'parent', 'teacher']}><TicketManager /></ProtectedRoute>} />
        <Route path="events" element={<EventCalendar />} />
        <Route path="documents" element={<ProtectedRoute allow={['admin', 'parent', 'teacher']}><DocumentRepository /></ProtectedRoute>} />
        <Route path="surveys" element={<ProtectedRoute allow={['admin', 'parent', 'teacher']}><SurveyCenter /></ProtectedRoute>} />
        <Route path="surveys/:surveyId" element={<ProtectedRoute allow={['admin', 'parent', 'teacher']}><SurveyCenter /></ProtectedRoute>} />
        <Route path="rewards" element={<RewardsBoard />} />
        <Route path="notifications" element={<NotificationSettings />} />
        <Route path="admin/users" element={<ProtectedRoute allow={['admin']}><UserManagement /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
