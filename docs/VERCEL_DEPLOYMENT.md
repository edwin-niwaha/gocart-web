# Vercel deployment

Required env vars:
- NEXT_PUBLIC_API_BASE_URL
- NEXT_PUBLIC_API_TIMEOUT_MS
- NEXT_PUBLIC_TENANT_SLUG, NEXT_PUBLIC_TENANT_ROOT_DOMAIN, or NEXT_PUBLIC_TENANT_DOMAIN_MAP
- NEXT_PUBLIC_REQUIRE_TENANT
- NEXT_PUBLIC_ALLOW_TENANT_OVERRIDE
- NEXT_PUBLIC_APP_ENV
- NEXT_PUBLIC_ALLOW_INSECURE_API
- NEXT_PUBLIC_IMAGE_HOSTNAMES
- NEXT_PUBLIC_SITE_URL
- NEXT_PUBLIC_GOOGLE_CLIENT_ID
- NEXT_PUBLIC_GA_ID (optional)

Optional compatibility var:
- NEXT_PUBLIC_API_URL

Tenant resolution:
- Single-store deployment: set NEXT_PUBLIC_TENANT_SLUG.
- Subdomain tenancy: set NEXT_PUBLIC_TENANT_ROOT_DOMAIN, for example shops.example.com so acme.shops.example.com resolves to acme.
- Custom domains: set NEXT_PUBLIC_TENANT_DOMAIN_MAP as comma-separated hostname=slug pairs or JSON.
- Keep NEXT_PUBLIC_ALLOW_TENANT_OVERRIDE=false in production.
- The frontend sends X-Tenant-Slug for API compatibility, but backend APIs must still enforce tenant ownership and permissions on every request.

Before release, run:
- npm run validate:env
- npm run lint
- npm run typecheck
- npm run build
