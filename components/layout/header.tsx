'use client';

import Link from 'next/link';
import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
  Headphones,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Package,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
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
    <span className="absolute -right-1.5 -top-1.5 min-w-[18px] rounded-full bg-[#F79420] px-1 py-0.5 text-center text-[10px] font-black leading-none text-white shadow">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function IconAction({
  href,
  icon: Icon,
  label,
  count,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
    >
      <Icon size={17} />
      {typeof count === 'number' ? <CountBadge count={count} /> : null}
    </Link>
  );
}

function Avatar({
  avatarUrl,
  userInitial,
  userName,
  compact = false,
}: {
  avatarUrl?: string | null;
  userInitial: string;
  userName: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-slate-950 ring-1 ring-white/20 ${
        compact ? 'h-8 w-8' : 'h-10 w-10'
      }`}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={userName} className="h-full w-full object-cover" />
      ) : (
        <span className={compact ? 'text-xs font-black' : 'text-sm font-black'}>
          {userInitial}
        </span>
      )}
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  mobile = false,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-2 rounded-xl font-bold transition ${
        mobile ? 'px-3 py-2.5 text-sm' : 'px-3 py-2 text-xs'
      } ${
        active
          ? 'bg-white text-slate-950 shadow-sm'
          : 'text-white/80 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon size={mobile ? 18 : 15} />
      {label}
    </Link>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
    >
      <Icon size={17} />
      {label}
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
  const [accountOpen, setAccountOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const appName = tenant?.branding?.app_name || 'GoCart';
  const slogan = tenant?.branding?.tagline || 'Shop • Sell • Deliver';

  const isAuthenticated = Boolean(user);
  const dashboardAllowed = canAccessDashboard();
  const canShop = canUseStorefrontShopping(user);

  const activeMembership = getActiveMembership(user);
  const roleLabel = formatRoleLabel(currentRole() || user?.user_type);
  const tenantLabel = formatTenantLabel(
    activeMembership?.tenant_name ||
      activeMembership?.tenant_slug ||
      tenant?.settings?.store_name
  );

  const userName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
    user?.username ||
    user?.email?.split('@')[0] ||
    'User';

  const userInitial = userName.charAt(0).toUpperCase();
  const avatarUrl = user?.avatar_url || user?.profile_picture_url;

  const navLinks = useMemo<NavLinkItem[]>(
    () => [
      { href: '/', label: 'Home', icon: Store },
      { href: '/products', label: 'Shop', icon: Package },
      { href: '/cart', label: 'Cart', icon: ShoppingCart, shopperOnly: true },
      { href: '/support', label: 'Support', icon: Headphones, shopperOnly: true },
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
    [navLinks, isAuthenticated, canShop]
  );

  const desktopNavLinks = useMemo(
    () =>
      visibleNavLinks.filter((link) =>
        ['/', '/products', '/support'].includes(link.href)
      ),
    [visibleNavLinks]
  );

  const loadCounts = useCallback(async () => {
    if (!hydrated || !canShop) {
      setCartCount(0);
      setOrdersCount(0);
      return;
    }

    try {
      const items = await cartApi.listItems();
      setCartCount(
        items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
      );

      if (!user) {
        setOrdersCount(0);
        return;
      }

      const orders = await orderApi.list();
      setOrdersCount(Array.isArray(orders) ? orders.length : 0);
    } catch {
      setCartCount(0);
      setOrdersCount(0);
    }
  }, [hydrated, canShop, user]);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!accountOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setAccountOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountOpen]);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts, pathname]);

  useEffect(() => {
    window.addEventListener(CART_UPDATED_EVENT, loadCounts);
    return () => window.removeEventListener(CART_UPDATED_EVENT, loadCounts);
  }, [loadCounts]);

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const term = search.trim();
    router.push(term ? `/products?search=${encodeURIComponent(term)}` : '/products');
    setMobileOpen(false);
  }

  async function handleLogout() {
    setAccountOpen(false);
    await logout();
    setMobileOpen(false);
    setCartCount(0);
    setOrdersCount(0);
    router.push('/');
  }

  const closeMenus = useCallback(() => {
    setAccountOpen(false);
    setMobileOpen(false);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 text-white shadow-lg shadow-slate-950/10 backdrop-blur">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
        <div className="flex min-h-[64px] items-center gap-3 py-2">
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-black text-white shadow"
              style={{ backgroundColor: palette.primary }}
            >
              {appName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="max-w-[116px] truncate text-base font-black tracking-tight sm:max-w-[150px] lg:max-w-[180px]">
                {appName}
              </p>
              <p className="hidden max-w-[180px] truncate text-[11px] font-semibold leading-3 text-white/55 sm:block">
                {slogan}
              </p>
            </div>
          </Link>

          <nav className="ml-2 hidden shrink-0 items-center gap-1 xl:flex">
            {desktopNavLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                icon={link.icon}
                active={isActive(link.href)}
              />
            ))}

            {dashboardAllowed ? (
              <NavLink
                href="/dashboard"
                label="Dashboard"
                icon={LayoutDashboard}
                active={isActive('/dashboard')}
              />
            ) : null}
          </nav>

          <form
            onSubmit={handleSearchSubmit}
            className="ml-auto hidden h-10 w-52 shrink-0 items-center overflow-hidden rounded-xl border border-white/10 bg-white shadow-sm md:flex lg:w-64 2xl:w-80"
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
            />

            <button
              type="submit"
              className="flex h-10 w-11 shrink-0 items-center justify-center text-white transition hover:opacity-90"
              style={{ backgroundColor: palette.primary }}
              aria-label="Search"
            >
              <Search size={16} />
            </button>
          </form>

          <div className="flex min-w-0 items-center gap-1.5">
            {canShop ? (
              <IconAction
                href="/cart"
                icon={ShoppingCart}
                label="Cart"
                count={cartCount}
              />
            ) : null}

            {isAuthenticated && canShop ? (
              <IconAction
                href="/account/orders"
                icon={Receipt}
                label="Orders"
                count={ordersCount}
              />
            ) : null}

            {hydrated ? (
              <div ref={accountMenuRef} className="relative hidden lg:block">
                <button
                  type="button"
                  onClick={() => setAccountOpen((prev) => !prev)}
                  className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-2.5 text-sm font-bold text-white transition hover:bg-white/20"
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                >
                  {isAuthenticated ? (
                    <>
                      <Avatar
                        avatarUrl={avatarUrl}
                        userInitial={userInitial}
                        userName={userName}
                        compact
                      />
                      <span className="hidden max-w-[118px] truncate xl:block">
                        {userName}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-950">
                        <User size={16} />
                      </span>
                      <span className="hidden xl:block">Account</span>
                    </>
                  )}
                  <ChevronDown
                    size={16}
                    className={`shrink-0 transition ${accountOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {accountOpen ? (
                  <div
                    className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-2xl shadow-slate-950/20"
                    role="menu"
                  >
                    {isAuthenticated ? (
                      <div className="border-b border-slate-100 p-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            avatarUrl={avatarUrl}
                            userInitial={userInitial}
                            userName={userName}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black">{userName}</p>
                            <p className="truncate text-xs font-semibold text-slate-500">
                              {roleLabel || 'Customer'}
                            </p>
                            {tenantLabel ? (
                              <p className="truncate text-xs font-semibold text-slate-400">
                                {tenantLabel}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border-b border-slate-100 p-4">
                        <p className="text-sm font-black">Welcome to {appName}</p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500">
                          Sign in to manage your profile and orders.
                        </p>
                      </div>
                    )}

                    <div className="p-2">
                      {isAuthenticated ? (
                        <>
                          <MenuLink
                            href={canShop ? '/account/profile' : '/dashboard'}
                            icon={Settings}
                            label="Profile / Account"
                            onClick={closeMenus}
                          />

                          {dashboardAllowed ? (
                            <MenuLink
                              href="/dashboard"
                              icon={ShieldCheck}
                              label="Dashboard"
                              onClick={closeMenus}
                            />
                          ) : null}

                          {canShop ? (
                            <MenuLink
                              href="/account/orders"
                              icon={Receipt}
                              label="Orders"
                              onClick={closeMenus}
                            />
                          ) : null}

                          <button
                            type="button"
                            onClick={handleLogout}
                            className="mt-1 flex w-full items-center gap-3 rounded-lg border-t border-slate-100 px-3 py-2.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
                          >
                            <LogOut size={17} />
                            Sign out
                          </button>
                        </>
                      ) : (
                        <Link
                          href="/auth/login"
                          onClick={closeMenus}
                          className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-black text-white transition hover:opacity-90"
                          style={{ backgroundColor: palette.primary }}
                        >
                          <LogIn size={17} />
                          Sign in
                        </Link>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 xl:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-white/10 py-3 xl:hidden">
            <form
              onSubmit={handleSearchSubmit}
              className="mb-3 flex h-10 items-center overflow-hidden rounded-xl bg-white md:hidden"
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              />

              <button
                type="submit"
                className="flex h-10 w-11 shrink-0 items-center justify-center text-white"
                style={{ backgroundColor: palette.primary }}
              >
                <Search size={16} />
              </button>
            </form>

            {isAuthenticated ? (
              <div className="mb-3 rounded-xl border border-white/10 bg-white/10 p-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    avatarUrl={avatarUrl}
                    userInitial={userInitial}
                    userName={userName}
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">
                      {userName}
                    </p>
                    <p className="truncate text-xs font-semibold text-white/55">
                      {[roleLabel, tenantLabel].filter(Boolean).join(' • ') ||
                        user?.email}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <nav className="grid gap-1.5 sm:grid-cols-2">
              {visibleNavLinks.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  active={isActive(link.href)}
                  mobile
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}

              {dashboardAllowed ? (
                <NavLink
                  href="/dashboard"
                  label="Dashboard"
                  icon={LayoutDashboard}
                  active={isActive('/dashboard')}
                  mobile
                  onNavigate={() => setMobileOpen(false)}
                />
              ) : null}

              <div className="border-t border-white/10 pt-3 sm:col-span-2">
                {hydrated && isAuthenticated ? (
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    <NavLink
                      href={canShop ? '/account/profile' : '/dashboard'}
                      label="Profile / Account"
                      icon={Settings}
                      active={canShop ? isActive('/account/profile') : isActive('/dashboard')}
                      mobile
                      onNavigate={closeMenus}
                    />

                    {canShop ? (
                      <NavLink
                        href="/account/orders"
                        label="Orders"
                        icon={Receipt}
                        active={isActive('/account/orders')}
                        mobile
                        onNavigate={closeMenus}
                      />
                    ) : null}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-white hover:bg-white/10 sm:col-span-2"
                    >
                      <LogOut size={18} />
                      Sign out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={closeMenus}
                    className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-white"
                    style={{ backgroundColor: palette.primary }}
                  >
                    <LogIn size={16} />
                    Sign in
                  </Link>
                )}
              </div>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
