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
import { useTenant } from '@/app/providers/TenantProvider';
import { getBrandPalette } from '@/lib/tenant/theme';

export function Header() {
  const pathname = usePathname();
  const { user, hydrated, logout, canAccessDashboard, currentRole } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const tenant = useTenant();
  const palette = getBrandPalette(tenant?.branding);
  const appName = tenant?.branding?.app_name || 'GoCart';
  const strap = tenant?.branding?.hero_subtitle || 'Shop • Sell • Deliver';

  const dashboardAllowed = canAccessDashboard();
  const role = currentRole();

  const links = [
    { href: '/', label: 'Home', icon: Store, show: true },
    { href: '/products', label: 'Shop', icon: Package, show: true },
    { href: '/cart', label: 'Cart', icon: ShoppingCart, show: true },
    { href: '/support', label: 'Support', icon: Package, show: true },
    { href: '/account/orders', label: 'Orders', icon: Package, show: Boolean(user) },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: dashboardAllowed },
  ].filter((item) => item.show);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
<header className="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between gap-4 py-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm text-lg font-black text-white shadow-sm">G</div>
            <div className="min-w-0">
              <p className="truncate text-lg font-black text-slate-900">{appName}</p>
              <p className="truncate text-xs font-medium text-[#F79420]" style={{color:palette.accent}}>{strap}</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link key={link.href} href={link.href} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition ${active ? 'text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}>
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
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[#127D61]"><User size={16} /></span>
                  <div className="max-w-[180px]">
                    <p className="truncate text-sm font-semibold text-slate-800">{user.username || user.email}</p>
                    <p className="text-xs text-slate-500">{role || user.user_type}</p>
                  </div>
                </div>
                <button type="button" onClick={() => logout()} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                  <LogOut size={17} />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link href="/auth/login" className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90" style={{backgroundColor:palette.primary}}>
                <LogIn size={17} />
                <span>Login</span>
              </Link>
            )}

            <button type="button" onClick={() => setMobileOpen((prev) => !prev)} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 p-2 text-slate-700 lg:hidden" aria-label="Toggle menu">
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
                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={`inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${active ? 'text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}>
                    <Icon size={18} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
