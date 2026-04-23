'use client';

import { create } from 'zustand';
import { authApi } from '@/lib/api/services';
import type { TenantMembershipRole, User } from '@/lib/types';
import {
  canAccessDashboardUser,
  getCurrentRole,
  hasTenantRole,
} from '@/lib/auth/roles';

interface AuthState {
  user: User | null;
  hydrated: boolean;
  loading: boolean;
  ready: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;

  currentRole: () => string | null;
  canAccessDashboard: () => boolean;
  hasRole: (role: TenantMembershipRole) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  hydrated: false,
  loading: false,
  ready: false,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  hydrate: async () => {
    set({ loading: true });

    try {
      const user = await authApi.me();

      set({
        user,
        hydrated: true,
        ready: true,
        loading: false,
        isAuthenticated: !!user,
      });
    } catch {
      set({
        user: null,
        hydrated: true,
        ready: true,
        loading: false,
        isAuthenticated: false,
      });
    }
  },

  logout: async () => {
    set({ loading: true });

    try {
      await authApi.logout();
    } finally {
      set({
        user: null,
        loading: false,
        hydrated: true,
        ready: true,
        isAuthenticated: false,
      });
    }
  },

  currentRole: () => getCurrentRole(get().user),
  canAccessDashboard: () => canAccessDashboardUser(get().user),
  hasRole: (role) => hasTenantRole(get().user, role),
}));
