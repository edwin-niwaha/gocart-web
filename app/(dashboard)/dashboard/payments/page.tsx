'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Wallet,
  XCircle,
} from 'lucide-react';

import {
  adminApi,
  getApiErrorMessage,
  type Payment,
} from '@/lib/api/services';

const PROVIDER_OPTIONS = ['CASH', 'STRIPE', 'PAYSTACK', 'FLUTTERWAVE', 'MTN', 'CARD'] as const;

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Refunded', value: 'REFUNDED' },
  { label: 'Cancelled', value: 'CANCELLED' },
] as const;

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

const PAYMENT_STEPS = ['PENDING', 'PROCESSING', 'PAID'];

const PAYMENT_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PROCESSING', 'PAID', 'FAILED', 'CANCELLED'],
  PROCESSING: ['PAID', 'FAILED', 'CANCELLED'],
  PAID: ['REFUNDED'],
  FAILED: ['PROCESSING', 'CANCELLED'],
  REFUNDED: [],
  CANCELLED: [],
};

function getAllowedPaymentTransitions(status?: string) {
  return PAYMENT_TRANSITIONS[String(status || 'PENDING').toUpperCase()] || [];
}

function money(amount: string | number, currency = 'UGX') {
  const numeric = Number(amount || 0);
  if (Number.isNaN(numeric)) return `${currency} ${amount}`;
  return `${currency} ${numeric.toLocaleString()}`;
}

function statusClass(status?: string) {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-700 ring-blue-200';
    case 'PENDING':
      return 'bg-amber-100 text-amber-700 ring-amber-200';
    case 'FAILED':
      return 'bg-red-100 text-red-700 ring-red-200';
    case 'REFUNDED':
      return 'bg-violet-100 text-violet-700 ring-violet-200';
    case 'CANCELLED':
      return 'bg-slate-200 text-slate-700 ring-slate-300';
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200';
  }
}

function actionClass(status: string) {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-600 hover:bg-emerald-700 text-white';
    case 'PROCESSING':
      return 'bg-blue-600 hover:bg-blue-700 text-white';
    case 'FAILED':
      return 'bg-red-600 hover:bg-red-700 text-white';
    case 'REFUNDED':
      return 'bg-violet-600 hover:bg-violet-700 text-white';
    case 'CANCELLED':
      return 'bg-slate-700 hover:bg-slate-800 text-white';
    default:
      return 'bg-amber-500 hover:bg-amber-600 text-white';
  }
}

