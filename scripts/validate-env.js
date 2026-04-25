const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const API_PREFIX = '/api/v1';
const ENV_FILES = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.production.local',
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return env;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) return env;

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      env[key] = value;
      return env;
    }, {});
}

const envFromFiles = ENV_FILES.reduce(
  (merged, fileName) => ({
    ...merged,
    ...parseEnvFile(path.join(ROOT, fileName)),
  }),
  {}
);

const env = {
  ...envFromFiles,
  ...process.env,
};

const appEnv = env.NEXT_PUBLIC_APP_ENV || env.NODE_ENV || 'production';
const isProduction = appEnv === 'production';
const allowInsecureApi = env.NEXT_PUBLIC_ALLOW_INSECURE_API === 'true';
const allowTenantOverride = env.NEXT_PUBLIC_ALLOW_TENANT_OVERRIDE === 'true';
const errors = [];
const warnings = [];
const TENANT_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function valueFor(key) {
  return String(env[key] || '').trim();
}

function requireValue(key) {
  if (!valueFor(key)) {
    errors.push(`${key} is required.`);
  }
}

function isPlaceholder(value) {
  return /example\.com|your-|localhost|127\.0\.0\.1/i.test(value);
}

function validateTenantSlug(key) {
  const value = valueFor(key);
  if (value && !TENANT_SLUG_PATTERN.test(value)) {
    errors.push(
      `${key} must be a lowercase slug using letters, numbers, and hyphens.`
    );
  }
}

function validateHostnameValue(key) {
  const value = valueFor(key);
  if (!value) return;

  if (/^https?:\/\//i.test(value)) {
    errors.push(`${key} must be a hostname, not a URL.`);
  }
}

function parseTenantDomainMap(value) {
  const raw = String(value || '').trim();
  if (!raw) return [];

  if (raw.startsWith('{')) {
    try {
      return Object.entries(JSON.parse(raw));
    } catch {
      errors.push('NEXT_PUBLIC_TENANT_DOMAIN_MAP must be valid JSON or comma-separated hostname=slug pairs.');
      return [];
    }
  }

  return raw.split(',').map((entry) => {
    const trimmed = entry.trim();
    const separatorIndex = trimmed.includes('=')
      ? trimmed.indexOf('=')
      : trimmed.lastIndexOf(':');

    if (separatorIndex <= 0) return [trimmed, ''];
    return [
      trimmed.slice(0, separatorIndex).trim(),
      trimmed.slice(separatorIndex + 1).trim(),
    ];
  });
}

function validateTenantDomainMap() {
  for (const [hostname, slug] of parseTenantDomainMap(
    valueFor('NEXT_PUBLIC_TENANT_DOMAIN_MAP')
  )) {
    if (!hostname || !slug) {
      errors.push(
        'NEXT_PUBLIC_TENANT_DOMAIN_MAP entries must be hostname=slug pairs.'
      );
      continue;
    }

    if (/^https?:\/\//i.test(hostname)) {
      errors.push(
        'NEXT_PUBLIC_TENANT_DOMAIN_MAP hostnames must not include protocol.'
      );
    }

    if (!TENANT_SLUG_PATTERN.test(String(slug))) {
      errors.push(
        `NEXT_PUBLIC_TENANT_DOMAIN_MAP has an invalid tenant slug: ${slug}`
      );
    }
  }
}

function validateUrl(key, { requireHttps = true } = {}) {
  const value = valueFor(key);
  if (!value) return;

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    errors.push(`${key} must be a valid absolute URL.`);
    return;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    errors.push(`${key} must use http or https.`);
  }

  if (isProduction && requireHttps && parsed.protocol !== 'https:') {
    errors.push(`${key} must use HTTPS for production.`);
  }

  if (isProduction && isPlaceholder(value)) {
    warnings.push(`${key} still looks like a placeholder or local URL.`);
  }
}

function normalizeApiBaseUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';

    if (pathname === API_PREFIX) {
      warnings.push(
        'NEXT_PUBLIC_API_BASE_URL should be the backend origin only. The app will strip /api/v1 automatically.'
      );
      parsed.pathname = '';
    }

    parsed.search = '';
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return raw.replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '');
  }
}

requireValue('NEXT_PUBLIC_API_BASE_URL');
requireValue('NEXT_PUBLIC_SITE_URL');

const hasTenantResolver =
  valueFor('NEXT_PUBLIC_TENANT_SLUG') ||
  valueFor('NEXT_PUBLIC_TENANT_ROOT_DOMAIN') ||
  valueFor('NEXT_PUBLIC_TENANT_DOMAIN_MAP');

if (!hasTenantResolver) {
  errors.push(
    'Configure tenant resolution with NEXT_PUBLIC_TENANT_SLUG, NEXT_PUBLIC_TENANT_ROOT_DOMAIN, or NEXT_PUBLIC_TENANT_DOMAIN_MAP.'
  );
}

validateUrl('NEXT_PUBLIC_API_BASE_URL', {
  requireHttps: !allowInsecureApi,
});
validateUrl('NEXT_PUBLIC_SITE_URL');
validateTenantSlug('NEXT_PUBLIC_TENANT_SLUG');
validateHostnameValue('NEXT_PUBLIC_TENANT_ROOT_DOMAIN');
validateTenantDomainMap();
normalizeApiBaseUrl(valueFor('NEXT_PUBLIC_API_BASE_URL'));

const timeout = Number(valueFor('NEXT_PUBLIC_API_TIMEOUT_MS') || 15000);
if (!Number.isFinite(timeout) || timeout < 1000 || timeout > 60000) {
  errors.push('NEXT_PUBLIC_API_TIMEOUT_MS must be between 1000 and 60000.');
}

if (isProduction && allowInsecureApi) {
  warnings.push(
    'NEXT_PUBLIC_ALLOW_INSECURE_API=true is enabled. Disable it before production.'
  );
}

if (isProduction && allowTenantOverride) {
  warnings.push(
    'NEXT_PUBLIC_ALLOW_TENANT_OVERRIDE=true allows browser tenant overrides. Disable it before production.'
  );
}

if (isProduction && !valueFor('NEXT_PUBLIC_IMAGE_HOSTNAMES')) {
  warnings.push(
    'NEXT_PUBLIC_IMAGE_HOSTNAMES is empty. Remote product images may be blocked.'
  );
}

if (
  valueFor('NEXT_PUBLIC_GOOGLE_CLIENT_ID') &&
  isPlaceholder(valueFor('NEXT_PUBLIC_GOOGLE_CLIENT_ID'))
) {
  warnings.push(
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID still looks like a placeholder.'
  );
}

if (isProduction && !valueFor('NEXT_PUBLIC_GOOGLE_CLIENT_ID')) {
  warnings.push(
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID is empty. Google sign-in should stay disabled or be configured.'
  );
}

if (errors.length) {
  console.error('Environment validation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

if (warnings.length) {
  console.warn('Environment validation warnings:');
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

console.log('Environment validation passed.');
