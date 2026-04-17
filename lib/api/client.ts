import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const ACCESS_KEY = 'gocart_access';
const REFRESH_KEY = 'gocart_refresh';
const TENANT_KEY = 'gocart_tenant_slug';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';
const API_PREFIX = '/api/v1';
const API_ROOT = `${API_BASE_URL}${API_PREFIX}`;
const REQUEST_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 15000);

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getTenantSlug(): string | null {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_TENANT_SLUG ?? null;
  return localStorage.getItem(TENANT_KEY) || process.env.NEXT_PUBLIC_TENANT_SLUG || null;
}

export function setTenantSlug(slug: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TENANT_KEY, slug);
}

export function setTokens(access: string, refresh: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  api.defaults.headers.common.Authorization = `Bearer ${access}`;
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  delete api.defaults.headers.common.Authorization;
}

export function normalizeList<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : (data.results ?? []);
}

export const api = axios.create({
  baseURL: API_ROOT,
  timeout: REQUEST_TIMEOUT,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  const tenantSlug = getTenantSlug();

  config.headers = config.headers ?? {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (tenantSlug) {
    config.headers['X-Tenant-Slug'] = tenantSlug;
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

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
      refreshPromise ??= axios
        .post(
          `${API_ROOT}/auth/token/refresh/`,
          { refresh },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: REQUEST_TIMEOUT,
          }
        )
        .then((res) => {
          const newAccess = res.data.access as string;
          if (typeof window !== 'undefined') {
            localStorage.setItem(ACCESS_KEY, newAccess);
          }
          api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
          return newAccess;
        })
        .finally(() => {
          refreshPromise = null;
        });

      const newAccess = await refreshPromise;
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearTokens();
      return Promise.reject(refreshError);
    }
  }
);