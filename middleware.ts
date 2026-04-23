import { NextResponse } from 'next/server';
import {
  resolveTenantSlugFromHostname,
  TENANT_COOKIE,
  TENANT_HEADER,
} from './lib/tenant/resolve';

type MiddlewareRequest = {
  headers: Headers;
  nextUrl: {
    hostname: string;
  };
};

function appendVary(existing: string | null, value: string) {
  const values = new Set(
    String(existing ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  );
  values.add(value);
  return Array.from(values).join(', ');
}

export function middleware(request: MiddlewareRequest) {
  const tenantSlug = resolveTenantSlugFromHostname(request.nextUrl.hostname);
  const requestHeaders = new Headers(request.headers);

  if (tenantSlug) {
    requestHeaders.set(TENANT_HEADER, tenantSlug);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set(
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  );
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  response.headers.set('Vary', appendVary(response.headers.get('Vary'), 'Host'));

  if (tenantSlug) {
    response.headers.set(TENANT_HEADER, tenantSlug);
    response.cookies.set(TENANT_COOKIE, tenantSlug, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }

  return response;
}

// Apply middleware to all routes except static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
