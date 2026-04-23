export const TENANT_HEADER = 'X-Tenant-Slug';
export const TENANT_COOKIE = 'gocart_tenant_slug';

const TENANT_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'admin', 'api', 'cdn']);

type ResolveOptions = {
  allowEnvFallback?: boolean;
};

function normalizeHostname(value?: string | null): string | null {
  const hostname = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\.$/, '');

  if (!hostname) return null;

  if (hostname.startsWith('[')) {
    return hostname;
  }

  return hostname.split(':')[0] || null;
}

export function sanitizeTenantSlug(value?: string | null): string | null {
  const slug = String(value ?? '').trim().toLowerCase();
  return TENANT_SLUG_PATTERN.test(slug) ? slug : null;
}

function parseDomainMapEntry(entry: string): [string, string] | null {
  const trimmed = entry.trim();
  if (!trimmed) return null;

  const separatorIndex = trimmed.includes('=')
    ? trimmed.indexOf('=')
    : trimmed.lastIndexOf(':');

  if (separatorIndex <= 0) return null;

  const hostname = normalizeHostname(trimmed.slice(0, separatorIndex));
  const slug = sanitizeTenantSlug(trimmed.slice(separatorIndex + 1));

  return hostname && slug ? [hostname, slug] : null;
}

export function parseTenantDomainMap(
  value = process.env.NEXT_PUBLIC_TENANT_DOMAIN_MAP
): Record<string, string> {
  const raw = String(value ?? '').trim();
  if (!raw) return {};

  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return Object.fromEntries(
        Object.entries(parsed)
          .map(([hostname, slug]) => [
            normalizeHostname(hostname),
            sanitizeTenantSlug(String(slug ?? '')),
          ])
          .filter(
            (entry): entry is [string, string] =>
              Boolean(entry[0]) && Boolean(entry[1])
          )
      );
    } catch {
      return {};
    }
  }

  return Object.fromEntries(
    raw
      .split(',')
      .map(parseDomainMapEntry)
      .filter((entry): entry is [string, string] => Boolean(entry))
  );
}

export function getTenantSlugFromCookieString(
  cookieString?: string | null
): string | null {
  const cookies = String(cookieString ?? '')
    .split(';')
    .map((part) => part.trim());

  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf('=');
    if (separatorIndex <= 0) continue;

    const name = cookie.slice(0, separatorIndex);
    if (name !== TENANT_COOKIE) continue;

    try {
      return sanitizeTenantSlug(
        decodeURIComponent(cookie.slice(separatorIndex + 1))
      );
    } catch {
      return null;
    }
  }

  return null;
}

export function resolveTenantSlugFromHostname(
  hostname?: string | null,
  options: ResolveOptions = {}
): string | null {
  const allowEnvFallback = options.allowEnvFallback ?? true;
  const normalizedHostname = normalizeHostname(hostname);
  const domainMap = parseTenantDomainMap();

  if (normalizedHostname && domainMap[normalizedHostname]) {
    return domainMap[normalizedHostname];
  }

  const rootDomain = normalizeHostname(process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN);
  if (
    normalizedHostname &&
    rootDomain &&
    normalizedHostname !== rootDomain &&
    normalizedHostname.endsWith(`.${rootDomain}`)
  ) {
    const subdomain = normalizedHostname
      .slice(0, -(rootDomain.length + 1))
      .split('.')[0];
    const slug = sanitizeTenantSlug(subdomain);

    if (slug && !RESERVED_SUBDOMAINS.has(slug)) {
      return slug;
    }
  }

  return allowEnvFallback
    ? sanitizeTenantSlug(process.env.NEXT_PUBLIC_TENANT_SLUG)
    : null;
}

export function resolveBrowserTenantSlug(): string | null {
  if (typeof window === 'undefined') {
    return resolveTenantSlugFromHostname(null);
  }

  const hostSlug = resolveTenantSlugFromHostname(window.location.hostname, {
    allowEnvFallback: false,
  });

  if (hostSlug) return hostSlug;

  return (
    getTenantSlugFromCookieString(document.cookie) ??
    sanitizeTenantSlug(process.env.NEXT_PUBLIC_TENANT_SLUG)
  );
}
