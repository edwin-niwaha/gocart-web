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
  Truck,
  UserCircle2,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  addressApi,
  notificationApi,
  orderApi,
  paymentApi,
  shippingApi,
  wishlistApi,
} from '@/lib/api/services';
import { useAuthStore } from '@/lib/stores/auth-store';
import { formatCurrency } from '@/lib/utils';

type PortalStats = {
  addresses: number;
  notifications: number;
  orders: number;
  payments: number;
  shipments: number;
  wishlist: number;
  paidTotal: number;
};

const initialStats: PortalStats = {
  addresses: 0,
  notifications: 0,
  orders: 0,
  payments: 0,
  shipments: 0,
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
  {
    href: '/account/shipments',
    title: 'Shipments',
    body: 'Check delivery status, tracking, and shipping fees.',
    icon: Truck,
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
  { icon: Truck, label: 'Shipments', value: (stats) => stats.shipments },
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

      const [orders, addresses, wishlist, notifications, payments, shipments] =
        await Promise.all([
          orderApi.list().catch(() => []),
          addressApi.list().catch(() => []),
          wishlistApi.listItems().catch(() => []),
          notificationApi.list().catch(() => []),
          paymentApi.list().catch(() => []),
          shippingApi.shipments().catch(() => []),
        ]);

      if (!mounted) return;

      const paymentItems = normalizeList<any>(payments);
      setStats({
        addresses: normalizeList(addresses).length,
        notifications: normalizeList<any>(notifications).filter((item) => !item.is_read).length,
        orders: normalizeList(orders).length,
        payments: paymentItems.length,
        shipments: normalizeList(shipments).length,
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
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="bg-[#127D61] p-6 text-white">
          <p className="text-sm font-bold text-emerald-100">Account overview</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">
            Welcome back{displayName ? `, ${displayName}` : ''}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50">
            Manage shopping activity, delivery details, payments, and account security from one portal.
          </p>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ icon: StatIcon, label, value }) => {
            return (
              <div key={String(label)} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <StatIcon className="h-5 w-5 text-[#127D61]" />
                <p className="mt-3 text-2xl font-black text-slate-900">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : value(stats)}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <Wallet className="h-5 w-5 text-[#127D61]" />
          <p className="mt-3 text-sm font-bold text-slate-500">Paid total</p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {loading ? 'Loading...' : formatCurrency(stats.paidTotal)}
          </p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <MapPin className="h-5 w-5 text-[#127D61]" />
          <p className="mt-3 text-sm font-bold text-slate-500">Saved addresses</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats.addresses}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <ShieldCheck className="h-5 w-5 text-[#127D61]" />
          <p className="mt-3 text-sm font-bold text-slate-500">Email status</p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {user?.is_email_verified ? 'Verified' : 'Needs verification'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#127D61] hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#127D61]/10 text-[#127D61]">
                <Icon size={21} />
              </div>
              <h2 className="mt-4 text-xl font-black text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              <p className="mt-4 text-sm font-black text-[#127D61]">Open</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
