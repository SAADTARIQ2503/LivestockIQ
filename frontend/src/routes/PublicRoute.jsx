import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

/**
 * PublicRoute component
 * Redirects to dashboard if user is already authenticated
 * Used for login/register pages
 */
export const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    // User is already logged in, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
