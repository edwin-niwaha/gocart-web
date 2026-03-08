'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Boxes,
  LayoutDashboard,
  Menu,
  Package,
  Receipt,
  Settings,
  Tags,
  Users,
  X,
} from 'lucide-react';

import { useAuthStore } from '@/lib/stores/auth-store';

const links = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/categories', label: 'Categories', icon: Tags },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: Receipt },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Boxes },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/coupons', label: 'Coupons', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrated } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) return;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (user.user_type !== 'ADMIN') {
      router.replace('/');
    }
  }, [hydrated, user, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!hydrated) {
    return (
      <div className="py-16 text-center text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  if (!user || user.user_type !== 'ADMIN') return null;

  return (
    <div className="py-4 md:py-6">
      <div className="mb-4 flex items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 shadow-sm lg:hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#F79420]">
            Admin panel
          </p>
          <p className="text-sm font-semibold text-slate-700">{user.email}</p>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="rounded-2xl border border-slate-200 p-2 text-slate-700"
          aria-label="Toggle dashboard menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside
          className={`${mobileOpen ? 'block' : 'hidden'
            } rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:block lg:h-fit`}
        >
          <p className="text-sm font-bold text-[#F79420]">Admin panel</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">
            Store management
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>Signed in as {user.email}</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {user.user_type}
            </span>
          </div>

          <nav className="mt-5 space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const active =
                pathname === link.href ||
                (link.href !== '/dashboard' && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold transition ${active
                      ? 'bg-[#127D61] text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  <Icon size={18} />
                  {link.label}
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