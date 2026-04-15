'use client';

import { useAuthStore } from '@/lib/stores/auth-store';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const ready = useAuthStore((state) => state.ready);
  const hydrated = useAuthStore((state) => state.hydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);

  return {
    user,
    loading,
    ready,
    hydrated,
    isAuthenticated,
    logout,
    setAuthUser: setUser,
  };
}