function PaymentProgress({ status }: { status?: string }) {
  const normalized = String(status || 'PENDING').toUpperCase();

  if (normalized === 'FAILED') {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700">
        <XCircle className="h-4 w-4" />
        Payment failed
      </div>
    );
  }

  if (normalized === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700">
        <XCircle className="h-4 w-4" />
        Payment cancelled
      </div>
    );
  }

  if (normalized === 'REFUNDED') {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-violet-50 px-4 py-3 text-sm font-black text-violet-700">
        <CheckCircle2 className="h-4 w-4" />
        Payment refunded
      </div>
    );
  }

  const currentIndex = Math.max(0, PAYMENT_STEPS.indexOf(normalized));

  return (
    <div className="overflow-x-auto rounded-2xl bg-slate-50 px-4 py-4">
      <div className="flex min-w-max items-center gap-2">
        {PAYMENT_STEPS.map((step, index) => {
          const done = index <= currentIndex;

          return (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                  done ? 'bg-[#127D61] text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </div>

              <span
                className={`text-xs font-black ${
                  done ? 'text-[#127D61]' : 'text-slate-400'
                }`}
              >
                {step}
              </span>

              {index < PAYMENT_STEPS.length - 1 ? (
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
    </div>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function loadPayments(showRefresh = false) {
    try {
      setError('');
      showRefresh ? setRefreshing(true) : setLoading(true);

      const data = await adminApi.payments();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load payments.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadPayments();
  }, []);

  const currency = payments.find((p) => p.currency)?.currency || 'UGX';

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch =
        !term ||
        [
          payment.user_email,
          payment.username,
          payment.order_slug,
          payment.phone_number,
          payment.provider,
          payment.status,
          payment.currency,
          payment.transaction_id,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const matchesProvider = !providerFilter || payment.provider === providerFilter;
      const matchesStatus = !statusFilter || payment.status === statusFilter;

      return matchesSearch && matchesProvider && matchesStatus;
    });
  }, [payments, search, providerFilter, statusFilter]);

  const summary = useMemo(() => {
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const paid = payments.filter((p) => p.status === 'PAID');
    const pending = payments.filter((p) =>
      ['PENDING', 'PROCESSING'].includes(String(p.status)),
    );
    const failed = payments.filter((p) => p.status === 'FAILED');

    return {
      total: payments.length,
      totalAmount,
      paid: paid.length,
      paidAmount: paid.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      pending: pending.length,
      pendingAmount: pending.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      failed: failed.length,
    };
  }, [payments]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));

  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, providerFilter, statusFilter, pageSize]);

  async function quickUpdate(payment: Payment, status: string) {
    try {
      setSavingId(payment.id);
      setError('');

      const updated = await adminApi.updatePayment(payment.id, {
        provider: payment.provider || 'CASH',
        status,
        transaction_id: payment.transaction_id || '',
      });

      setPayments((prev) =>
        prev.map((item) => (item.id === payment.id ? updated : item)),
      );
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to update payment.'));
    } finally {
      setSavingId(null);
    }
  }

  function resetFilters() {
    setSearch('');
    setProviderFilter('');
    setStatusFilter('');
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#127D61] to-emerald-600 px-6 py-7 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-wide">
                Payments
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight">
                Payment management
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-50">
                Monitor payment status, order payments, providers, and correct payment transitions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadPayments(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#127D61] disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-100 p-5 md:grid-cols-4">
          <SummaryCard icon={Wallet} label="Total payments" value={summary.total} detail={money(summary.totalAmount, currency)} />
          <SummaryCard icon={BadgeCheck} label="Paid" value={summary.paid} detail={money(summary.paidAmount, currency)} tone="green" />
          <SummaryCard icon={Clock3} label="Pending / processing" value={summary.pending} detail={money(summary.pendingAmount, currency)} tone="amber" />
          <SummaryCard icon={AlertTriangle} label="Failed" value={summary.failed} detail="Needs attention" tone="red" />
        </div>

        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.value;

              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-black transition ${
                    active
                      ? 'bg-[#127D61] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-5">
          <label className="xl:col-span-2">
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
              Search
            </span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Email, phone, order, transaction..."
                className="w-full bg-transparent text-sm font-semibold outline-none"
              />
            </div>
          </label>

          <label>
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
              Provider
            </span>
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="h-[46px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none"
            >
              <option value="">All providers</option>
              {PROVIDER_OPTIONS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
              Rows
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-[46px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        {error ? (
          <div className="mx-5 mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-4 p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-50 px-6 py-16 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading payments...
            </div>
          ) : paginatedPayments.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-6 py-16 text-center">
              <p className="font-black text-slate-800">No payments found</p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing filters or search.
              </p>
            </div>
          ) : (
            paginatedPayments.map((payment) => {
              const nextTransitions = getAllowedPaymentTransitions(payment.status);

              return (
                <article
                  key={payment.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-black text-slate-900">
                          {payment.username || payment.user_email || 'Customer'}
                        </h2>

                        <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(payment.status)}`}>
                          {payment.status || 'PENDING'}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                          {payment.provider || 'NO METHOD'}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                        <span>
                          Order:{' '}
                          <span className="font-black text-slate-900">
                            {payment.order_slug || '—'}
                          </span>
                        </span>

                        <span>
                          Order status:{' '}
                          <span className="font-black text-slate-900">
                            {payment.order_status || '—'}
                          </span>
                        </span>

                        <span>
                          Phone:{' '}
                          <span className="font-black text-slate-900">
                            {payment.phone_number || '—'}
                          </span>
                        </span>

                        <span>
                          Transaction:{' '}
                          <span className="font-black text-slate-900">
                            {payment.transaction_id || '—'}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 xl:text-right">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Amount
                      </p>
                      <p className="mt-1 break-words text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                        {money(payment.amount, payment.currency || currency)}
                      </p>

                      {payment.order_slug ? (
                        <Link
                          href={`/dashboard/orders/${payment.order_slug}`}
                          className="mt-3 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4" />
                          View order
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5">
                    <PaymentProgress status={payment.status} />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {nextTransitions.map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={savingId === payment.id}
                        onClick={() => quickUpdate(payment, status)}
                        className={`rounded-xl px-4 py-2.5 text-xs font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${actionClass(status)}`}
                      >
                        {savingId === payment.id ? 'Updating...' : status}
                      </button>
                    ))}

                    {!nextTransitions.length ? (
                      <span className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-500">
                        No next action
                      </span>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </div>

        {!loading && filteredPayments.length > 0 ? (
          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-500">
              Page {page} of {totalPages} • {filteredPayments.length} payment
              {filteredPayments.length === 1 ? '' : 's'}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'slate',
}: {
  icon: any;
  label: string;
  value: number;
  detail: string;
  tone?: 'slate' | 'green' | 'amber' | 'red';
}) {
  const classes = {
    slate: 'bg-slate-50 text-slate-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  };

  return (
    <div className={`rounded-2xl p-4 ${classes[tone]}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-wide">{label}</p>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-3xl font-black">{value}</p>
      <p className="mt-1 break-words text-sm font-semibold leading-tight opacity-80">{detail}</p>
    </div>
  );
}
