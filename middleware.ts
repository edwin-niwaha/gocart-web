import { NextResponse, type NextRequest } from 'next/server';
import {
  resolveTenantSlugFromHostname,
  TENANT_COOKIE,
  TENANT_HEADER,
} from './lib/tenant/resolve';

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

function applySecurityHeaders(response: NextResponse, isSecureRequest: boolean) {
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
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-site');
  response.headers.set('Origin-Agent-Cluster', '?1');
  response.headers.set('X-DNS-Prefetch-Control', 'off');

  if (isSecureRequest) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
}

export function middleware(request: NextRequest) {
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

  applySecurityHeaders(
    response,
    request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production'
  );
  response.headers.set('Vary', appendVary(response.headers.get('Vary'), 'Host'));

  if (tenantSlug) {
    response.headers.set(TENANT_HEADER, tenantSlug);
    response.cookies.set(TENANT_COOKIE, tenantSlug, {
      httpOnly: false,
      sameSite: 'lax',
      secure:
        request.nextUrl.protocol === 'https:' ||
        process.env.NODE_ENV === 'production',
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
