'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Store,
  User,
  X,
} from 'lucide-react';

import { useAuthStore } from '@/lib/stores/auth-store';

export function Header() {
  const pathname = usePathname();
  const { user, hydrated, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: '/', label: 'Home', icon: Store, show: true },
    { href: '/products', label: 'Shop', icon: Package, show: true },
    { href: '/cart', label: 'Cart', icon: ShoppingCart, show: true },
    { href: '/account/orders', label: 'Orders', icon: Package, show: Boolean(user) },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: user?.user_type === 'ADMIN' },
  ].filter((item) => item.show);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between gap-4 py-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#127D61] to-emerald-500 text-lg font-black text-white shadow-sm">
              G
            </div>

            <div className="min-w-0">
              <p className="truncate text-lg font-black text-slate-900">GoCart</p>
              <p className="truncate text-xs font-medium text-[#F79420]">
                Shop • Sell • Deliver
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition ${active
                      ? 'bg-[#127D61] text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <Icon size={17} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {!hydrated ? null : user ? (
              <>
                <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 md:inline-flex">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[#127D61]">
                    <User size={16} />
                  </span>
                  <div className="max-w-[180px]">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {user.username || user.email}
                    </p>
                    <p className="text-xs text-slate-500">{user.user_type}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => logout()}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <LogOut size={17} />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#127D61] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
              >
                <LogIn size={17} />
                <span>Login</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 p-2 text-slate-700 lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-slate-200 pb-4 pt-4 lg:hidden">
            <nav className="flex flex-col gap-2">
              {links.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${active
                        ? 'bg-[#127D61] text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    <Icon size={18} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              {hydrated && user ? (
                <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {user.username || user.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{user.user_type}</p>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              ) : null}
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}