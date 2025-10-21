import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenService } from '../services/api';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
      if (!isMounted) return;
      const isAuthenticated = tokenService.isAuthenticated();
      if (!isAuthenticated) {
        navigate('/login', { replace: true });
        return;
      }
      setIsChecking(false);
    };

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Checking authentication...</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
