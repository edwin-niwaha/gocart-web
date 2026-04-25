import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/ui/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Analytics } from '@/components/analytics/analytics';
import { getAppName, getSiteUrl } from '@/lib/env';
import { Toaster } from 'sonner';

const appName = getAppName();
const siteUrl = getSiteUrl();
const siteDescription =
  'Tenant-aware GoCart storefront, checkout, shopper accounts, and admin dashboard.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: appName,
  title: {
    default: appName,
    template: `%s | ${appName}`,
  },
  description: siteDescription,
  alternates: {
    canonical: '/',
  },
  keywords: [
    'GoCart',
    'ecommerce',
    'storefront',
    'shopping cart',
    'tenant-aware commerce',
  ],
  referrer: 'strict-origin-when-cross-origin',
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: appName,
    title: appName,
    description: siteDescription,
    images: [
      {
        url: '/images/cart.png',
        width: 512,
        height: 512,
        alt: `${appName} cart`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: appName,
    description: siteDescription,
    images: ['/images/cart.png'],
  },
  icons: {
    icon: '/images/cart.png',
    apple: '/images/cart.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#127D61',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Analytics />
          <Header />
          <main className="container-page min-h-screen">{children}</main>
          <Footer />

          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={3000}
          />
        </Providers>
      </body>
    </html>
  );
}
