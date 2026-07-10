import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Spinner } from '../common/ui.jsx';

export default function ProtectedRoute({ children, allow }) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="grid min-h-screen place-items-center"><Spinner /></div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allow && !allow.includes(role)) return <Navigate to="/" replace />;
  return children;
}
