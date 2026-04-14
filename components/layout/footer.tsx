'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTenant } from '@/app/providers/TenantProvider';
import { api } from '@/lib/api/client';
import {
  Globe,
  Mail,
  MapPin,
  Phone,
  ShoppingCart,
  Send,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

type SubscribeState = 'idle' | 'loading' | 'success' | 'error';

export function Footer() {
  const tenant = useTenant();

  const appName = tenant?.branding?.app_name || 'GoCart';
  const slogan = tenant?.branding?.hero_subtitle || 'Shop • Sell • Deliver';
  const website = tenant?.settings?.website_url;

  const [email, setEmail] = useState('');
  const [subscribeState, setSubscribeState] = useState<SubscribeState>('idle');
  const [message, setMessage] = useState('');

  const socialLinks = useMemo(
    () =>
      [
        website
          ? { href: website, label: 'Website', icon: <Globe size={16} /> }
          : null,
      ].filter(Boolean) as Array<{
        href: string;
        label: string;
        icon: React.ReactNode;
      }>,
    [website]
  );

  const handleSubscribe = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setSubscribeState('error');
      setMessage('Enter your email address.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
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
    } catch (error: any) {
      console.error('Newsletter error:', error?.response?.data);

      setSubscribeState('error');
      setMessage(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          'Unable to subscribe right now. Please try again.'
      );
    }
  };

  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-[1.2fr_.8fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#127D61] text-base font-black text-white">
              {appName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-lg font-black text-slate-900">
                {appName}
              </p>
              <p className="text-xs text-slate-500">{slogan}</p>
            </div>
          </div>

          <p className="max-w-md text-sm leading-6 text-slate-600">
            Discover products easily, shop confidently, and enjoy smooth delivery.
          </p>

          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <a
              href="tel:+256703163074"
              className="inline-flex items-center gap-2 hover:text-[#127D61]"
            >
              <Phone size={15} />
              +256 703 163 074
            </a>

            <a
              href="mailto:hello@gocart.store"
              className="inline-flex items-center gap-2 hover:text-[#127D61]"
            >
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
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-[#127D61] hover:text-[#127D61]"
                >
                  {item.icon}
                  {item.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid gap-2 text-sm">
          <p className="text-xs font-black uppercase tracking-wide text-slate-900">
            Quick links
          </p>

          <FooterLink href="/products">All Products</FooterLink>
          <FooterLink href="/categories">Categories</FooterLink>
          <FooterLink href="/wishlist">Wishlist</FooterLink>
          <FooterLink href="/account/orders">My Orders</FooterLink>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-wide text-slate-900">
            Subscribe to updates
          </p>

          <p className="text-sm text-slate-600">
            Get product updates and store news.
          </p>

          <form onSubmit={handleSubscribe} className="space-y-2">
            <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
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
                className="w-full bg-transparent px-3 py-2.5 text-sm outline-none"
              />
              <button
                type="submit"
                disabled={subscribeState === 'loading'}
                className="inline-flex min-w-[46px] items-center justify-center bg-[#127D61] px-3 text-white transition hover:bg-[#0f6b53] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {subscribeState === 'loading' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : subscribeState === 'success' ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>

            {message ? (
              <p
                className={`text-xs ${
                  subscribeState === 'success'
                    ? 'text-[#127D61]'
                    : 'text-red-600'
                }`}
              >
                {message}
              </p>
            ) : null}
          </form>

          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-[#127D61]"
          >
            <ShoppingCart size={15} />
            View cart
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()}{' '}
            <span className="font-semibold text-slate-700">{appName}</span>. All
            rights reserved.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-[#127D61]">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#127D61]">
              Terms
            </Link>
            <Link href="/support" className="hover:text-[#127D61]">
              Support
            </Link>
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
    <Link href={href} className="text-slate-600 transition hover:text-[#127D61]">
      {children}
    </Link>
  );
}