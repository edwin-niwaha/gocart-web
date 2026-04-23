export const LEGACY_ACCESS_KEY = 'gocart_access';
export const LEGACY_REFRESH_KEY = 'gocart_refresh';

const TOKEN_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

type TokenKind = 'access' | 'refresh';

function normalizeTenantSlug(value?: string | null): string | null {
  const slug = String(value ?? '').trim().toLowerCase();
  return TOKEN_SLUG_PATTERN.test(slug) ? slug : null;
}

export function getTenantTokenStorageKey(
  kind: TokenKind,
  tenantSlug?: string | null
): string | null {
  const slug = normalizeTenantSlug(tenantSlug);
  return slug ? `gocart_${kind}:${slug}` : null;
}
