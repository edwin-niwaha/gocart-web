'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
  ShoppingCart,
} from 'lucide-react';

import { useTenant } from '@/app/providers/TenantProvider';
import { api } from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api/services';
import {
  canAccessDashboardUser,
  canUseStorefrontShopping,
} from '@/lib/auth/roles';
import { useAuthStore } from '@/lib/stores/auth-store';

type SubscribeState = 'idle' | 'loading' | 'success' | 'error';

export function Footer() {
  const tenant = useTenant();
  const user = useAuthStore((state) => state.user);

  const canShop = canUseStorefrontShopping(user);
  const dashboardAllowed = canAccessDashboardUser(user);

  const appName = tenant?.branding?.app_name || 'GoCart';
  const slogan =
    tenant?.branding?.hero_subtitle ||
    tenant?.branding?.tagline ||
    'Shop • Sell • Deliver';

  const website = tenant?.settings?.website_url;
  const year = new Date().getFullYear();

  const [email, setEmail] = useState('');
  const [subscribeState, setSubscribeState] = useState<SubscribeState>('idle');
  const [message, setMessage] = useState('');

  const socialLinks = useMemo(
    () =>
      [
        website
          ? {
              href: website,
              label: 'Website',
              icon: <Globe size={16} />,
            }
          : null,
      ].filter(Boolean) as Array<{
        href: string;
        label: string;
        icon: React.ReactNode;
      }>,
    [website],
  );

  async function handleSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setSubscribeState('error');
      setMessage('Enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setSubscribeState('error');
      setMessage('Enter a valid email address.');
      return;
    }

    try {
      setSubscribeState('loading');
      setMessage('');

      const response = await api.post('/newsletter/', {
        email: normalizedEmail,
      });

      setSubscribeState('success');
      setMessage(response.data?.detail || 'You are subscribed to updates.');
      setEmail('');
    } catch (error: unknown) {
      setSubscribeState('error');
      setMessage(
        getApiErrorMessage(
          error,
          'Unable to subscribe right now. Please try again.',
        ),
      );
    }
  }

  return (
    <footer className="mt-16 overflow-hidden border-t border-slate-200 bg-slate-950 text-white">
      <div className="relative mx-auto max-w-7xl px-4 py-10">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#127D61]/25 blur-3xl" />
        <div className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-[#F79420]/20 blur-3xl" />

        <div className="relative grid gap-8 md:grid-cols-[1.2fr_.8fr_1fr]">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#127D61] text-lg font-black text-white shadow">
                {appName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xl font-black tracking-tight">
                  {appName}
                </p>
                <p className="text-xs font-semibold text-white/55">{slogan}</p>
              </div>
            </div>

            <p className="max-w-md text-sm leading-6 text-white/65">
              Discover products, shop confidently, and enjoy smooth delivery across Uganda.
            </p>

            <div className="grid gap-3 text-sm text-white/70">
              <a href="tel:+256703163074" className="inline-flex items-center gap-2 hover:text-[#F79420]">
                <Phone size={15} />
                +256 703 163 074
              </a>

              <a href="mailto:hello@gocart.store" className="inline-flex items-center gap-2 hover:text-[#F79420]">
                <Mail size={15} />
                hello@gocart.store
              </a>

              <span className="inline-flex items-center gap-2">
                <MapPin size={15} />
                Kampala, Uganda
              </span>
            </div>

            {socialLinks.length ? (
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:border-[#F79420]/50 hover:text-[#F79420]"
                  >
                    {item.icon}
                    {item.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F79420]">
              Quick links
            </p>

            <div className="mt-4 grid gap-3 text-sm">
              <FooterLink href="/products">All Products</FooterLink>
              <FooterLink href="/categories">Categories</FooterLink>

              {canShop ? (
                <>
                  <FooterLink href="/account/wishlist">Wishlist</FooterLink>
                  <FooterLink href="/account/orders">My Orders</FooterLink>
                  <FooterLink href="/support">Support</FooterLink>
                </>
              ) : dashboardAllowed ? (
                <FooterLink href="/dashboard">Dashboard</FooterLink>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F79420]">
              Subscribe
            </p>

            <h3 className="mt-3 text-xl font-black">Get store updates</h3>

            <p className="mt-2 text-sm leading-6 text-white/65">
              Receive product updates, offers, and store news.
            </p>

            <form onSubmit={handleSubscribe} className="mt-4 space-y-2">
              <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-white">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);

                    if (subscribeState !== 'idle') {
                      setSubscribeState('idle');
                      setMessage('');
                    }
                  }}
                  placeholder="Enter your email"
                  aria-label="Email address"
                  className="w-full bg-transparent px-4 py-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                />

                <button
                  type="submit"
                  disabled={subscribeState === 'loading'}
                  className="inline-flex min-w-[52px] items-center justify-center bg-[#127D61] px-4 text-white transition hover:bg-[#0f6b53] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {subscribeState === 'loading' ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : subscribeState === 'success' ? (
                    <CheckCircle2 size={17} />
                  ) : (
                    <Send size={17} />
                  )}
                </button>
              </div>

              {message ? (
                <p
                  className={`text-xs font-semibold ${
                    subscribeState === 'success'
                      ? 'text-emerald-300'
                      : 'text-red-300'
                  }`}
                >
                  {message}
                </p>
              ) : null}
            </form>

            {canShop ? (
              <Link
                href="/cart"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-[#F79420]"
              >
                <ShoppingCart size={15} />
                View cart
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} <span className="font-bold text-white">{appName}</span>. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-[#F79420]">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#F79420]">
              Terms
            </Link>
            {canShop ? (
              <Link href="/support" className="hover:text-[#F79420]">
                Support
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="font-semibold text-white/70 transition hover:text-[#F79420]">
      {children}
    </Link>
  );
}