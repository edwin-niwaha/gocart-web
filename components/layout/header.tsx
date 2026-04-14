'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingCart,
  Store,
  X,
  Receipt,
  Headphones,
} from 'lucide-react';

import { useAuthStore } from '@/lib/stores/auth-store';
import { useTenant } from '@/app/providers/TenantProvider';
import { getBrandPalette } from '@/lib/tenant/theme';
import { cartApi, orderApi } from '@/lib/api/services';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated, logout, canAccessDashboard } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);

  const tenant = useTenant();
  const palette = getBrandPalette(tenant?.branding);

  const appName = tenant?.branding?.app_name || 'GoCart';
  const slogan = 'Shop • Sell • Deliver';
  const dashboardAllowed = canAccessDashboard();

  useEffect(() => {
    async function loadCounts() {
      try {
        const items = await cartApi.listItems();
        const count = items.reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0
        );
        setCartCount(count);

        const orders = await orderApi.list();
        setOrdersCount(orders.length);
      } catch {
        setCartCount(0);
        setOrdersCount(0);
      }
    }

    loadCounts();
  }, []);

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

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const navLinks = [
    { href: '/', label: 'Home', icon: Store },
    { href: '/products', label: 'Shop', icon: Package },
    { href: '/cart', label: 'Cart', icon: ShoppingCart },
    { href: '/support', label: 'Support', icon: Headphones },
  ];

  return (
    <header className="sticky top-0 z-50 shadow-md">
      <div className="bg-[#131921] text-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-md font-black text-white"
                style={{ backgroundColor: palette.primary }}
              >
                G
              </div>

              <div>
                <p className="text-lg font-black">{appName}</p>
                <p className="text-xs text-gray-300">{slogan}</p>
              </div>
            </Link>

            <form
              onSubmit={handleSearchSubmit}
              className="order-3 flex w-full flex-1 overflow-hidden rounded-md border-2 border-transparent bg-white lg:order-none lg:min-w-[320px]"
            >
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products"
                className="h-10 flex-1 border-0 px-4 text-sm text-[#0F1111] outline-none"
              />
              <button
                type="submit"
                className="flex h-10 w-12 items-center justify-center bg-[#FEBD69] text-[#111111] transition hover:bg-[#f3a847]"
              >
                <Search size={18} />
              </button>
            </form>

            <div className="ml-auto flex items-center gap-3">
              <Link href="/cart" className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10">
                  <ShoppingCart size={20} />
                </div>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 rounded-full bg-[#f08804] px-1.5 text-xs font-bold text-black">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {user && (
                <Link href="/account/orders" className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10">
                    <Receipt size={20} />
                  </div>
                  {ordersCount > 0 && (
                    <span className="absolute -top-2 -right-2 rounded-full bg-[#f08804] px-1.5 text-xs font-bold text-black">
                      {ordersCount}
                    </span>
                  )}
                </Link>
              )}

              {!hydrated ? null : user ? (
                <button
                  onClick={() => logout()}
                  className="rounded-md bg-white/10 px-3 py-2 text-sm font-bold"
                >
                  <LogOut size={16} />
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  className="rounded-md px-4 py-2 text-sm font-bold text-white"
                  style={{ backgroundColor: palette.primary }}
                >
                  <LogIn size={16} />
                </Link>
              )}

              <button
                onClick={() => setMobileOpen((prev) => !prev)}
                className="rounded-md bg-white/10 p-2 lg:hidden"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          <div className="mt-3 hidden lg:flex items-center gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition ${
                    active
                      ? 'bg-white text-black'
                      : 'text-gray-200 hover:bg-white/10'
                  }`}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}

            {dashboardAllowed && (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold text-gray-200 hover:bg-white/10"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            )}
          </div>

          {mobileOpen && (
            <div className="pt-3 lg:hidden">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md p-3 hover:bg-white/10"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}