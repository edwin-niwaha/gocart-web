# GoCart Web

![Build](https://img.shields.io/badge/build-verified%20locally-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-GPLv3-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2.35-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)

GoCart Web is a tenant-aware ecommerce frontend built with Next.js App Router, React, TypeScript, and Tailwind CSS. It provides a branded storefront, shopper account area, checkout flow, and an admin dashboard backed by the GoCart API.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Production Checks](#production-checks)
- [Contributing](#contributing)
- [License](#license)

## Features

- Multi-tenant storefront resolution using a fixed tenant slug, subdomain routing, or custom domain mappings
- Catalog browsing with products, categories, product details, reviews, and search
- Shopper workflows for authentication, wishlists, cart management, checkout, orders, addresses, payments, and notifications
- Admin dashboard for products, inventory, coupons, shipments, branding, support, feature flags, users, and related resources
- Tenant-aware API client with token refresh, idempotency helpers, and compatibility headers/query params
- Production-minded middleware with security headers and tenant propagation
- Optional Google sign-in and analytics support

## Tech Stack

| Layer | Tools |
| --- | --- |
| Framework | Next.js 14 App Router, React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS, PostCSS |
| Data fetching | Axios, TanStack Query |
| Client state | Zustand |
| Tooling | ESLint, TypeScript, custom env validation, security regression tests, API contract checks |

## Prerequisites

- Node.js 20 or newer
- npm (bundled with Node.js 20+)
- A running GoCart API instance exposing `/api/v1/*`
- A valid `.env.local` file for your target environment

## Quick Start

1. Clone the repository and move into the project directory.

```bash
git clone https://github.com/edwin-niwaha/gocart-web.git
cd gocart-web
```

2. Install dependencies from the checked-in lockfile.

```bash
npm ci
```

If PowerShell blocks `npm`, use `npm.cmd` instead:

```powershell
npm.cmd ci
```

3. Create a local environment file from the example template.

```powershell
Copy-Item .env.example .env.local
```

```bash
cp .env.example .env.local
```

4. Update `.env.local` with values for your API, site URL, and tenant strategy.
   The provided `.env.example` is safe for local development and uses `http://localhost:8000` for the GoCart backend plus `http://localhost:3000` for the site URL.

5. Validate the environment before starting the app.

```bash
npm run validate:env
```

6. Start the development server.

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000).

## Environment Configuration

The frontend expects the GoCart API base origin and appends `/api/v1` internally. For example, set `NEXT_PUBLIC_API_BASE_URL=https://api.example.com`, not `https://api.example.com/api/v1`.

If `/api/v1` is accidentally included, the app now strips it automatically for compatibility, but using the origin-only value is still recommended.

For tenant resolution, configure at least one of the following:

- `NEXT_PUBLIC_TENANT_SLUG` for a single-store deployment
- `NEXT_PUBLIC_TENANT_ROOT_DOMAIN` for subdomain-based tenancy such as `store.example.com`
- `NEXT_PUBLIC_TENANT_DOMAIN_MAP` for custom domains using `hostname=slug` pairs or JSON

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Absolute base URL for the backend API origin |
| `NEXT_PUBLIC_API_TIMEOUT_MS` | Recommended | API request timeout in milliseconds; keep between `1000` and `60000` |
| `NEXT_PUBLIC_TENANT_SLUG` | Conditional | Fixed tenant slug for single-tenant storefront deployments |
| `NEXT_PUBLIC_TENANT_ROOT_DOMAIN` | Conditional | Root hostname used to derive tenant slugs from subdomains |
| `NEXT_PUBLIC_TENANT_DOMAIN_MAP` | Conditional | Comma-separated `hostname=slug` pairs or JSON for custom domain routing |
| `NEXT_PUBLIC_REQUIRE_TENANT` | Recommended | When `true`, blocks API usage until a tenant is resolved |
| `NEXT_PUBLIC_ALLOW_TENANT_OVERRIDE` | Recommended | Keep `false` in production; only enable for controlled local debugging |
| `NEXT_PUBLIC_APP_ENV` | Recommended | Application environment such as `development` or `production` |
| `NEXT_PUBLIC_ALLOW_INSECURE_API` | Optional | Set to `true` only when intentionally using HTTP during local development |
| `NEXT_PUBLIC_IMAGE_HOSTNAMES` | Recommended | Comma-separated remote image hosts or URLs allowed by `next/image` config |
| `NEXT_PUBLIC_API_URL` | Optional | Legacy compatibility fallback used by some image helpers |
| `NEXT_PUBLIC_APP_NAME` | Optional | Branding value included in the env template for app-level naming consistency |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public site URL used for metadata and canonical links |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID for Google sign-in |
| `NEXT_PUBLIC_GA_ID` | Optional | Google Analytics identifier |

### Production Checklist

- Set `NEXT_PUBLIC_APP_ENV=production`
- Use HTTPS values for `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_SITE_URL`
- Keep `NEXT_PUBLIC_ALLOW_INSECURE_API=false`
- Keep `NEXT_PUBLIC_ALLOW_TENANT_OVERRIDE=false`
- Set `NEXT_PUBLIC_IMAGE_HOSTNAMES` to the remote image hosts your deployment should trust

### Example Local Configuration

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_TIMEOUT_MS=15000
NEXT_PUBLIC_TENANT_SLUG=gocart
NEXT_PUBLIC_TENANT_ROOT_DOMAIN=
NEXT_PUBLIC_TENANT_DOMAIN_MAP=
NEXT_PUBLIC_REQUIRE_TENANT=true
NEXT_PUBLIC_ALLOW_TENANT_OVERRIDE=true
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_ALLOW_INSECURE_API=true
NEXT_PUBLIC_IMAGE_HOSTNAMES=localhost,127.0.0.1
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_APP_NAME=GoCart
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GA_ID=
```

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Starts the Next.js development server |
| `npm run build` | Creates an optimized production build |
| `npm run start` | Runs the production server after a successful build |
| `npm run lint` | Runs the Next.js ESLint checks |
| `npm run typecheck` | Runs TypeScript without emitting build artifacts |
| `npm run type-check` | Alias for `typecheck` |
| `npm test` | Runs the security and API contract test suites |
| `npm run test:security` | Verifies security-sensitive client behaviors and idempotency helpers |
| `npm run test:api` | Verifies exported API service contracts and expected endpoints |
| `npm run validate:env` | Validates required environment variables and safe production settings |
| `npm run release:check` | Runs the full release gate: env validation, lint, typecheck, tests, and production build |

## Project Structure

```text
gocart-web/
|-- app/                    # App Router pages for storefront, auth, account, and dashboard
|-- components/             # Shared UI, forms, layout, dashboard, and storefront components
|-- docs/                   # Deployment and operational documentation
|-- lib/
|   |-- api/                # Axios client and domain service wrappers
|   |-- auth/               # Roles and access helpers
|   |-- cart/               # Guest cart behavior
|   |-- hooks/              # Custom React hooks
|   |-- security/           # Token storage and idempotency utilities
|   |-- stores/             # Zustand state stores
|   |-- tenant/             # Tenant resolution and theming
|   |-- types/              # Shared TypeScript types
|   `-- utils/              # Generic utility helpers
|-- public/                 # Static assets
|-- scripts/                # Env validation and regression checks
|-- middleware.ts           # Security headers and tenant injection
|-- next.config.mjs         # Next.js runtime configuration
|-- Dockerfile              # Multi-stage production container image
|-- .env.example            # Environment template
`-- package.json            # Scripts and dependency manifest
```

## Deployment

### Vercel

- Set the production environment variables described above
- Review [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md) before going live
- Keep `NEXT_PUBLIC_ALLOW_TENANT_OVERRIDE=false` and prefer HTTPS API endpoints in production

### Docker

Build and run the container locally:

```bash
docker build -t gocart-web .
docker run --env-file .env.local -p 3000:3000 gocart-web
```

The Docker image now uses `npm ci` for deterministic installs and disables Next telemetry in container builds/runs.

## Production Checks

Run the full release gate before shipping:

```bash
npm run release:check
```

This command validates environment settings, runs linting, performs a full typecheck, executes the custom security and API contract suites, and builds the production bundle.

When validating a fresh local clone, make sure `.env.local` has been created from `.env.example` first; otherwise `npm run validate:env` will fail on missing local values by design.

## Contributing

Contributions are welcome. To keep changes easy to review and safe to release:

1. Create a focused branch from the default branch.
2. Keep changes scoped and update documentation when behavior or setup changes.
3. Add or update tests when modifying business logic, API contracts, or security-sensitive flows.
4. Run `npm run release:check` before opening a pull request.
5. Do not commit secrets, local credentials, or environment-specific `.env.local` values.
6. Include a clear pull request summary, test notes, and screenshots for UI changes when relevant.

## License

This project is licensed under the GNU General Public License v3.0. See [LICENSE](LICENSE) for details.

npm run lint
npm run build