'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Heart,
  Loader2,
  MapPin,
  Package,
  ShieldCheck,
  UserCircle2,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  addressApi,
  notificationApi,
  orderApi,
  paymentApi,
  wishlistApi,
} from '@/lib/api/services';
import { useAuthStore } from '@/lib/stores/auth-store';
import { formatCurrency } from '@/lib/utils';

type PortalStats = {
  addresses: number;
  notifications: number;
  orders: number;
  payments: number;
  wishlist: number;
  paidTotal: number;
};

const initialStats: PortalStats = {
  addresses: 0,
  notifications: 0,
  orders: 0,
  payments: 0,
  wishlist: 0,
  paidTotal: 0,
};

const quickLinks = [
  {
    href: '/account/profile',
    title: 'Profile',
    body: 'Update your photo, username, and personal details.',
    icon: UserCircle2,
  },
  {
    href: '/account/security',
    title: 'Security',
    body: 'Change your password and manage email verification.',
    icon: ShieldCheck,
  },
  {
    href: '/account/orders',
    title: 'Orders',
    body: 'Track order history, totals, and reviewable products.',
    icon: Package,
  },
  {
    href: '/account/addresses',
    title: 'Addresses',
    body: 'Save delivery locations and choose a default address.',
    icon: MapPin,
  },
  {
    href: '/account/wishlist',
    title: 'Wishlist',
    body: 'Return to products you saved for later.',
    icon: Heart,
  },
];

const statCards: Array<{
  icon: LucideIcon;
  label: string;
  value: (stats: PortalStats) => number;
}> = [
  { icon: Package, label: 'Orders', value: (stats) => stats.orders },
  { icon: Heart, label: 'Saved items', value: (stats) => stats.wishlist },
  { icon: Bell, label: 'Unread alerts', value: (stats) => stats.notifications },
];

function normalizeList<T>(value: T[] | { results?: T[] } | unknown): T[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && Array.isArray((value as any).results)) {
    return (value as { results: T[] }).results;
  }
  return [];
}

export default function AccountOverviewPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<PortalStats>(initialStats);
  const [loading, setLoading] = useState(true);

  const displayName = useMemo(() => {
    return (
      [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() ||
      user?.username ||
      'GoCart shopper'
    );
  }, [user]);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      setLoading(true);

      const [orders, addresses, wishlist, notifications, payments] =
        await Promise.all([
          orderApi.list().catch(() => []),
          addressApi.list().catch(() => []),
          wishlistApi.listItems().catch(() => []),
          notificationApi.list().catch(() => []),
          paymentApi.list().catch(() => []),
        ]);

      if (!mounted) return;

      const paymentItems = normalizeList<any>(payments);
      setStats({
        addresses: normalizeList(addresses).length,
        notifications: normalizeList<any>(notifications).filter((item) => !item.is_read).length,
        orders: normalizeList(orders).length,
        payments: paymentItems.length,
        wishlist: normalizeList(wishlist).length,
        paidTotal: paymentItems
          .filter((payment) => payment.status === 'PAID')
          .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      });
      setLoading(false);
    }

    loadStats().catch(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

return (
  <div className="space-y-4">
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-[#127D61] px-5 py-5 text-white sm:px-6">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-100">
          Account overview
        </p>

        <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
          Welcome back{displayName ? `, ${displayName}` : ''}.
        </h1>

        <p className="mt-1 max-w-2xl text-sm leading-5 text-emerald-50">
          Manage orders, delivery details, payments, wishlist, and security.
        </p>
      </div>

      <div className="grid gap-2 p-3 sm:grid-cols-3">
        {statCards.map(({ icon: StatIcon, label, value }) => (
          <div
            key={String(label)}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#127D61]/10 text-[#127D61]">
              <StatIcon className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="text-lg font-black leading-none text-slate-900">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : value(stats)}
              </p>
              <p className="mt-1 truncate text-[11px] font-black uppercase tracking-wide text-slate-500">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="grid gap-3 md:grid-cols-3">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Wallet className="h-5 w-5 shrink-0 text-[#127D61]" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500">Paid total</p>
          <p className="break-words text-base font-black leading-tight text-slate-900 sm:text-lg">
            {loading ? 'Loading...' : formatCurrency(stats.paidTotal)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <MapPin className="h-5 w-5 shrink-0 text-[#127D61]" />
        <div>
          <p className="text-xs font-bold text-slate-500">Saved addresses</p>
          <p className="text-lg font-black text-slate-900">{stats.addresses}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <ShieldCheck className="h-5 w-5 shrink-0 text-[#127D61]" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500">Email status</p>
          <p className="truncate text-lg font-black text-slate-900">
            {user?.is_email_verified ? 'Verified' : 'Needs verification'}
          </p>
        </div>
      </div>
    </section>

    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {quickLinks.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#127D61] hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#127D61]/10 text-[#127D61]">
              <Icon size={19} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-black text-slate-900">
                {item.title}
              </h2>
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">
                {item.body}
              </p>
            </div>

            <span className="shrink-0 text-xs font-black text-[#127D61]">
              Open
            </span>
          </Link>
        );
      })}
    </section>
  </div>
);
}
