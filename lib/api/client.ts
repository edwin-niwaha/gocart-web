import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  resolveBrowserTenantSlug,
  sanitizeTenantSlug,
  TENANT_HEADER,
} from '@/lib/tenant/resolve';
import {
  getTenantTokenStorageKey,
  LEGACY_ACCESS_KEY,
  LEGACY_REFRESH_KEY,
} from '@/lib/security/token-storage';

const TENANT_OVERRIDE_KEY = 'gocart_tenant_slug_override';
const API_PREFIX = '/api/v1';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';
export const API_ROOT = API_BASE_URL ? `${API_BASE_URL}${API_PREFIX}` : API_PREFIX;

const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV;
const ALLOW_INSECURE_API =
  process.env.NEXT_PUBLIC_ALLOW_INSECURE_API === 'true';
const ALLOW_TENANT_OVERRIDE =
  process.env.NEXT_PUBLIC_ALLOW_TENANT_OVERRIDE === 'true';
const REQUIRE_TENANT = process.env.NEXT_PUBLIC_REQUIRE_TENANT !== 'false';
const REQUEST_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 15000);

function withTenantParam(
  params: InternalAxiosRequestConfig['params'],
  tenantSlug: string
) {
  if (typeof URLSearchParams !== 'undefined' && params instanceof URLSearchParams) {
    const nextParams = new URLSearchParams(params);
    if (!nextParams.has('tenant')) {
      nextParams.set('tenant', tenantSlug);
    }
    return nextParams;
  }

  if (params && typeof params === 'object' && !Array.isArray(params)) {
    return {
      tenant: tenantSlug,
      ...params,
    };
  }

  return {
    tenant: tenantSlug,
  };
}

function getApiConfigurationError() {
  if (!API_BASE_URL) {
    return 'NEXT_PUBLIC_API_BASE_URL must be set before API requests can be made.';
  }

  let parsed: URL;
  try {
    parsed = new URL(API_BASE_URL);
  } catch {
    return 'NEXT_PUBLIC_API_BASE_URL must be a valid absolute URL.';
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return 'NEXT_PUBLIC_API_BASE_URL must use http or https.';
  }

  if (APP_ENV === 'production' && parsed.protocol !== 'https:' && !ALLOW_INSECURE_API) {
    return 'Production API traffic must use HTTPS.';
  }

  if (!Number.isFinite(REQUEST_TIMEOUT) || REQUEST_TIMEOUT < 1000) {
    return 'NEXT_PUBLIC_API_TIMEOUT_MS must be at least 1000 milliseconds.';
  }

  if (REQUIRE_TENANT && !getTenantSlug()) {
    return 'Tenant could not be resolved. Configure NEXT_PUBLIC_TENANT_SLUG, NEXT_PUBLIC_TENANT_ROOT_DOMAIN, or NEXT_PUBLIC_TENANT_DOMAIN_MAP.';
  }

  return null;
}

function assertApiConfigured() {
  const configError = getApiConfigurationError();
  if (configError) {
    throw new Error(configError);
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  const accessKey = getTenantTokenStorageKey('access', getTenantSlug());
  return accessKey ? localStorage.getItem(accessKey) : null;
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;

  const refreshKey = getTenantTokenStorageKey('refresh', getTenantSlug());
  return refreshKey ? localStorage.getItem(refreshKey) : null;
}

export function getTenantSlug(): string | null {
  const resolvedSlug = resolveBrowserTenantSlug();

  if (typeof window === 'undefined') {
    return resolvedSlug;
  }

  if (ALLOW_TENANT_OVERRIDE) {
    return sanitizeTenantSlug(localStorage.getItem(TENANT_OVERRIDE_KEY)) ?? resolvedSlug;
  }

  return resolvedSlug;
}

export function setTenantSlug(slug: string) {
  if (typeof window === 'undefined') return;

  const sanitizedSlug = sanitizeTenantSlug(slug);
  if (!sanitizedSlug) {
    throw new Error('Tenant slug must be a valid lowercase slug.');
  }

  if (ALLOW_TENANT_OVERRIDE) {
    localStorage.setItem(TENANT_OVERRIDE_KEY, sanitizedSlug);
  }
}

export function setTokens(access: string, refresh: string) {
  if (typeof window === 'undefined') return;

  const tenantSlug = getTenantSlug();
  const accessKey = getTenantTokenStorageKey('access', tenantSlug);
  const refreshKey = getTenantTokenStorageKey('refresh', tenantSlug);

  if (!accessKey || !refreshKey) {
    throw new Error('Cannot store auth tokens until tenant is resolved.');
  }

  localStorage.setItem(accessKey, access);
  localStorage.setItem(refreshKey, refresh);
  localStorage.removeItem(LEGACY_ACCESS_KEY);
  localStorage.removeItem(LEGACY_REFRESH_KEY);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;

  const tenantSlug = getTenantSlug();
  const accessKey = getTenantTokenStorageKey('access', tenantSlug);
  const refreshKey = getTenantTokenStorageKey('refresh', tenantSlug);

  if (accessKey) localStorage.removeItem(accessKey);
  if (refreshKey) localStorage.removeItem(refreshKey);
  localStorage.removeItem(LEGACY_ACCESS_KEY);
  localStorage.removeItem(LEGACY_REFRESH_KEY);
  delete api.defaults.headers.common.Authorization;
}

export function normalizeList<T>(data: T[] | { results?: T[] } | unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'results' in data) {
    const results = (data as { results?: unknown }).results;
    if (Array.isArray(results)) return results as T[];
  }
  return [];
}

