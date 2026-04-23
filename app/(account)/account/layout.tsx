'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Menu,
  Package,
  ShieldCheck,
  User,
  UserCircle2,
  Wallet,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';

type AccountLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const accountLinks: AccountLink[] = [
  { href: '/account', label: 'Overview', icon: User },
  { href: '/account/profile', label: 'Profile', icon: UserCircle2 },
  { href: '/account/security', label: 'Security', icon: ShieldCheck },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/notifications', label: 'Notifications', icon: Bell },
  { href: '/account/payments', label: 'Payments', icon: Wallet },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrated } = useAuthStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace('/auth/login');
    }
  }, [hydrated, user, router]);

  const displayName = useMemo(() => {
    return user?.username || user?.email || 'My account';
  }, [user]);

  const isActiveLink = (href: string) => {
    if (href === '/account') {
      return pathname === '/account';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  if (!hydrated) {
    return <div className="py-16 text-center text-slate-500">Loading account...</div>;
  }

  if (!user) return null;

  return (
    <div className="py-8">
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
        >
          <Menu size={18} />
          Menu
        </button>

        <span className="truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {displayName}
        </span>
      </div>

      <div
        className={`grid gap-6 ${
          desktopCollapsed
            ? 'lg:grid-cols-[96px_minmax(0,1fr)]'
            : 'lg:grid-cols-[280px_minmax(0,1fr)]'
        }`}
      >
        {mobileOpen && (
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[280px] transform border-r border-slate-200 bg-white p-5 shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:w-auto lg:translate-x-0 lg:rounded-[2rem] lg:border lg:shadow-sm ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          } ${desktopCollapsed ? 'lg:px-3' : ''}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className={`${desktopCollapsed ? 'lg:hidden' : 'block'}`}>
              <p className="text-sm font-bold text-[#127D61]">My account</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900 break-words">
                {displayName}
              </h2>
              <p className="mt-1 break-all text-sm text-slate-500">{user.email}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>

              <button
                type="button"
                onClick={() => setDesktopCollapsed((prev) => !prev)}
                className="hidden rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:inline-flex"
                aria-label={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {desktopCollapsed ? (
                  <ChevronRight size={18} />
                ) : (
                  <ChevronLeft size={18} />
                )}
              </button>
            </div>
          </div>

          {desktopCollapsed && (
            <div className="mt-4 hidden lg:flex lg:justify-center">
              <div className="max-w-full truncate rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                Account
              </div>
            </div>
          )}

          <nav className="mt-5 space-y-2">
            {accountLinks.map((link) => {
              const Icon = link.icon;
              const active = isActiveLink(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleLinkClick}
                  title={desktopCollapsed ? link.label : undefined}
                  className={`group flex items-center rounded-2xl px-4 py-3 font-semibold transition ${
                    desktopCollapsed
                      ? 'lg:justify-center lg:px-3'
                      : 'justify-start'
                  } ${
                    active
                      ? 'bg-[#127D61] text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span
                    className={`ml-3 ${
                      desktopCollapsed ? 'lg:hidden' : 'inline'
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
