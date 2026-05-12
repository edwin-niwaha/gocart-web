'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';

import { paymentApi } from '@/lib/api/services';
import type { Payment } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

const PAYMENT_STATUSES = [
  'PAID',
  'PENDING',
  'PROCESSING',
  'FAILED',
  'REFUNDED',
  'CANCELLED',
];

function formatDate(value?: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-UG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getPaymentStatusClasses(status?: string) {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
    case 'PROCESSING':
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
    case 'FAILED':
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200';
    case 'REFUNDED':
      return 'bg-violet-50 text-violet-700 ring-1 ring-violet-200';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
  }
}

function prettifyProvider(provider?: string) {
  if (!provider) return '—';

  const labels: Record<string, string> = {
    MTN: 'MTN Mobile Money',
    CARD: 'Bank / Debit Card',
    CASH: 'Cash',
    STRIPE: 'Stripe',
    PAYSTACK: 'Paystack',
    FLUTTERWAVE: 'Flutterwave',
  };

  return labels[provider] || provider;
}

function StatCard({
  label,
  value,
  subtext,
  icon,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const tones = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 break-words text-xl font-black leading-tight text-slate-950 sm:text-2xl">
            {value}
          </p>
          {subtext ? (
            <p className="mt-1 text-sm font-medium text-slate-500">{subtext}</p>
          ) : null}
        </div>

        <div className={`rounded-2xl p-3 ${tones[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status?: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${getPaymentStatusClasses(
        status,
      )}`}
    >
      {status || 'UNKNOWN'}
    </span>
  );
}

