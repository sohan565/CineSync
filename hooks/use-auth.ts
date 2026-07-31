'use client';

import { useState, useEffect } from 'react';
import { AuthService } from '@/services/auth-service';
import { UserProfile } from '@/types/auth';
import { useAppStore } from '@/hooks/use-store';
import { LoginInput, RegisterInput, GuestInput } from '@/lib/validations/auth';

export function useAuth() {
  const { user, setUser } = useAppStore();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        setIsLoading(true);
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (err: any) {
        console.error('Failed to load session:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSession();
  }, [setUser]);

  const login = async (input: LoginInput) => {
    try {
      setIsLoading(true);
      setError(null);
      const userProfile = await AuthService.login(input);
      setUser(userProfile);
      return userProfile;
    } catch (err: any) {
      const msg = err.message || 'Login failed.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (input: RegisterInput) => {
    try {
      setIsLoading(true);
      setError(null);
      const userProfile = await AuthService.register(input);
      setUser(userProfile);
      return userProfile;
    } catch (err: any) {
      const msg = err.message || 'Registration failed.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const setGuestProfile = async (input: GuestInput) => {
    try {
      setIsLoading(true);
      setError(null);
      const guestProfile = await AuthService.setGuestProfile(input);
      setUser(guestProfile);
      return guestProfile;
    } catch (err: any) {
      const msg = err.message || 'Guest setup failed.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await AuthService.logout();
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    error,
    login,
    register,
    setGuestProfile,
    logout,
    clearError: () => setError(null),
  };
}
