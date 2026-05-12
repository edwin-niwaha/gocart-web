'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  BadgePercent,
  Boxes,
  ChevronRight,
  Flag,
  Headphones,
  MapPin,
  PackageCheck,
  RefreshCcw,
  ShoppingBag,
  Truck,
  Users,
} from 'lucide-react';

import { adminApi, getApiErrorMessage } from '@/lib/api/services';
import { useAuthStore } from '@/lib/stores/auth-store';

type DashboardStats = {
  products: number;
  orders: number;
  coupons: number;
  shippingMethods: number;
  deliveryRates: number;
  pickupStations: number;
  staff: number;
  support: number;
  flags: number;
};

const initialStats: DashboardStats = {
  products: 0,
  orders: 0,
  coupons: 0,
  shippingMethods: 0,
  deliveryRates: 0,
  pickupStations: 0,
  staff: 0,
  support: 0,
  flags: 0,
};

function countItems(value: unknown) {
  if (Array.isArray(value)) return value.length;

  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as any).results)
  ) {
    return (value as any).results.length;
  }

  return 0;
}

export default function DashboardPage() {
  const { currentRole } = useAuthStore();

  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const [
        products,
        orders,
        coupons,
        shippingMethods,
        deliveryRates,
        pickupStations,
        memberships,
        support,
        flags,
      ] = await Promise.all([
        adminApi.products().catch(() => []),
        adminApi.orders().catch(() => []),
        adminApi.coupons().catch(() => []),
        adminApi.shippingMethods().catch(() => []),
        adminApi.deliveryRates().catch(() => []),
        adminApi.pickupStations().catch(() => []),
        adminApi.memberships().catch(() => []),
        adminApi.supportMessages().catch(() => []),
        adminApi.featureFlags().catch(() => []),
      ]);

      setStats({
        products: countItems(products),
        orders: countItems(orders),
        coupons: countItems(coupons),
        shippingMethods: countItems(shippingMethods),
        deliveryRates: countItems(deliveryRates),
        pickupStations: countItems(pickupStations),
        staff: countItems(memberships),
        support: countItems(support),
        flags: countItems(flags),
      });
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, 'Failed to load dashboard metrics.')
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const cards = useMemo(
    () => [
      {
        label: 'Products',
        value: stats.products,
        href: '/dashboard/products',
        description: 'Manage items',
        icon: ShoppingBag,
      },
      {
        label: 'Orders',
        value: stats.orders,
        href: '/dashboard/orders',
        description: 'Customer purchases',
        icon: PackageCheck,
      },
      {
        label: 'Coupons',
        value: stats.coupons,
        href: '/dashboard/coupons',
        description: 'Discount offers',
        icon: BadgePercent,
      },
      {
        label: 'Shipping',
        value: stats.shippingMethods,
        href: '/dashboard/shipping-methods',
        description: 'Delivery methods',
        icon: Truck,
      },
      {
        label: 'Rates',
        value: stats.deliveryRates,
        href: '/dashboard/delivery-rates',
        description: 'Delivery pricing',
        icon: Boxes,
      },
      {
        label: 'Pickup',
        value: stats.pickupStations,
        href: '/dashboard/pickup-stations',
        description: 'Pickup locations',
        icon: MapPin,
      },
      {
        label: 'Staff',
        value: stats.staff,
        href: '/dashboard/staff',
        description: 'Tenant users',
        icon: Users,
      },
      {
        label: 'Support',
        value: stats.support,
        href: '/dashboard/support',
        description: 'Customer inbox',
        icon: Headphones,
      },
      {
        label: 'Flags',
        value: stats.flags,
        href: '/dashboard/feature-flags',
        description: 'Platform features',
        icon: Flag,
      },
    ],
    [stats]
  );

  const totalRecords = Object.values(stats).reduce(
    (sum, value) => sum + value,
    0
  );

  const maxValue = Math.max(...cards.map((card) => card.value), 1);

  return (
    <div className="space-y-5 py-4">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#127D61] via-emerald-700 to-slate-900 p-5 text-white shadow-lg md:p-6">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-[#F79420]/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">
              Admin dashboard
            </p>

            <h1 className="mt-2 text-2xl font-black tracking-tight md:text-4xl">
              Dashboard overview
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-emerald-50">
              Monitor products, orders, staff, support, and operations in one place.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
                <p className="text-lg font-black">{totalRecords}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-100">
                  Total records
                </p>
              </div>

              <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur">
                <p className="text-lg font-black">{cards.length}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-100">
                  Modules
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-[#127D61] shadow-md transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />

            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </section>

      {/* Error */}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {/* Stats Cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {loading
          ? Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="h-9 w-9 rounded-xl bg-slate-100" />

                <div className="mt-4 h-3 w-20 rounded-full bg-slate-100" />

                <div className="mt-3 h-7 w-14 rounded-full bg-slate-100" />
              </div>
            ))
          : cards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.label}
                  href={card.href}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#127D61] transition group-hover:scale-105">
                      <Icon className="h-4 w-4" />
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#127D61]" />
                  </div>

                  <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    {card.label}
                  </p>

                  <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                    {card.value}
                  </p>

                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                    {card.description}
                  </p>
                </Link>
              );
            })}
      </section>

      {/* Analytics + Quick Actions */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Overview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Operations overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Quick comparison of your resources.
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-[#127D61]">
              Live
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {cards.slice(0, 7).map((card) => {
              const width = `${Math.max(
                (card.value / maxValue) * 100,
                card.value ? 8 : 3
              )}%`;

              return (
                <div key={card.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">
                      {card.label}
                    </span>

                    <span className="font-black text-slate-900">
                      {card.value}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#127D61] transition-all"
                      style={{ width }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">
            Quick actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Common admin workflows.
          </p>

          <div className="mt-4 space-y-2">
            {[
              ['Add product', '/dashboard/products'],
              ['Create coupon', '/dashboard/coupons'],
              ['Review orders', '/dashboard/orders'],
              ['Support inbox', '/dashboard/support'],
              ['Update branding', '/dashboard/branding'],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#127D61]"
              >
                {label}

                <ChevronRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}