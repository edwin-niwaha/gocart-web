'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  BadgeHelp,
  BadgePercent,
  Bell,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Flag,
  Heart,
  Home,
  LayoutDashboard,
  MapPin,
  Menu,
  Package,
  Palette,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
  Users,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useAuthStore } from '@/lib/stores/auth-store';

type DashboardGroup =
  | 'Main'
  | 'Catalog'
  | 'Sales'
  | 'Fulfillment'
  | 'Customers'
  | 'Marketing'
  | 'Support'
  | 'Administration'
  | 'Advanced';

type DashboardLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  show: boolean;
  group: DashboardGroup;
};

const GROUPS: DashboardGroup[] = [
  'Main',
  'Catalog',
  'Sales',
  'Fulfillment',
  'Customers',
  'Marketing',
  'Support',
  'Administration',
  'Advanced',
];

function formatRole(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const { hydrated, loading, user, canAccessDashboard, hasRole, currentRole } =
    useAuthStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');

  useEffect(() => {
    if (hydrated && !loading && !canAccessDashboard()) {
      router.replace('/auth/login');
    }
  }, [hydrated, loading, canAccessDashboard, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isSystemAdmin = user?.user_type === 'ADMIN';
  const isSuperAdmin = hasRole('super_admin') || isSystemAdmin;
  const roleLabel = formatRole(currentRole() || user?.user_type || 'User');
  const portalLabel = isSuperAdmin ? 'Admin Portal' : 'Store Portal';

  const userName =
    user?.first_name || user?.username || user?.email?.split('@')[0] || 'User';

  const userInitial = userName.charAt(0).toUpperCase();

  const permissions = useMemo(() => {
    const isTenantOwner = hasRole('tenant_owner') || isSystemAdmin;
    const isTenantAdmin = hasRole('tenant_admin') || isSystemAdmin;
    const isManager = hasRole('manager') || isSystemAdmin;
    const isStaff = hasRole('staff') || isSystemAdmin;

    return {
      canManageProducts: isSuperAdmin || isTenantOwner || isTenantAdmin || isManager,
      canManageOrders:
        isSuperAdmin || isTenantOwner || isTenantAdmin || isManager || isStaff,
      canManagePayments: isSuperAdmin || isTenantOwner || isTenantAdmin || isManager,
      canManageShipping: isSuperAdmin || isTenantOwner || isTenantAdmin || isManager,
      canManageSupport:
        isSuperAdmin || isTenantOwner || isTenantAdmin || isManager || isStaff,
      canViewCustomers: isSuperAdmin || isTenantOwner || isTenantAdmin || isManager,
      canManageStaff: isSuperAdmin || isTenantOwner || isTenantAdmin,
      canManageSettings: isSuperAdmin || isTenantOwner || isTenantAdmin,
      canViewAdvanced: isSuperAdmin,
    };
  }, [hasRole, isSystemAdmin, isSuperAdmin]);

  const links = useMemo<DashboardLink[]>(() => {
    const dashboardLinks: DashboardLink[] = [
      {
        href: '/dashboard',
        label: 'Overview',
        icon: LayoutDashboard,
        show: true,
        group: 'Main',
      },

      {
        href: '/dashboard/products',
        label: 'Products',
        icon: Package,
        show: permissions.canManageProducts,
        group: 'Catalog',
      },
      {
        href: '/dashboard/categories',
        label: 'Categories',
        icon: Boxes,
        show: permissions.canManageProducts,
        group: 'Catalog',
      },
      {
        href: '/dashboard/inventory',
        label: 'Inventory',
        icon: Store,
        show: permissions.canManageProducts,
        group: 'Catalog',
      },
      {
        href: '/dashboard/reviews',
        label: 'Reviews',
        icon: Star,
        show: permissions.canManageProducts,
        group: 'Catalog',
      },
      {
        href: '/dashboard/ratings',
        label: 'Ratings',
        icon: Star,
        show: permissions.canManageProducts,
        group: 'Catalog',
      },

      {
        href: '/dashboard/orders',
        label: 'Orders',
        icon: ShoppingCart,
        show: permissions.canManageOrders,
        group: 'Sales',
      },
      {
        href: '/dashboard/payments',
        label: 'Payments',
        icon: CreditCard,
        show: permissions.canManagePayments,
        group: 'Sales',
      },
      {
        href: '/dashboard/coupons',
        label: 'Coupons',
        icon: BadgePercent,
        show: permissions.canManageProducts,
        group: 'Marketing',
      },

      {
        href: '/dashboard/shipping-methods',
        label: 'Shipping Methods',
        icon: Truck,
        show: permissions.canManageShipping,
        group: 'Fulfillment',
      },
      {
        href: '/dashboard/delivery-rates',
        label: 'Delivery Rates',
        icon: MapPin,
        show: permissions.canManageShipping,
        group: 'Fulfillment',
      },
      {
        href: '/dashboard/pickup-stations',
        label: 'Pickup Stations',
        icon: MapPin,
        show: permissions.canManageShipping,
        group: 'Fulfillment',
      },

      {
        href: '/dashboard/users',
        label: 'Customers',
        icon: Users,
        show: permissions.canViewCustomers,
        group: 'Customers',
      },
      {
        href: '/dashboard/addresses',
        label: 'Addresses',
        icon: MapPin,
        show: permissions.canManageShipping,
        group: 'Customers',
      },
      {
        href: '/dashboard/wishlists',
        label: 'Wishlists',
        icon: Heart,
        show: permissions.canViewCustomers,
        group: 'Customers',
      },

      {
        href: '/dashboard/support',
        label: 'Support Tickets',
        icon: BadgeHelp,
        show: permissions.canManageSupport,
        group: 'Support',
      },
      {
        href: '/dashboard/notifications',
        label: 'Notifications',
        icon: Bell,
        show: permissions.canManageSupport,
        group: 'Support',
      },

      {
        href: '/dashboard/staff',
        label: 'Staff',
        icon: Users,
        show: permissions.canManageStaff,
        group: 'Administration',
      },
      {
        href: '/dashboard/branding',
        label: 'Branding',
        icon: Palette,
        show: permissions.canManageSettings,
        group: 'Administration',
      },
      {
        href: '/dashboard/feature-flags',
        label: 'Feature Flags',
        icon: Flag,
        show: permissions.canManageSettings,
        group: 'Administration',
      },

      {
        href: '/dashboard/inventory-movements',
        label: 'Inventory Log',
        icon: ClipboardList,
        show: permissions.canViewAdvanced,
        group: 'Advanced',
      },
      {
        href: '/dashboard/order-items',
        label: 'Order Items',
        icon: ClipboardList,
        show: permissions.canViewAdvanced,
        group: 'Advanced',
      },
      {
        href: '/dashboard/carts',
        label: 'Carts',
        icon: ShoppingCart,
        show: permissions.canViewAdvanced,
        group: 'Advanced',
      },
      {
        href: '/dashboard/cart-items',
        label: 'Cart Items',
        icon: ClipboardList,
        show: permissions.canViewAdvanced,
        group: 'Advanced',
      },
      {
        href: '/dashboard/wishlist-items',
        label: 'Wishlist Items',
        icon: Heart,
        show: permissions.canViewAdvanced,
        group: 'Advanced',
      },
    ];

    return dashboardLinks.filter((item) => item.show);
  }, [permissions]);

  const filteredLinks = useMemo(() => {
    const query = menuSearch.trim().toLowerCase();

    if (!query) return links;

    return links.filter(
      (link) =>
        link.label.toLowerCase().includes(query) ||
        link.group.toLowerCase().includes(query),
    );
  }, [links, menuSearch]);

  function isActiveLink(href: string) {
    return href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  if (!hydrated || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm font-bold text-slate-600 shadow-sm">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="py-5">
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm"
        >
          <Menu size={18} />
          Menu
        </button>

        <span className="rounded-full bg-[#127D61]/10 px-3 py-1.5 text-xs font-black text-[#127D61]">
          {portalLabel}
        </span>
      </div>

      <div
        className={`grid gap-6 transition-all ${
          desktopCollapsed
            ? 'lg:grid-cols-[88px_minmax(0,1fr)]'
            : 'lg:grid-cols-[300px_minmax(0,1fr)]'
        }`}
      >
        {mobileOpen ? (
          <button
            type="button"
            aria-label="Close sidebar overlay"
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[305px] transform flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 lg:sticky lg:top-24 lg:z-auto lg:h-[calc(100vh-7rem)] lg:w-auto lg:translate-x-0 lg:rounded-[2rem] lg:border lg:shadow-sm ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="border-b border-slate-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div
                className={`min-w-0 ${
                  desktopCollapsed ? 'lg:hidden' : 'block'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#127D61] text-sm font-black text-white">
                    {isSuperAdmin ? <ShieldCheck size={18} /> : userInitial}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">
                      {portalLabel}
                    </p>
                    <p className="truncate text-xs font-bold text-slate-500">
                      {roleLabel}
                    </p>
                  </div>
                </div>
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
                  aria-label={
                    desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
                  }
                >
                  {desktopCollapsed ? (
                    <ChevronRight size={18} />
                  ) : (
                    <ChevronLeft size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4 lg:hidden">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3">
                <Search size={16} className="text-slate-400" />
                <input
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Search menu..."
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              title="Back to Store"
              className={`mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-emerald-50 hover:text-[#127D61] ${
                desktopCollapsed ? 'lg:justify-center lg:px-3' : ''
              }`}
            >
              <Home size={18} className="shrink-0" />
              <span className={desktopCollapsed ? 'lg:hidden' : ''}>
                Back to Store
              </span>
            </Link>

            <nav className="space-y-5">
              {GROUPS.map((group) => {
                const groupLinks = filteredLinks.filter(
                  (link) => link.group === group,
                );

                if (!groupLinks.length) return null;

                return (
                  <div key={group}>
                    <p
                      className={`mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 ${
                        desktopCollapsed ? 'lg:hidden' : ''
                      }`}
                    >
                      {group}
                    </p>

                    <div className="space-y-1">
                      {groupLinks.map((link) => {
                        const Icon = link.icon;
                        const active = isActiveLink(link.href);

                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            title={desktopCollapsed ? link.label : undefined}
                            className={`group flex items-center rounded-2xl px-4 py-2.5 text-sm font-black transition ${
                              desktopCollapsed
                                ? 'lg:justify-center lg:px-3'
                                : 'justify-start'
                            } ${
                              active
                                ? 'bg-[#127D61] text-white shadow-sm'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-[#127D61]'
                            }`}
                          >
                            <Icon size={18} className="shrink-0" />
                            <span
                              className={`ml-3 truncate ${
                                desktopCollapsed ? 'lg:hidden' : ''
                              }`}
                            >
                              {link.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-slate-100 p-4">
            <Link
              href="/account"
              onClick={() => setMobileOpen(false)}
              title="Profile"
              className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 hover:text-[#127D61] ${
                desktopCollapsed ? 'lg:justify-center lg:px-3' : ''
              }`}
            >
              <Users size={18} className="shrink-0" />
              <span className={desktopCollapsed ? 'lg:hidden' : ''}>
                Profile
              </span>
            </Link>

            {permissions.canManageSettings ? (
              <Link
                href="/dashboard/branding"
                onClick={() => setMobileOpen(false)}
                title="Settings"
                className={`mt-1 flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 hover:text-[#127D61] ${
                  desktopCollapsed ? 'lg:justify-center lg:px-3' : ''
                }`}
              >
                <Settings size={18} className="shrink-0" />
                <span className={desktopCollapsed ? 'lg:hidden' : ''}>
                  Settings
                </span>
              </Link>
            ) : null}
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
