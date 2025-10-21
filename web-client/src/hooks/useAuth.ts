import { useState, useEffect } from 'react';
import { authApi, tokenService } from '../services/api';
import type { UserProfile } from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (tokenService.isAuthenticated()) {
          const userProfile = await authApi.getProfile();
          setUser(userProfile);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load user profile',
        );
        if (err instanceof Error && (err.message.includes('401') || err.message.includes('403') || err.message.includes('Unauthorized'))) {
          tokenService.removeToken();
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const logout = () => {
    tokenService.removeToken();
    setUser(null);
    setError(null);
  };

  const updateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout,
    updateUser,
  };
};
