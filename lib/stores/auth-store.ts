'use client';

import { create } from 'zustand';
import { authApi } from '@/lib/api/services';
import type { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  hydrated: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  loading: false,
  setUser: (user) => set({ user }),
  hydrate: async () => {
    set({ loading: true });
    try {
      const user = await authApi.me();
      set({ user, hydrated: true, loading: false });
    } catch {
      set({ user: null, hydrated: true, loading: false });
    }
  },
  logout: async () => {
    set({ loading: true });
    try {
      await authApi.logout();
    } finally {
      set({ user: null, loading: false, hydrated: true });
    }
  },
}));
