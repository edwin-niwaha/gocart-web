'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/stores/auth-store';

type DashboardStats = {
  products: number;
  orders: number;
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
  shippingMethods: 0,
  deliveryRates: 0,
  pickupStations: 0,
  staff: 0,
  support: 0,
  flags: 0,
};

export default function DashboardPage() {
  const { currentRole } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        products,
        orders,
        shippingMethods,
        deliveryRates,
        pickupStations,
        memberships,
        support,
        flags,
      ] = await Promise.all([
        adminApi.products().catch(() => []),
        adminApi.orders().catch(() => []),
        adminApi.shippingMethods().catch(() => []),
        adminApi.deliveryRates().catch(() => []),
        adminApi.pickupStations().catch(() => []),
        adminApi.memberships().catch(() => []),
        adminApi.supportMessages().catch(() => []),
        adminApi.featureFlags().catch(() => []),
      ]);

      setStats({
        products: products.length,
        orders: orders.length,
        shippingMethods: shippingMethods.length,
        deliveryRates: deliveryRates.length,
        pickupStations: pickupStations.length,
        staff: memberships.length,
        support: support.length,
        flags: flags.length,
      });
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const cards = useMemo(
    () => [
      {
        label: 'Products',
        value: stats.products,
        href: '/dashboard/products',
        description: 'Manage catalog items',
        icon: '🛍️',
      },
      {
        label: 'Orders',
        value: stats.orders,
        href: '/dashboard/orders',
        description: 'Track customer purchases',
        icon: '📦',
      },
      {
        label: 'Shipping methods',
        value: stats.shippingMethods,
        href: '/dashboard/shipping-methods',
        description: 'Configure delivery options',
        icon: '🚚',
      },
      {
        label: 'Delivery rates',
        value: stats.deliveryRates,
        href: '/dashboard/delivery-rates',
        description: 'Control delivery pricing',
        icon: '💰',
      },
      {
        label: 'Pickup stations',
        value: stats.pickupStations,
        href: '/dashboard/pickup-stations',
        description: 'Manage pickup locations',
        icon: '📍',
      },
      {
        label: 'Staff',
        value: stats.staff,
        href: '/dashboard/staff',
        description: 'Manage tenant users',
        icon: '👥',
      },
      {
        label: 'Support inbox',
        value: stats.support,
        href: '/dashboard/support',
        description: 'Respond to customers',
        icon: '💬',
      },
      {
        label: 'Feature flags',
        value: stats.flags,
        href: '/dashboard/feature-flags',
        description: 'Control tenant features',
        icon: '🚩',
      },
    ],
    [stats],
  );

  const totalOperations = Object.values(stats).reduce((sum, value) => sum + value, 0);

  return (
    <div className="min-h-screen space-y-8 py-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-[#127D61] via-[#0f766e] to-[#073b32] p-6 text-white shadow-xl shadow-emerald-900/10 md:p-8">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 left-16 h-64 w-64 rounded-full bg-[#F79420]/30 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-emerald-50">
              GoCart W2
            </p>

            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              Tenant admin dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/90 md:text-base">
              A role-based operations center for products, shipping, orders, staff,
              support, and white-label store settings.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
                Role: {currentRole() || 'viewer'}
              </span>
              <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
                {totalOperations} total records
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#127D61] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Refreshing…' : 'Refresh metrics'}
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="h-10 w-10 rounded-2xl bg-slate-100" />
              <div className="mt-5 h-4 w-24 rounded-full bg-slate-100" />
              <div className="mt-4 h-7 w-16 rounded-full bg-slate-100" />
            </div>
          ))}
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl transition group-hover:scale-110">
                  {card.icon}
                </div>

                <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-[#127D61] transition group-hover:bg-emerald-50">
                  Open
                </span>
              </div>

              <p className="mt-5 text-sm font-bold text-slate-500">{card.label}</p>
              <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">
                {card.value}
              </p>
              <p className="mt-2 text-sm text-slate-500">{card.description}</p>
            </Link>
          ))}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Operations overview</h2>
              <p className="mt-1 text-sm text-slate-500">
                Quick view of active tenant resources.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-[#127D61]">
              Live metrics
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {cards.slice(0, 6).map((card) => {
              const max = Math.max(...cards.map((item) => item.value), 1);
              const width = `${Math.max((card.value / max) * 100, card.value ? 8 : 3)}%`;

              return (
                <div key={card.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">{card.label}</span>
                    <span className="font-black text-slate-900">{card.value}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
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

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Jump into common admin workflows.
          </p>

          <div className="mt-5 space-y-3">
            {[
              ['Add product', '/dashboard/products'],
              ['Review orders', '/dashboard/orders'],
              ['Open support inbox', '/dashboard/support'],
              ['Update branding', '/dashboard/branding'],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#127D61]"
              >
                {label}
                <span>→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}