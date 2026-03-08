'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}


export type AuthTokens = {
  refresh: string;
  access: string;
};

export type BackendUser = {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  user_type: string;
  is_active: boolean;
  created_at: string;
};

export type AuthResponse = {
  user: BackendUser;
  tokens: AuthTokens;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
};

export type LogoutPayload = {
  refresh: string;
};

export type GoogleLoginPayload = {
  access_token: string;
};
