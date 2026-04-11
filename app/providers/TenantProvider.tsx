'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { tenantApi } from '@/lib/api/services';
import type {
  TenantBranding,
  TenantFeatureFlag,
  TenantSettings,
} from '@/lib/types';

type TenantContextValue = {
  branding: TenantBranding | null;
  settings: TenantSettings | null;
  flags: TenantFeatureFlag[];
  loading: boolean;
  refresh: () => Promise<void>;
  isEnabled: (key: string, fallback?: boolean) => boolean;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [flags, setFlags] = useState<TenantFeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);

    try {
      const current = await tenantApi.current();

      setBranding(current?.branding ?? null);
      setSettings(current?.settings ?? null);
      setFlags(Array.isArray(current?.feature_flags) ? current.feature_flags : []);
    } catch {
      setBranding(null);
      setSettings(null);
      setFlags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo<TenantContextValue>(
    () => ({
      branding,
      settings,
      flags,
      loading,
      refresh,
      isEnabled: (key: string, fallback = true) => {
        const match = flags.find((flag) => flag.key === key);
        return typeof match?.enabled === 'boolean' ? match.enabled : fallback;
      },
    }),
    [branding, settings, flags, loading]
  );

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}