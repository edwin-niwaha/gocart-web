'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Mail,
  MapPin,
  Package2,
  Phone,
  RefreshCcw,
  Truck,
  User,
  XCircle,
} from 'lucide-react';

import { adminApi, getApiErrorMessage, orderApi } from '@/lib/api/services';
import type { Order } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

const ACTIONS = [
  { label: 'Process', status: 'PROCESSING', tone: 'blue' },
  { label: 'Mark paid', status: 'PAID', tone: 'emerald' },
  { label: 'Ship', status: 'SHIPPED', tone: 'orange' },
  { label: 'Deliver', status: 'DELIVERED', tone: 'green' },
  { label: 'Cancel', status: 'CANCELLED', tone: 'red' },
] as const;

function formatDate(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatStatus(value?: string) {
  const label = (value || 'PENDING').toLowerCase().replace(/_/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function statusClass(status?: string) {
  switch ((status || '').toUpperCase()) {
    case 'DELIVERED':
      return 'bg-green-100 text-green-700 ring-green-200';
    case 'SHIPPED':
      return 'bg-orange-100 text-orange-700 ring-orange-200';
    case 'PAID':
      return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-700 ring-blue-200';
    case 'CANCELLED':
    case 'REFUNDED':
      return 'bg-red-100 text-red-700 ring-red-200';
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200';
  }
}

function actionClass(tone: string) {
  switch (tone) {
    case 'blue':
      return 'bg-blue-600 hover:bg-blue-700 text-white';
    case 'emerald':
      return 'bg-emerald-600 hover:bg-emerald-700 text-white';
    case 'orange':
      return 'bg-orange-500 hover:bg-orange-600 text-white';
    case 'green':
      return 'bg-green-600 hover:bg-green-700 text-white';
    case 'red':
      return 'bg-red-600 hover:bg-red-700 text-white';
    default:
      return 'bg-slate-700 hover:bg-slate-800 text-white';
  }
}

function getCustomerEmail(order: Order) {
  return order.customer_email || order.user_email || '';
}

function getCustomerName(order: Order) {
  return order.customer_name || getCustomerEmail(order) || 'Customer';
}

function getAddress(order: Order) {
  return [
    order.address_street_name,
    order.address_area,
    order.address_city,
    order.address_region,
  ]
    .filter(Boolean)
    .join(', ');
}

function getProductTitle(item: any) {
  return item.product_title || item.product_slug || `Product #${item.product}`;
}

function getVariantText(item: any) {
  return [item.variant_name, item.variant_sku].filter(Boolean).join(' / ');
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-400">
        <Icon size={15} />
        {label}
      </div>
      <p className="mt-2 break-words text-sm font-black text-slate-900">
        {value || '-'}
      </p>
    </div>
  );
}

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params?.slug ?? '');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyStatus, setBusyStatus] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!slug) return;

    setLoading(true);
    setError('');

    try {
      setOrder(await orderApi.detail(slug));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Order not found.'));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(status: string) {
    if (!order) return;

    setBusyStatus(status);
    setError('');

    try {
      setOrder(await adminApi.transitionOrder(order.slug, status));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to update order status.'));
    } finally {
      setBusyStatus('');
    }
  }

  const itemCount = useMemo(
    () => (order?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [order],
  );

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500 shadow-sm">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <Package2 size={24} className="text-slate-400" />
        </div>
        <h1 className="mt-4 text-xl font-black text-slate-900">Order not found</h1>
        <p className="mt-2 text-sm text-slate-500">
          This admin order detail route is available, but the order could not be loaded.
        </p>
        {error ? (
          <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
        ) : null}
        <Link
          href="/dashboard/orders"
          className="mt-5 inline-flex rounded-2xl bg-[#127D61] px-4 py-2.5 text-sm font-black text-white"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#127D61] to-emerald-600 px-6 py-7 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-3 py-2 text-sm font-black transition hover:bg-white/25"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <h1 className="mt-4 text-3xl font-black tracking-tight">
                Order #{order.slug}
              </h1>
              <p className="mt-2 text-sm text-emerald-50">
                {itemCount} item{itemCount === 1 ? '' : 's'} placed on {formatDate(order.created_at)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-[#127D61]"
              >
                <RefreshCcw size={16} />
                Refresh
              </button>
              <span
                className={`inline-flex items-center rounded-2xl px-4 py-2.5 text-sm font-black ring-1 ${statusClass(
                  order.status,
                )}`}
              >
                {formatStatus(order.status)}
              </span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mx-6 mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          <InfoTile icon={User} label="Customer" value={getCustomerName(order)} />
          <InfoTile icon={Mail} label="Email" value={getCustomerEmail(order)} />
          <InfoTile icon={Phone} label="Phone" value={order.customer_phone || ''} />
          <InfoTile icon={CreditCard} label="Total" value={formatCurrency(order.total_price)} />
        </div>

        <div className="grid gap-4 border-t border-slate-100 p-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-black text-slate-900">Items</h2>
            <div className="mt-4 space-y-3">
              {(order.items || []).map((item: any) => {
                const variantText = getVariantText(item);

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900">
                          {getProductTitle(item)}
                        </p>
                        {variantText ? (
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {variantText}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          Qty {item.quantity} x {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-black text-slate-900">
                        {formatCurrency(item.line_total)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-black text-slate-900">Fulfillment</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Truck size={17} className="mt-0.5 text-slate-400" />
                  <div>
                    <p className="font-black text-slate-900">
                      {formatStatus(order.delivery_option)}
                    </p>
                    <p className="mt-1 text-slate-500">
                      {order.pickup_station_name || getAddress(order) || 'No address recorded'}
                    </p>
                  </div>
                </div>
                {order.address_additional_information ? (
                  <div className="flex items-start gap-3">
                    <MapPin size={17} className="mt-0.5 text-slate-400" />
                    <p className="text-slate-500">{order.address_additional_information}</p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-black text-slate-900">Status actions</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {ACTIONS.map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    disabled={Boolean(busyStatus) || order.status === action.status}
                    onClick={() => void updateStatus(action.status)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${actionClass(
                      action.tone,
                    )}`}
                  >
                    {busyStatus === action.status ? 'Updating...' : action.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="flex items-center gap-2 text-base font-black text-slate-900">
                <CalendarDays size={17} />
                Summary
              </h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Subtotal</dt>
                  <dd className="font-black text-slate-900">
                    {formatCurrency(order.items_subtotal || order.total_price)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Discount</dt>
                  <dd className="font-black text-slate-900">
                    {formatCurrency(order.discount_amount || 0)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Shipping</dt>
                  <dd className="font-black text-slate-900">
                    {formatCurrency(order.shipping_fee || 0)}
                  </dd>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Total</dt>
                    <dd className="font-black text-slate-900">
                      {formatCurrency(order.total_price)}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700"
      >
        <ArrowLeft size={16} />
        Back to orders
      </Link>
    </div>
  );
}
