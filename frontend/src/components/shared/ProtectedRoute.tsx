import { Navigate } from 'react-router-dom';
import { useUserStore } from '../../stores/userStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user } = useUserStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
