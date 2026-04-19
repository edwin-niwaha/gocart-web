'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  RefreshCw,
  Search,
  Wallet,
  XCircle,
} from 'lucide-react';
import { paymentApi } from '@/lib/api/services';
import type { Payment } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

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
    AIRTEL: 'Airtel Money',
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
  color,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className={`mt-1 text-xl font-bold ${color || 'text-slate-900'}`}>
            {value}
          </p>
          {subtext ? (
            <p className="mt-1 text-xs text-slate-500">{subtext}</p>
          ) : null}
        </div>

        <div className="rounded-xl bg-slate-100 p-2 text-slate-600">{icon}</div>
      </div>
    </div>
  );
}

function PaymentCard({ payment }: { payment: Payment }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              {payment.order_slug ? `Order ${payment.order_slug}` : payment.reference}
            </h2>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStatusClasses(
                payment.status
              )}`}
            >
              {payment.status}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {prettifyProvider(payment.provider)}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xl font-bold text-slate-900">
            {formatCurrency(Number(payment.amount || 0))}
          </p>
          <p className="text-sm text-slate-500">{payment.currency}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-slate-500">Reference</p>
          <p className="font-medium text-slate-900 break-all">{payment.reference}</p>
        </div>

        <div>
          <p className="text-slate-500">Transaction ID</p>
          <p className="font-medium text-slate-900 break-all">
            {payment.transaction_id || '—'}
          </p>
        </div>

        <div>
          <p className="text-slate-500">Created</p>
          <p className="font-medium text-slate-900">{formatDate(payment.created_at)}</p>
        </div>

        <div>
          <p className="text-slate-500">Paid at</p>
          <p className="font-medium text-slate-900">{formatDate(payment.paid_at)}</p>
        </div>
      </div>
    </article>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

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
      new Set(payments.map((payment) => payment.provider).filter(Boolean))
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
      const matchesProvider = !providerFilter || payment.provider === providerFilter;

      return matchesSearch && matchesStatus && matchesProvider;
    });
  }, [payments, search, statusFilter, providerFilter]);

  const stats = useMemo(() => {
    const total = filteredPayments.length;
    const paid = filteredPayments.filter((p) => p.status === 'PAID').length;
    const pending = filteredPayments.filter(
      (p) => p.status === 'PENDING' || p.status === 'PROCESSING'
    ).length;
    const failed = filteredPayments.filter((p) => p.status === 'FAILED').length;

    const totalAmount = filteredPayments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );

    return { total, paid, pending, failed, totalAmount };
  }, [filteredPayments]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setProviderFilter('');
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--brand-green)]">My account</p>
            <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
            <p className="mt-1 text-sm text-slate-500">
              Track your payment history, status, and total spending.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
              Total amount:{' '}
              <span className="font-semibold text-slate-900">
                {formatCurrency(stats.totalAmount)}
              </span>
            </div>

            <button
              onClick={() => fetchPayments(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
            <div className="min-w-[220px] flex-1">
              <StatCard
                label="Total payments"
                value={stats.total}
                icon={<Wallet className="h-5 w-5" />}
              />
            </div>

            <div className="min-w-[220px] flex-1">
              <StatCard
                label="Paid"
                value={stats.paid}
                subtext="Completed payments"
                icon={<CheckCircle2 className="h-5 w-5" />}
                color="text-emerald-600"
              />
            </div>

            <div className="min-w-[220px] flex-1">
              <StatCard
                label="Pending"
                value={stats.pending}
                subtext="Awaiting confirmation"
                icon={<Clock3 className="h-5 w-5" />}
                color="text-amber-600"
              />
            </div>

            <div className="min-w-[220px] flex-1">
              <StatCard
                label="Failed"
                value={stats.failed}
                subtext="Need attention"
                icon={<XCircle className="h-5 w-5" />}
                color="text-rose-600"
              />
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Reference, order, provider, status..."
                  className="w-full rounded-2xl border border-slate-300 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              >
                <option value="">All statuses</option>
                <option value="PAID">PAID</option>
                <option value="PENDING">PENDING</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="FAILED">FAILED</option>
                <option value="REFUNDED">REFUNDED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Provider
              </label>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
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

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-700">{filteredPayments.length}</span>{' '}
              payment{filteredPayments.length === 1 ? '' : 's'}
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
            Loading payments...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            <AlertCircle className="mr-2 inline h-4 w-4" />
            {error}
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <CreditCard className="h-6 w-6 text-slate-500" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No payments found
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your filters, or check back after you place an order.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredPayments.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}