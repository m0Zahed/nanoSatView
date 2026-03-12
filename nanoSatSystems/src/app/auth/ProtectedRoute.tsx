import { Navigate, useLocation } from 'react-router';
import { useAuth } from '@/app/auth/AuthContext';

export function ProtectedRoute({
  children,
  allowIncomplete = false,
}: {
  children: React.ReactNode;
  allowIncomplete?: boolean;
}) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowIncomplete && !user.profileComplete) {
    return <Navigate to="/complete-profile" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
