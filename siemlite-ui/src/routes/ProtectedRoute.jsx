import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { accessToken, user } = useAuthStore();
  const location = useLocation();

  if (!accessToken) return <Navigate to="/login" replace />;

  // Force password change before accessing anything else
  if (user?.force_pw_change && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (adminOnly && user?.role !== 'Admin') return <Navigate to="/dashboard" replace />;

  return children;
}