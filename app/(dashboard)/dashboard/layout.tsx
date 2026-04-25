'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  BadgeHelp,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Flag,
  LayoutDashboard,
  MapPin,
  Menu,
  Package,
  Palette,
  ShoppingCart,
  Truck,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';

type DashboardLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  show: boolean;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    hydrated,
    loading,
    user,
    canAccessDashboard,
    hasRole,
    currentRole,
  } = useAuthStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  useEffect(() => {
    if (hydrated && !loading && !canAccessDashboard()) {
      router.replace('/auth/login');
    }
  }, [hydrated, loading, canAccessDashboard, router]);

  const roleLabel = currentRole() || user?.user_type || 'User';
  const isSystemAdmin = user?.user_type === 'ADMIN';

  const permissions = useMemo(() => {
    const isSuperAdmin = hasRole('super_admin') || isSystemAdmin;
    const isTenantOwner = hasRole('tenant_owner') || isSystemAdmin;
    const isTenantAdmin = hasRole('tenant_admin') || isSystemAdmin;
    const isManager = hasRole('manager') || isSystemAdmin;
    const isStaff = hasRole('staff') || isSystemAdmin;

    return {
      isSuperAdmin,
      isTenantOwner,
      isTenantAdmin,
      isManager,
      isStaff,

      canManageProducts:
        isSuperAdmin || isTenantOwner || isTenantAdmin || isManager,

      canManageOrders:
        isSuperAdmin ||
        isTenantOwner ||
        isTenantAdmin ||
        isManager ||
        isStaff,

      canManagePayments:
        isSuperAdmin || isTenantOwner || isTenantAdmin || isManager,

      canManageShipping:
        isSuperAdmin || isTenantOwner || isTenantAdmin || isManager,

      canManageSupport:
        isSuperAdmin ||
        isTenantOwner ||
        isTenantAdmin ||
        isManager ||
        isStaff,

      canManageStaff:
        isSuperAdmin || isTenantOwner || isTenantAdmin,

      canManageSettings:
        isSuperAdmin || isTenantOwner || isTenantAdmin,
    };
  }, [hasRole, isSystemAdmin]);

  const links = useMemo<DashboardLink[]>(() => {
    return [
      {
        href: '/dashboard',
        label: 'Overview',
        icon: LayoutDashboard,
        show: true,
      },
      {
        href: '/dashboard/products',
        label: 'Products',
        icon: Package,
        show: permissions.canManageProducts,
      },
      {
        href: '/dashboard/categories',
        label: 'Categories',
        icon: Boxes,
        show: permissions.canManageProducts,
      },
      {
        href: '/dashboard/orders',
        label: 'Orders',
        icon: ShoppingCart,
        show: permissions.canManageOrders,
      },
      {
        href: '/dashboard/payments',
        label: 'Payments',
        icon: CreditCard,
        show: permissions.canManagePayments,
      },
      {
        href: '/dashboard/shipping-methods',
        label: 'Shipping methods',
        icon: Truck,
        show: permissions.canManageShipping,
      },
      {
        href: '/dashboard/delivery-rates',
        label: 'Delivery rates',
        icon: MapPin,
        show: permissions.canManageShipping,
      },
      {
        href: '/dashboard/pickup-stations',
        label: 'Pickup stations',
        icon: MapPin,
        show: permissions.canManageShipping,
      },
      {
        href: '/dashboard/coupons',
        label: 'Coupons',
        icon: Flag,
        show: permissions.canManageProducts,
      },
      {
        href: '/dashboard/support',
        label: 'Support',
        icon: BadgeHelp,
        show: permissions.canManageSupport,
      },
      {
        href: '/dashboard/staff',
        label: 'Staff',
        icon: Users,
        show: permissions.canManageStaff,
      },
      {
        href: '/dashboard/branding',
        label: 'Branding',
        icon: Palette,
        show: permissions.canManageSettings,
      },
      {
        href: '/dashboard/feature-flags',
        label: 'Feature flags',
        icon: Flag,
        show: permissions.canManageSettings,
      },
    ].filter((item) => item.show);
  }, [permissions]);

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleNavigate = () => {
    setMobileOpen(false);
  };

  if (!hydrated || loading) {
    return <div className="py-16 text-center text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="py-6">
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
        >
          <Menu size={18} />
          Menu
        </button>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          Role: {roleLabel}
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
            className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[280px] transform border-r border-slate-200 bg-white p-5 shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:w-auto lg:translate-x-0 lg:rounded-[2rem] lg:border lg:shadow-sm ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          } ${desktopCollapsed ? 'lg:px-3' : ''}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className={`${desktopCollapsed ? 'lg:hidden' : 'block'}`}>
              <p className="text-sm font-bold text-[#F79420]">Admin panel</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                Manage Store
              </h2>
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
            <div className="mt-3 hidden lg:flex lg:justify-center">
              <div className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                {roleLabel}
              </div>
            </div>
          )}

          <nav className="mt-5 space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActiveLink(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleNavigate}
                  title={desktopCollapsed ? link.label : undefined}
                  className={`group flex items-center rounded-2xl px-4 py-3 font-semibold transition ${
                    desktopCollapsed ? 'lg:justify-center lg:px-3' : 'justify-start'
                  } ${
                    active
                      ? 'bg-[#127D61] text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className={`ml-3 ${desktopCollapsed ? 'lg:hidden' : 'inline'}`}>
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

