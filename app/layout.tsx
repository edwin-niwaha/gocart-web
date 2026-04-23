import './globals.css';
import { Providers } from '@/components/ui/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Analytics } from '@/components/analytics/analytics';
import { Toaster } from 'sonner';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.example.com';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'GoCart',
    template: '%s | GoCart',
  },
  description: 'Tenant-aware GoCart storefront and admin dashboard.',
};

export const viewport = {
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
