'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    Promise.all([
      adminApi.products().catch(() => []),
      adminApi.orders().catch(() => []),
      adminApi.shippingMethods().catch(() => []),
      adminApi.deliveryRates().catch(() => []),
      adminApi.pickupStations().catch(() => []),
      adminApi.memberships().catch(() => []),
      adminApi.supportMessages().catch(() => []),
      adminApi.featureFlags().catch(() => []),
    ]).then(([
      products,
      orders,
      shippingMethods,
      deliveryRates,
      pickupStations,
      memberships,
      support,
      flags,
    ]) => {
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
      setLoading(false);
    });
  }, []);

  const cards = [
    { label: 'Products', value: stats.products, href: '/dashboard/products' },
    { label: 'Orders', value: stats.orders, href: '/dashboard/orders' },
    {
      label: 'Shipping methods',
      value: stats.shippingMethods,
      href: '/dashboard/shipping-methods',
    },
    {
      label: 'Delivery rates',
      value: stats.deliveryRates,
      href: '/dashboard/delivery-rates',
    },
    {
      label: 'Pickup stations',
      value: stats.pickupStations,
      href: '/dashboard/pickup-stations',
    },
    { label: 'Staff', value: stats.staff, href: '/dashboard/staff' },
    { label: 'Support inbox', value: stats.support, href: '/dashboard/support' },
    { label: 'Feature flags', value: stats.flags, href: '/dashboard/feature-flags' },
  ];

  return (
    <div className="space-y-6 py-6">
      <section className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-orange-50 p-6 shadow-sm">
        <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#F79420] shadow-sm">
          GoCart W2
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
          Tenant admin dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Role-based operations center for products, shipping, orders, staff,
          support, and white-label settings.
        </p>
        <div className="mt-4 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          Current role: {currentRole() || 'viewer'}
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-slate-500">
          Loading metrics...
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-sm font-semibold text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-black text-slate-900">
              {card.value}
            </p>
            <p className="mt-2 text-sm text-[#127D61]">Open</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
