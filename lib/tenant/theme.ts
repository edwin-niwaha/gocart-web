import type { TenantBranding } from '@/lib/types';
export function getBrandPalette(branding?: TenantBranding | null) {
  return {
    primary: branding?.primary_color || '#127D61',
    secondary: branding?.secondary_color || '#0f766e',
    accent: branding?.accent_color || '#F79420',
  };
}
