import { useAuth } from '../contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

export default function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-color)' }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}
