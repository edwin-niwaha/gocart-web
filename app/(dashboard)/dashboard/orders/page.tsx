'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  PackageCheck,
  RefreshCcw,
  Truck,
  XCircle,
} from 'lucide-react';

import { adminApi, getApiErrorMessage } from '@/lib/api/services';

const ORDER_STEPS = ['PENDING', 'PROCESSING', 'PAID', 'SHIPPED', 'DELIVERED'];

const ACTIONS = [
  { label: 'Process', status: 'PROCESSING', tone: 'blue' },
  { label: 'Mark paid', status: 'PAID', tone: 'emerald' },
  { label: 'Ship', status: 'SHIPPED', tone: 'orange' },
  { label: 'Deliver', status: 'DELIVERED', tone: 'green' },
  { label: 'Cancel', status: 'CANCELLED', tone: 'red' },
] as const;

function formatMoney(value: any) {
  const amount = Number(value || 0);
  return `UGX ${amount.toLocaleString()}`;
}

function formatDate(value: any) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function statusClass(status: string) {
  switch (status) {
    case 'DELIVERED':
      return 'bg-green-100 text-green-700 ring-green-200';
    case 'SHIPPED':
      return 'bg-orange-100 text-orange-700 ring-orange-200';
    case 'PAID':
      return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-700 ring-blue-200';
    case 'CANCELLED':
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

function OrderProgress({ status }: { status: string }) {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 text-sm font-bold text-red-600">
        <XCircle size={16} />
        Order cancelled
      </div>
    );
  }

  const currentIndex = Math.max(0, ORDER_STEPS.indexOf(status));

  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {ORDER_STEPS.map((step, index) => {
        const done = index <= currentIndex;

        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                done ? 'bg-[#127D61] text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {done ? <CheckCircle2 size={15} /> : index + 1}
            </div>

            <span
              className={`hidden text-xs font-black md:inline ${
                done ? 'text-[#127D61]' : 'text-slate-400'
              }`}
            >
              {step.replace('_', ' ')}
            </span>

            {index < ORDER_STEPS.length - 1 ? (
              <div
                className={`h-1 w-8 rounded-full ${
                  index < currentIndex ? 'bg-[#127D61]' : 'bg-slate-200'
                }`}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busySlug, setBusySlug] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const data = await adminApi.orders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load orders.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateStatus(order: any, status: string) {
    setBusySlug(order.slug);
    setError('');

    try {
      await adminApi.transitionOrder(order.slug, status);
      await load();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to update order.'));
    } finally {
      setBusySlug('');
    }
  }

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0),
    [orders],
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#127D61] to-emerald-600 px-6 py-7 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-wide">
                Orders
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight">
                Order management
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-50">
                Track orders, payments, shipping, delivery progress, and customer activity.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#127D61] disabled:opacity-60"
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-100 p-5 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-500">Total orders</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{orders.length}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-500">Total amount</p>
            <p className="mt-2 break-words text-2xl font-black leading-tight text-slate-900 sm:text-3xl">
              {formatMoney(totalRevenue)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-500">Pending / active</p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {orders.filter((order) => !['DELIVERED', 'CANCELLED'].includes(order.status)).length}
            </p>
          </div>
        </div>

        {error ? (
          <div className="mx-5 mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-4 p-5">
          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">
              No orders found.
            </div>
          ) : (
            orders.map((order) => (
              <article
                key={order.slug}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-black text-slate-900">
                        #{order.slug}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(
                          order.status,
                        )}`}
                      >
                        {order.status || 'PENDING'}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                      <span className="inline-flex items-center gap-2">
                        <CreditCard size={15} />
                        {order.payment_method || 'Payment not set'}
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <Truck size={15} />
                        {order.delivery_option || 'Delivery not set'}
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <Clock size={15} />
                        {formatDate(order.created_at)}
                      </span>

                      <span className="inline-flex min-w-0 items-center gap-2 break-words font-black text-slate-900">
                        <PackageCheck size={15} />
                        {formatMoney(order.total_price)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      Customer: {order.user_email || order.username || '—'}
                    </p>
                  </div>

                  <Link
                    href={`/dashboard/orders/${order.slug}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                  >
                    <Eye size={16} />
                    View details
                  </Link>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <OrderProgress status={order.status || 'PENDING'} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {ACTIONS.map((action) => (
                    <button
                      key={action.status}
                      type="button"
                      disabled={busySlug === order.slug || order.status === action.status}
                      onClick={() => updateStatus(order, action.status)}
                      className={`rounded-xl px-4 py-2.5 text-sm font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${actionClass(
                        action.tone,
                      )}`}
                    >
                      {busySlug === order.slug ? 'Updating...' : action.label}
                    </button>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
