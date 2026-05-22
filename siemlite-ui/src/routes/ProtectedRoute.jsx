import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { accessToken, user } = useAuthStore();

  if (!accessToken) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'Admin') return <Navigate to="/dashboard" replace />;

  return children;
}
