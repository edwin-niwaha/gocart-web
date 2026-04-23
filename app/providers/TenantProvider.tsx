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
import { getTenantSlug } from '@/lib/api/client';
import { sanitizeTenantSlug } from '@/lib/tenant/resolve';
import type {
  TenantBranding,
  TenantFeatureFlag,
  TenantSettings,
} from '@/lib/types';

type TenantContextValue = {
  slug: string | null;
  branding: TenantBranding | null;
  settings: TenantSettings | null;
  flags: TenantFeatureFlag[];
  loading: boolean;
  refresh: () => Promise<void>;
  isEnabled: (key: string, fallback?: boolean) => boolean;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [flags, setFlags] = useState<TenantFeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);

    try {
      const expectedSlug = getTenantSlug();
      setSlug(expectedSlug);

      const current = await tenantApi.current();
      const returnedSlug = sanitizeTenantSlug(
        current?.slug ?? current?.tenant_slug ?? null
      );

      if (expectedSlug && returnedSlug && expectedSlug !== returnedSlug) {
        throw new Error('Tenant response did not match the active storefront.');
      }

      setSlug(returnedSlug ?? expectedSlug);
      setBranding(current?.branding ?? null);
      setSettings(current?.settings ?? null);
      setFlags(Array.isArray(current?.feature_flags) ? current.feature_flags : []);
    } catch {
      setSlug(getTenantSlug());
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
      slug,
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
    [slug, branding, settings, flags, loading]
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
