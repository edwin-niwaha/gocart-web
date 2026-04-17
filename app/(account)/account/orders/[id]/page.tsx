'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
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

function getProductImage(item: any) {
  return (
    item.product_image ||
    item.image ||
    item.product_image_url ||
    item.thumbnail ||
    null
  );
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

function getVariantText(item: any) {
  const parts = [
    item.variant_name,
    item.variant_value,
    item.size,
    item.color,
  ].filter(Boolean);

  return parts.join(' • ');
}

function DetailRow({
  label,
  value,
  valueClassName = '',
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className={`text-right text-sm font-extrabold text-slate-900 ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi
      .list()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const order = useMemo(
    () =>
      orders.find(
        (item) =>
          String((item as any).id) === String(params.id) ||
          String((item as any).slug) === String(params.id)
      ),
    [orders, params.id]
  );

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-4 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="h-8 w-52 rounded-full bg-slate-200" />
            <div className="h-5 w-32 rounded-full bg-slate-200" />
            <div className="h-24 rounded-3xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Package2 size={28} className="text-slate-400" />
        </div>
        <h1 className="mt-4 text-2xl font-black text-slate-900">Order not found</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          We could not find that order in your account.
        </p>

        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
          >
            Go back
          </button>

          <Link
            href="/account/orders"
            className="inline-flex rounded-2xl bg-[#127D61] px-5 py-3 text-sm font-bold text-white transition hover:opacity-95"
          >
            All orders
          </Link>
        </div>
      </div>
    );
  }

  const itemCount = getItemCount(order);
  const status = getStatusStyles(order.status);
  const StatusIcon = status.icon;

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
          >
            <ArrowLeft size={18} />
          </button>

          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ${status.chip}`}
          >
            <StatusIcon size={14} />
            {formatStatus(order.status)}
          </span>
        </div>

        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
          Order Details
        </h1>
        <p className="mt-2 text-sm font-bold text-slate-500">
          #{(order as any).slug || (order as any).id}
        </p>

        <p className="mt-3 text-3xl font-black text-slate-900">
          {formatCurrency((order as any).total_price ?? 0)}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
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

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-black text-slate-900">Order Summary</h2>

        <div className="mt-4 space-y-3">
          <DetailRow label="Order ID" value={`#${(order as any).slug || (order as any).id}`} />
          <DetailRow label="Status" value={formatStatus(order.status)} />
          <DetailRow
            label="Items"
            value={`${itemCount} item${itemCount === 1 ? '' : 's'}`}
          />
          <DetailRow
            label="Total"
            value={formatCurrency((order as any).total_price ?? 0)}
          />
        </div>

        {(order as any).description ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
              Order note
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {(order as any).description}
            </p>
          </div>
        ) : null}
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-900">Items in this order</h2>
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {itemCount} item{itemCount === 1 ? '' : 's'}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {(order.items || []).map((item: any) => {
            const variantText = getVariantText(item);

            return (
              <div
                key={item.id}
                className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex gap-4">
                {/* IMAGE */}
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    {getProductImage(item) ? (
                    <Image
                        src={getProductImage(item)}
                        alt={getProductTitle(item)}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                        unoptimized
                    />
                    ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <Package2 size={20} className="text-slate-400" />
                    </div>
                    )}
                </div>

                {/* INFO */}
                <div className="flex-1">
                    <p className="text-sm font-extrabold text-slate-900">
                    {getProductTitle(item)}
                    </p>

                    {variantText ? (
                    <p className="mt-1 text-sm text-slate-500">
                        {variantText}
                    </p>
                    ) : null}

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                    <span>Qty: {item.quantity}</span>
                    <span>Unit: {formatCurrency(item.unit_price)}</span>
                    </div>

                    <p className="mt-2 text-base font-black text-slate-900">
                    {formatCurrency(item.line_total)}
                    </p>
                </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/account/orders"
          className="inline-flex rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
        >
          Back to orders
        </Link>
      </div>
    </div>
  );
}