function PaymentCard({
  payment,
  busy,
  onCheckStatus,
  onFinalize,
}: {
  payment: Payment;
  busy?: boolean;
  onCheckStatus: (payment: Payment) => void;
  onFinalize: (payment: Payment) => void;
}) {
  const canCheckStatus =
    payment.provider === 'MTN' &&
    ['PENDING', 'PROCESSING'].includes(String(payment.status));

  const canFinalize = payment.status === 'PAID' && !payment.order_slug;

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <PaymentStatusBadge status={payment.status} />

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">
              {prettifyProvider(payment.provider)}
            </span>
          </div>

          <h2 className="mt-3 truncate text-lg font-black text-slate-950">
            {payment.order_slug
              ? `Order ${payment.order_slug}`
              : payment.reference}
          </h2>

          <p className="mt-1 break-all text-sm font-medium text-slate-500">
            Ref: {payment.reference}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="break-words text-base font-black leading-tight text-slate-950 sm:text-lg">
            {formatCurrency(Number(payment.amount || 0))}
          </p>
          <p className="text-xs font-bold text-slate-400">
            {payment.currency || 'UGX'}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Transaction
          </p>
          <p className="mt-1 break-all font-bold text-slate-800">
            {payment.transaction_id || '—'}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Created
          </p>
          <p className="mt-1 font-bold text-slate-800">
            {formatDate(payment.created_at)}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Paid At
          </p>
          <p className="mt-1 font-bold text-slate-800">
            {formatDate(payment.paid_at)}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Order
          </p>
          <p className="mt-1 font-bold text-slate-800">
            {payment.order_slug || 'Not created'}
          </p>
        </div>
      </div>

      {canCheckStatus || canFinalize ? (
        <div className="mt-5 flex flex-wrap gap-3">
          {canCheckStatus ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onCheckStatus(payment)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Check status
            </button>
          ) : null}

          {canFinalize ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onFinalize(payment)}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#127D61] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Create order
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyReference, setBusyReference] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');

  const fetchPayments = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);

      setError('');
      const data = await paymentApi.list();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setPayments([]);
      setError(err?.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const providerOptions = useMemo(() => {
    return Array.from(
      new Set(payments.map((payment) => payment.provider).filter(Boolean)),
    );
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch =
        !term ||
        [
          payment.reference,
          payment.order_slug,
          payment.provider,
          payment.status,
          payment.transaction_id,
          payment.currency,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const matchesStatus = !statusFilter || payment.status === statusFilter;
      const matchesProvider =
        !providerFilter || payment.provider === providerFilter;

      return matchesSearch && matchesStatus && matchesProvider;
    });
  }, [payments, search, statusFilter, providerFilter]);

  const stats = useMemo(() => {
    const total = filteredPayments.length;
    const paid = filteredPayments.filter((p) => p.status === 'PAID').length;
    const pending = filteredPayments.filter((p) =>
      ['PENDING', 'PROCESSING'].includes(String(p.status)),
    ).length;
    const failed = filteredPayments.filter((p) => p.status === 'FAILED').length;

    const totalAmount = filteredPayments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );

    return { total, paid, pending, failed, totalAmount };
  }, [filteredPayments]);

  const hasFilters = Boolean(search || statusFilter || providerFilter);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setProviderFilter('');
  };

  const checkPaymentStatus = useCallback(async (payment: Payment) => {
    try {
      setBusyReference(payment.reference);
      setError('');

      const status = await paymentApi.checkStatus(payment.reference);

      setPayments((prev) =>
        prev.map((item) =>
          item.reference === payment.reference
            ? {
                ...item,
                status: status.status as Payment['status'],
                transaction_id: status.transaction_id ?? item.transaction_id,
                paid_at: status.paid_at ?? item.paid_at,
                provider_response:
                  status.provider_response ?? item.provider_response,
              }
            : item,
        ),
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to check payment status.');
    } finally {
      setBusyReference(null);
    }
  }, []);

  const finalizePaymentOrder = useCallback(
    async (payment: Payment) => {
      try {
        setBusyReference(payment.reference);
        setError('');

        await paymentApi.finalizeOrder(payment.reference);
        await fetchPayments(true);
      } catch (err: any) {
        setError(err?.message || 'Failed to create order for this payment.');
      } finally {
        setBusyReference(null);
      }
    },
    [fetchPayments],
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="mb-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#127D61] p-6 text-white sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-white/80 ring-1 ring-white/15">
                  <Wallet className="h-4 w-4" />
                  Payments Center
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                  Payments
                </h1>

                <p className="mt-2 max-w-2xl text-sm font-medium text-white/70">
                  Monitor payment history, verify mobile money transactions,
                  and create orders from successful payments.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
                  <p className="text-xs font-bold uppercase tracking-wide text-white/60">
                    Total Value
                  </p>
                  <p className="mt-1 break-words text-lg font-black leading-tight sm:text-xl">
                    {formatCurrency(stats.totalAmount)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fetchPayments(true)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Payments"
              value={stats.total}
              subtext="Matching current filters"
              icon={<Wallet className="h-5 w-5" />}
            />

            <StatCard
              label="Paid"
              value={stats.paid}
              subtext="Completed transactions"
              icon={<CheckCircle2 className="h-5 w-5" />}
              tone="success"
            />

            <StatCard
              label="Pending"
              value={stats.pending}
              subtext="Awaiting confirmation"
              icon={<Clock3 className="h-5 w-5" />}
              tone="warning"
            />

            <StatCard
              label="Failed"
              value={stats.failed}
              subtext="Need attention"
              icon={<XCircle className="h-5 w-5" />}
              tone="danger"
            />
          </div>
        </div>

        <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Filter payments
              </h2>
              <p className="text-sm font-medium text-slate-500">
                Search by reference, order, provider, status, or transaction ID.
              </p>
            </div>

            <div className="hidden rounded-2xl bg-slate-100 p-3 text-slate-500 sm:block">
              <Filter className="h-5 w-5" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Reference, order, provider, status..."
                  className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#127D61] focus:ring-4 focus:ring-[#127D61]/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#127D61] focus:ring-4 focus:ring-[#127D61]/10"
              >
                <option value="">All statuses</option>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-400">
                Provider
              </label>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#127D61] focus:ring-4 focus:ring-[#127D61]/10"
              >
                <option value="">All providers</option>
                {providerOptions.map((provider) => (
                  <option key={provider} value={provider}>
                    {prettifyProvider(provider)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-500">
              Showing{' '}
              <span className="font-black text-slate-900">
                {filteredPayments.length}
              </span>{' '}
              payment{filteredPayments.length === 1 ? '' : 's'}
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  <X className="h-4 w-4" />
                  Reset
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            <AlertCircle className="mr-2 inline h-4 w-4" />
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Loader2 className="mx-auto mb-4 h-7 w-7 animate-spin text-[#127D61]" />
            <p className="text-sm font-black text-slate-700">
              Loading payments...
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Please wait while we fetch the latest transactions.
            </p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100">
              <CreditCard className="h-7 w-7 text-slate-500" />
            </div>

            <h2 className="mt-5 text-xl font-black text-slate-950">
              No payments found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500">
              {hasFilters
                ? 'No payments match your current filters. Reset filters or try another search term.'
                : 'Payments will appear here after customers complete checkout.'}
            </p>

            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#127D61] px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:opacity-95"
              >
                <X className="h-4 w-4" />
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredPayments.map((payment) => (
              <PaymentCard
                key={payment.id || payment.reference}
                payment={payment}
                busy={busyReference === payment.reference}
                onCheckStatus={checkPaymentStatus}
                onFinalize={finalizePaymentOrder}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
