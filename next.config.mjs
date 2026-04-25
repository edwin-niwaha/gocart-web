/** @type {import('next').NextConfig} */
function normalizeApiBaseUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    if (pathname === '/api/v1') {
      url.pathname = '';
    }

    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return raw.replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '');
  }
}

const imageRemotePatterns = [
  process.env.NEXT_PUBLIC_IMAGE_HOSTNAMES,
  normalizeApiBaseUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL
  ),
]
  .filter(Boolean)
  .flatMap((value) => String(value).split(','))
  .map((value) => value.trim())
  .filter(Boolean)
  .map((value) => {
    try {
      const url = new URL(value);
      return {
        protocol: url.protocol.replace(':', ''),
        hostname: url.hostname,
        port: url.port,
      };
    } catch {
      return {
        protocol: 'https',
        hostname: value,
      };
    }
  })
  .filter((value, index, values) => {
    if (!value.hostname) return false;

    const key = `${value.protocol}:${value.hostname}:${value.port ?? ''}`;
    return (
      values.findIndex(
        (entry) =>
          `${entry.protocol}:${entry.hostname}:${entry.port ?? ''}` === key
      ) === index
    );
  });

const nextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  images: {
    // The app currently uses standard img tags, so disabling the optimizer
    // reduces attack surface on self-hosted deployments.
    unoptimized: true,
    remotePatterns: imageRemotePatterns.map(({ protocol, hostname, port }) => ({
      protocol,
      hostname,
      ...(port ? { port } : {}),
    })),
  },
};

export default nextConfig;
