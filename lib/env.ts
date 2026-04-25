const API_PREFIX = '/api/v1';
const DEFAULT_APP_NAME = 'GoCart';
const DEFAULT_SITE_URL = 'http://localhost:3000';

function trimValue(value?: string | null) {
  return String(value ?? '').trim();
}

function normalizeAbsoluteUrl(value?: string | null) {
  const trimmed = trimValue(value);
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return trimmed.replace(/\/$/, '');
  }
}

export function normalizeApiBaseUrl(value?: string | null) {
  const normalized = normalizeAbsoluteUrl(value);
  if (!normalized) return '';

  try {
    const url = new URL(normalized);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    if (pathname === API_PREFIX) {
      url.pathname = '';
    }

    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return normalized.replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '');
  }
}

export function getApiBaseUrl() {
  return normalizeApiBaseUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL
  );
}

export function getSiteUrl() {
  return normalizeAbsoluteUrl(process.env.NEXT_PUBLIC_SITE_URL) || DEFAULT_SITE_URL;
}

export function getAppName() {
  return trimValue(process.env.NEXT_PUBLIC_APP_NAME) || DEFAULT_APP_NAME;
}

export function isProductionAppEnv() {
  const appEnv = trimValue(
    process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV
  );
  return appEnv === 'production';
}

export function toAbsoluteMediaUrl(value?: string | null) {
  const trimmed = trimValue(value);
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const base = getApiBaseUrl();
  if (!base) return trimmed;

  return `${base}/${trimmed.replace(/^\//, '')}`;
}
