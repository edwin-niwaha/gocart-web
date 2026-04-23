/** @type {import('next').NextConfig} */
const imageRemotePatterns = [
  process.env.NEXT_PUBLIC_IMAGE_HOSTNAMES,
  process.env.NEXT_PUBLIC_API_BASE_URL,
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
    remotePatterns: imageRemotePatterns.map(({ protocol, hostname, port }) => ({
      protocol,
      hostname,
      ...(port ? { port } : {}),
    })),
  },
};

export default nextConfig;
