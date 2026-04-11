'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function DashboardPage() {
  const { currentRole } = useAuthStore();
  const [stats, setStats] = useState({ products: 0, orders: 0, staff: 0, support: 0, flags: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.products().catch(() => []),
      adminApi.orders().catch(() => []),
      adminApi.memberships().catch(() => []),
      adminApi.supportMessages().catch(() => []),
      adminApi.featureFlags().catch(() => []),
    ]).then(([products, orders, memberships, support, flags]) => {
      setStats({ products: products.length, orders: orders.length, staff: memberships.length, support: support.length, flags: flags.length });
      setLoading(false);
    });
  }, []);

  const cards = [
    { label: 'Products', value: stats.products, href: '/dashboard/products' },
    { label: 'Orders', value: stats.orders, href: '/dashboard/orders' },
    { label: 'Staff', value: stats.staff, href: '/dashboard/staff' },
    { label: 'Support inbox', value: stats.support, href: '/dashboard/support' },
    { label: 'Feature flags', value: stats.flags, href: '/dashboard/feature-flags' },
  ];

  return (
    <div className="space-y-6 py-6">
      <section className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-orange-50 p-6 shadow-sm">
        <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#F79420] shadow-sm">GoCart W2</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Tenant admin dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Role-based operations center for products, orders, staff, support, and white-label settings.</p>
        <div className="mt-4 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Current role: {currentRole() || 'viewer'}</div>
      </section>

      {loading ? <div className="rounded-2xl border bg-white p-6 text-slate-500">Loading metrics…</div> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-sm font-semibold text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-[#127D61]">Open</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
