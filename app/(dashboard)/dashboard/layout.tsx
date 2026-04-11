'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { BadgeHelp, Boxes, Flag, LayoutDashboard, Palette, Package, ShoppingCart, Users } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated, loading, user, canAccessDashboard, hasRole, currentRole } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !loading && !canAccessDashboard()) {
      router.replace('/auth/login');
    }
  }, [hydrated, loading, canAccessDashboard, router]);

  const links = useMemo(() => {
    const base = [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, show: true },
      { href: '/dashboard/products', label: 'Products', icon: Package, show: hasRole('manager') },
      { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart, show: hasRole('staff') },
      { href: '/dashboard/support', label: 'Support', icon: BadgeHelp, show: hasRole('staff') },
      { href: '/dashboard/staff', label: 'Staff', icon: Users, show: hasRole('tenant_admin') },
      { href: '/dashboard/branding', label: 'Branding', icon: Palette, show: hasRole('tenant_admin') },
      { href: '/dashboard/feature-flags', label: 'Feature flags', icon: Flag, show: hasRole('tenant_admin') },
      { href: '/dashboard/categories', label: 'Categories', icon: Boxes, show: hasRole('manager') },
      { href: '/dashboard/coupons', label: 'Coupons', icon: Flag, show: hasRole('manager') },
    ];
    return base.filter((item: any) => item.show);
  }, [hasRole]);

  if (!hydrated || loading) {
    return <div className="py-16 text-center text-slate-500">Loading dashboard…</div>;
  }

  return (
    <div className="py-6">
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <button type="button" onClick={() => setMobileOpen((v) => !v)} className="rounded-2xl border px-4 py-2 text-sm font-semibold">Menu</button>
        <span className="text-sm text-slate-500">Role: {currentRole() || user?.user_type}</span>
      </div>
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className={`${mobileOpen ? 'block' : 'hidden'} rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:block lg:h-fit`}>
          <p className="text-sm font-bold text-[#F79420]">Admin panel</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">Store management</h2>
          <div className="mt-3 text-sm text-slate-500">Signed in as {user?.email}</div>
          <div className="mt-1 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{currentRole() || user?.user_type}</div>
          <nav className="mt-5 space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition ${active ? 'bg-[#127D61] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50'}`}>
                  <Icon size={18} /> {link.label}
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
