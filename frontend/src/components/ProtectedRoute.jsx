import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// <ProtectedRoute roles={['admin']}> ... </ProtectedRoute>
// Not logged in -> /login. Wrong role -> /unauthorized.
// (This is UX only. The real security check is requireRole() on the backend.)
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="p-8 text-center text-slate-500">Loading…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}
