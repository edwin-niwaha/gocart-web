'use client';

import Link from 'next/link';
import { useEffect, useMemo, useCallback, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Headphones,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Package,
  Receipt,
  Search,
  ShoppingCart,
  Store,
  User,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { canUseStorefrontShopping, getActiveMembership } from '@/lib/auth/roles';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useTenant } from '@/app/providers/TenantProvider';
import { getBrandPalette } from '@/lib/tenant/theme';
import { cartApi, orderApi } from '@/lib/api/services';
import { CART_UPDATED_EVENT } from '@/lib/cart-events';

type NavLinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  authOnly?: boolean;
  shopperOnly?: boolean;
};

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="absolute -right-2 -top-2 min-w-[20px] rounded-full bg-amber-400 px-1.5 text-center text-[11px] font-extrabold text-black">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function IconAction({
  href,
  icon: Icon,
  label,
  count,
  onClick,
}: {
  href?: string;
  icon: LucideIcon;
  label: string;
  count?: number;
  onClick?: () => void;
}) {
  const content = (
    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/15">
      <Icon size={19} />
      {typeof count === 'number' ? <CountBadge count={count} /> : null}
      <span className="sr-only">{label}</span>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return (
    <button type="button" onClick={onClick} aria-label={label}>
      {content}
    </button>
  );
}

function DesktopNavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-white text-slate-900'
          : 'text-white/85 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
        active
          ? 'bg-white text-slate-900'
          : 'text-white/90 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  );
}

