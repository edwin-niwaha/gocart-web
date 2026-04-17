'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Package2,
  Truck,
  XCircle,
} from 'lucide-react';

import { orderApi } from '@/lib/api/services';
import type { Order } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

function normalizeStatus(status?: string): OrderStatus | string {
  return (status || 'PENDING').toUpperCase();
}

function formatStatus(status?: string) {
  const normalized = normalizeStatus(status).toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getStatusStyles(status?: string) {
  switch (normalizeStatus(status)) {
    case 'DELIVERED':
      return {
        chip: 'bg-green-100 text-green-700',
        dot: 'bg-green-600',
        icon: CheckCircle2,
      };
    case 'SHIPPED':
      return {
        chip: 'bg-blue-100 text-blue-700',
        dot: 'bg-blue-600',
        icon: Truck,
      };
    case 'PROCESSING':
      return {
        chip: 'bg-amber-100 text-amber-700',
        dot: 'bg-amber-600',
        icon: Clock3,
      };
    case 'PAID':
      return {
        chip: 'bg-violet-100 text-violet-700',
        dot: 'bg-violet-600',
        icon: CheckCircle2,
      };
    case 'CANCELLED':
      return {
        chip: 'bg-red-100 text-red-700',
        dot: 'bg-red-600',
        icon: XCircle,
      };
    case 'PENDING':
    default:
      return {
        chip: 'bg-[#127D61]/10 text-[#127D61]',
        dot: 'bg-[#127D61]',
        icon: Package2,
      };
  }
}

function getItemCount(order?: Order) {
  return (order?.items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );
}

function formatDate(value?: string) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getProductTitle(item: any) {
  return item.product_title || item.product_slug || `Product #${item.product}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi
      .list()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const totalOrders = orders.length;
  const totalItems = useMemo(
    () => orders.reduce((sum, order) => sum + getItemCount(order), 0),
    [orders]
  );
  const deliveredOrders = useMemo(
    () =>
      orders.filter(
        (order) => normalizeStatus(order.status) === 'DELIVERED'
      ).length,
    [orders]
  );

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="inline-flex rounded-full bg-[#127D61]/10 px-3 py-1 text-sm font-bold text-[#127D61]">
          Orders
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
          Your orders
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Track status, review totals, and confirm the items in each order.
        </p>

        {!loading ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              <Package2 size={16} className="text-slate-500" />
              {totalOrders} order{totalOrders === 1 ? '' : 's'}
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              <CalendarDays size={16} className="text-slate-500" />
              {totalItems} item{totalItems === 1 ? '' : 's'}
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              <CheckCircle2 size={16} className="text-slate-500" />
              {deliveredOrders} delivered
            </div>
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-4 animate-pulse">
            <div className="h-5 w-40 rounded-full bg-slate-200" />
            <div className="h-24 rounded-3xl bg-slate-100" />
            <div className="h-24 rounded-3xl bg-slate-100" />
          </div>
        </div>
      ) : null}

      {!loading && !orders.length ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Package2 size={28} className="text-slate-400" />
          </div>
          <h2 className="mt-4 text-xl font-black text-slate-900">No orders yet</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Place an order from the shop and it will appear here with its status,
            items, and total amount.
          </p>
          <Link
            href="/products"
            className="mt-5 inline-flex rounded-2xl bg-[#127D61] px-5 py-3 text-sm font-bold text-white transition hover:opacity-95"
          >
            Start shopping
          </Link>
        </div>
      ) : null}

      <div className="space-y-4">
        {orders.map((order) => {
          const itemCount = getItemCount(order);
          const status = getStatusStyles(order.status);
          const StatusIcon = status.icon;

          return (
            <div
              key={order.id}
              className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ${status.chip}`}
                      >
                        <StatusIcon size={14} />
                        {formatStatus(order.status)}
                      </span>

                      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        #{order.slug || order.id}
                      </span>
                    </div>

                    <h2 className="mt-3 text-2xl font-black text-slate-900">
                      Order Details
                    </h2>

                    <div className="mt-3 flex flex-wrap gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                        <Package2 size={14} />
                        {itemCount} item{itemCount === 1 ? '' : 's'}
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                        <CalendarDays size={14} />
                        {formatDate((order as any).created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Total
                    </p>
                    <p className="mt-1 text-3xl font-black text-slate-900">
                      {formatCurrency(order.total_price)}
                    </p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                      <span className="text-sm font-medium text-slate-500">
                        Order ID
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        #{order.slug || order.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                      <span className="text-sm font-medium text-slate-500">
                        Status
                      </span>
                      <span className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-900">
                        <span className={`h-2.5 w-2.5 rounded-full ${status.dot}`} />
                        {formatStatus(order.status)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                      <span className="text-sm font-medium text-slate-500">
                        Items
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {itemCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-slate-500">
                        Total
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {formatCurrency(order.total_price)}
                      </span>
                    </div>
                  </div>

                  {!!order.description && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                        Order note
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {order.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-black text-slate-900">
                      Items in this order
                    </h3>
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      {itemCount} item{itemCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {order.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="rounded-[20px] border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-slate-900">
                              {getProductTitle(item)}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                              <span>Qty: {item.quantity}</span>
                              <span>
                                Unit: {formatCurrency(item.unit_price)}
                              </span>
                              <span>
                                Line: {formatCurrency(item.line_total)}
                              </span>
                            </div>
                          </div>

                          <div className="sm:text-right">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              Line total
                            </p>
                            <p className="mt-1 text-base font-black text-slate-900">
                              {formatCurrency(item.line_total)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-[#127D61] px-5 text-sm font-bold text-white transition hover:opacity-95"
                  >
                    View details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}