function getResponseTenantHeader(response: AxiosResponse): string | null {
  const headerValue =
    response.headers?.[TENANT_HEADER] ??
    response.headers?.[TENANT_HEADER.toLowerCase()];

  return sanitizeTenantSlug(
    Array.isArray(headerValue) ? headerValue[0] : String(headerValue ?? '')
  );
}

function assertResponseTenantHeader(response: AxiosResponse) {
  const expectedTenantSlug = getTenantSlug();
  const returnedTenantSlug = getResponseTenantHeader(response);

  if (
    expectedTenantSlug &&
    returnedTenantSlug &&
    expectedTenantSlug !== returnedTenantSlug
  ) {
    throw new Error('API response tenant did not match the active storefront.');
  }
}

export const api = axios.create({
  baseURL: API_ROOT,
  timeout: Number.isFinite(REQUEST_TIMEOUT) ? REQUEST_TIMEOUT : 15000,
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  assertApiConfigured();

  const token = getAccessToken();
  const tenantSlug = getTenantSlug();

  config.headers = config.headers ?? {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  if (tenantSlug) {
    if (typeof window === 'undefined') {
      config.headers[TENANT_HEADER] = tenantSlug;
    } else {
      config.params = withTenantParam(config.params, tenantSlug);
    }
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(refresh: string) {
  assertApiConfigured();

  const tenantSlug = getTenantSlug();
  const response = await axios.post(
    `${API_ROOT}/auth/token/refresh/`,
    { refresh },
    {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        ...(tenantSlug && typeof window === 'undefined'
          ? { [TENANT_HEADER]: tenantSlug }
          : {}),
      },
      params:
        tenantSlug && typeof window !== 'undefined'
          ? { tenant: tenantSlug }
          : undefined,
      timeout: Number.isFinite(REQUEST_TIMEOUT) ? REQUEST_TIMEOUT : 15000,
    }
  );

  const newAccess = response.data?.access;
  const newRefresh = response.data?.refresh ?? refresh;

  if (typeof newAccess !== 'string' || !newAccess) {
    throw new Error('Token refresh did not return a valid access token.');
  }

  if (typeof newRefresh !== 'string' || !newRefresh) {
    throw new Error('Token refresh did not return a valid refresh token.');
  }

  setTokens(newAccess, newRefresh);
  return newAccess;
}

api.interceptors.response.use(
  (response) => {
    assertResponseTenantHeader(response);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequest | undefined;

    const status = error.response?.status;
    const url = originalRequest?.url ?? '';

    const isExcluded =
      url.includes('/auth/login/') ||
      url.includes('/auth/register/') ||
      url.includes('/auth/social/google/') ||
      url.includes('/auth/token/refresh/') ||
      url.includes('/auth/logout/');

    if (!originalRequest || status !== 401 || originalRequest._retry || isExcluded) {
      return Promise.reject(error);
    }

    const refresh = getRefreshToken();
    if (!refresh) {
      clearTokens();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise ??= refreshAccessToken(refresh).finally(() => {
        refreshPromise = null;
      });

      const newAccess = await refreshPromise;
      if (!newAccess) {
        clearTokens();
        return Promise.reject(error);
      }

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearTokens();
      return Promise.reject(refreshError);
    }
  }
);