function formatRoleLabel(value: string | null | undefined) {
  if (!value) return null;

  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatTenantLabel(value: string | null | undefined) {
  if (!value) return null;

  return value
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, hydrated, logout, canAccessDashboard, currentRole } =
    useAuthStore();
  const tenant = useTenant();
  const palette = getBrandPalette(tenant?.branding);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(false);

  const appName = tenant?.branding?.app_name || 'GoCart';
  const slogan = 'Shop - Sell - Deliver';
  const dashboardAllowed = canAccessDashboard();
  const isAuthenticated = Boolean(user);
  const canShop = canUseStorefrontShopping(user);
  const activeMembership = getActiveMembership(user);
  const signedInRoleLabel = formatRoleLabel(currentRole() || user?.user_type);
  const signedInTenantLabel = formatTenantLabel(
    activeMembership?.tenant_name || activeMembership?.tenant_slug
  );

  const navLinks = useMemo<NavLinkItem[]>(
    () => [
      { href: '/', label: 'Home', icon: Store },
      { href: '/products', label: 'Shop', icon: Package },
      { href: '/cart', label: 'Cart', icon: ShoppingCart, shopperOnly: true },
      {
        href: '/support',
        label: 'Support',
        icon: Headphones,
        shopperOnly: true,
      },
      {
        href: '/account',
        label: 'Account',
        icon: User,
        authOnly: true,
        shopperOnly: true,
      },
    ],
    []
  );

  const isActive = useCallback(
    (href: string) => pathname === href || pathname.startsWith(`${href}/`),
    [pathname]
  );

  const visibleNavLinks = useMemo(
    () =>
      navLinks.filter((link) => {
        if (link.authOnly && !isAuthenticated) return false;
        if (link.shopperOnly && !canShop) return false;
        return true;
      }),
    [canShop, navLinks, isAuthenticated]
  );

  const loadCounts = useCallback(async () => {
    if (!hydrated) return;

    if (!canShop) {
      setCartCount(0);
      setOrdersCount(0);
      return;
    }

    try {
      setLoadingCounts(true);

      const items = await cartApi.listItems();
      const nextCartCount = items.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );
      setCartCount(nextCartCount);

      if (!user) {
        setOrdersCount(0);
        return;
      }

      const orders = await orderApi.list();
      setOrdersCount(orders.length);
    } catch {
      setCartCount(0);
      setOrdersCount(0);
    } finally {
      setLoadingCounts(false);
    }
  }, [canShop, hydrated, user]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!hydrated) return;
    loadCounts();
  }, [hydrated, loadCounts, pathname]);

  useEffect(() => {
    const handleCartUpdated = () => {
      loadCounts();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated);
      }
    };
  }, [loadCounts]);

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const term = search.trim();

    if (!term) {
      router.push('/products');
      return;
    }

    router.push(`/products?search=${encodeURIComponent(term)}`);
    setMobileOpen(false);
  }

  async function handleLogout() {
    await logout();
    setMobileOpen(false);
    setCartCount(0);
    setOrdersCount(0);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-slate-950 text-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex min-h-[76px] items-center gap-3 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black text-white shadow-sm"
              style={{ backgroundColor: palette.primary }}
            >
              G
            </div>

            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold tracking-tight">
                {appName}
              </p>
              <p className="truncate text-xs text-white/65">{slogan}</p>
            </div>
          </Link>

          <form
            onSubmit={handleSearchSubmit}
            className="hidden flex-1 items-center overflow-hidden rounded-xl border border-slate-200 bg-white md:flex"
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products"
              className="h-11 flex-1 border-0 bg-transparent px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="flex h-11 w-12 items-center justify-center bg-amber-300 text-slate-900 transition hover:bg-amber-400"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
          </form>

          <div className="ml-auto flex items-center gap-2">
            {canShop ? (
              <IconAction
                href="/cart"
                icon={ShoppingCart}
                label={loadingCounts ? 'Loading cart' : 'Cart'}
                count={cartCount}
              />
            ) : null}

            {isAuthenticated && canShop ? (
              <IconAction
                href="/account/orders"
                icon={Receipt}
                label={loadingCounts ? 'Loading orders' : 'Orders'}
                count={ordersCount}
              />
            ) : null}

            {hydrated ? (
              isAuthenticated ? (
                <>
                  {canShop ? (
                    <Link
                      href="/account"
                      className="hidden rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 lg:inline-flex"
                    >
                      My Account
                    </Link>
                  ) : dashboardAllowed ? (
                    <Link
                      href="/dashboard"
                      className="hidden rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 lg:inline-flex"
                    >
                      Dashboard
                    </Link>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="hidden items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 lg:inline-flex"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="hidden items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition lg:inline-flex"
                  style={{ backgroundColor: palette.primary }}
                >
                  <LogIn size={16} />
                  Sign in
                </Link>
              )
            ) : null}

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/15 lg:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <div className="hidden items-center justify-between gap-3 border-t border-white/10 py-3 lg:flex">
          <nav className="flex items-center gap-2">
            {visibleNavLinks.map((link) => (
              <DesktopNavLink
                key={link.href}
                href={link.href}
                label={link.label}
                icon={link.icon}
                active={isActive(link.href)}
              />
            ))}

            {dashboardAllowed ? (
              <DesktopNavLink
                href="/dashboard"
                label="Dashboard"
                icon={LayoutDashboard}
                active={isActive('/dashboard')}
              />
            ) : null}
          </nav>

          {hydrated ? (
            isAuthenticated ? (
              <div className="text-sm text-white/70">
                Signed in as{' '}
                <span className="font-semibold text-white">
                  {user?.first_name || user?.username || 'User'}
                </span>
                {signedInRoleLabel ? (
                  <span className="text-white/55"> ({signedInRoleLabel})</span>
                ) : null}
                {signedInTenantLabel ? (
                  <span className="text-white/55"> for {signedInTenantLabel}</span>
                ) : null}
              </div>
            ) : (
              <div className="text-sm text-white/70">
                You are browsing as a guest
              </div>
            )
          ) : null}
        </div>

        {mobileOpen ? (
          <div className="border-t border-white/10 py-4 lg:hidden">
            <form
              onSubmit={handleSearchSubmit}
              className="mb-4 flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products"
                className="h-11 flex-1 border-0 bg-transparent px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="flex h-11 w-12 items-center justify-center bg-amber-300 text-slate-900"
                aria-label="Search"
              >
                <Search size={18} />
              </button>
            </form>

            <nav className="flex flex-col gap-2">
              {visibleNavLinks.map((link) => (
                <MobileNavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  active={isActive(link.href)}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}

              {dashboardAllowed ? (
                <MobileNavLink
                  href="/dashboard"
                  label="Dashboard"
                  icon={LayoutDashboard}
                  active={isActive('/dashboard')}
                  onNavigate={() => setMobileOpen(false)}
                />
              ) : null}

              <div className="mt-2 border-t border-white/10 pt-3">
                {hydrated ? (
                  isAuthenticated ? (
                    <div className="flex flex-col gap-2">
                      {canShop ? (
                        <Link
                          href="/account"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                        >
                          <User size={18} />
                          My Account
                        </Link>
                      ) : dashboardAllowed ? (
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                        >
                          <LayoutDashboard size={18} />
                          Dashboard
                        </Link>
                      ) : null}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-white hover:bg-white/10"
                      >
                        <LogOut size={18} />
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
                      style={{ backgroundColor: palette.primary }}
                    >
                      <LogIn size={16} />
                      Sign in
                    </Link>
                  )
                ) : null}
              </div>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
