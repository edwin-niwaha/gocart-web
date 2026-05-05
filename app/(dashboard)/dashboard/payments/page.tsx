'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Wallet,
  BadgeCheck,
  Clock3,
  AlertTriangle,
} from 'lucide-react';
import { adminApi, type Payment } from '@/lib/api/services';

const PROVIDER_OPTIONS = [
  'CASH',
  'STRIPE',
  'PAYSTACK',
  'FLUTTERWAVE',
  'MTN',
  'CARD',
] as const;

const STATUS_OPTIONS = [
  'PENDING',
  'PROCESSING',
  'PAID',
  'FAILED',
  'REFUNDED',
  'CANCELLED',
] as const;

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

type EditableRow = {
  provider: string;
  status: string;
  transaction_id: string;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, EditableRow>>({});
  const [error, setError] = useState<string | null>(null);

  const loadPayments = async (showRefresh = false) => {
    try {
      setError(null);
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await adminApi.payments();
      setPayments(data);

      const nextDrafts: Record<number, EditableRow> = {};
      for (const payment of data) {
        nextDrafts[payment.id] = {
          provider: payment.provider ?? '',
          status: payment.status ?? '',
          transaction_id: payment.transaction_id ?? '',
        };
      }
      setDrafts(nextDrafts);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to load payments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const parseAmount = (amount: string | number) => {
    const numeric = Number(amount);
    return Number.isNaN(numeric) ? 0 : numeric;
  };

  const currencyLabel = useMemo(() => {
    const firstCurrency = payments.find((p) => p.currency)?.currency;
    return firstCurrency || 'UGX';
  }, [payments]);

  const formatAmount = (amount: string | number, currency: string) => {
    const numeric = Number(amount);
    if (Number.isNaN(numeric)) return `${amount} ${currency}`;
    return `${numeric.toLocaleString()} ${currency}`;
  };

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
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const matchesProvider =
        !providerFilter || payment.provider === providerFilter;

      const matchesStatus =
        !statusFilter || payment.status === statusFilter;

      return matchesSearch && matchesProvider && matchesStatus;
    });
  }, [payments, search, providerFilter, statusFilter]);

  const summary = useMemo(() => {
    const totalAmount = payments.reduce(
      (sum, payment) => sum + parseAmount(payment.amount),
      0
    );

    const paidPayments = payments.filter((p) => p.status === 'PAID');
    const pendingPayments = payments.filter(
      (p) => p.status === 'PENDING' || p.status === 'PROCESSING'
    );
    const failedPayments = payments.filter((p) => p.status === 'FAILED');

    const paidAmount = paidPayments.reduce(
      (sum, payment) => sum + parseAmount(payment.amount),
      0
    );

    const pendingAmount = pendingPayments.reduce(
      (sum, payment) => sum + parseAmount(payment.amount),
      0
    );

    return {
      total: payments.length,
      totalAmount,
      paid: paidPayments.length,
      paidAmount,
      pending: pendingPayments.length,
      pendingAmount,
      failed: failedPayments.length,
    };
  }, [payments]);

  const filteredSummary = useMemo(() => {
    const totalAmount = filteredPayments.reduce(
      (sum, payment) => sum + parseAmount(payment.amount),
      0
    );

    return {
      count: filteredPayments.length,
      totalAmount,
    };
  }, [filteredPayments]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));

  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, providerFilter, statusFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const updateDraft = (
    id: number,
    key: keyof EditableRow,
    value: string
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: value,
      },
    }));
  };

  const handleSave = async (payment: Payment) => {
    const draft = drafts[payment.id];
    if (!draft) return;

    try {
      setSavingId(payment.id);

      const updated = await adminApi.updatePayment(payment.id, {
        provider: draft.provider,
        status: draft.status,
        transaction_id: draft.transaction_id || '',
      });

      setPayments((prev) =>
        prev.map((item) => (item.id === payment.id ? updated : item))
      );

      setDrafts((prev) => ({
        ...prev,
        [payment.id]: {
          provider: updated.provider ?? '',
          status: updated.status ?? '',
          transaction_id: updated.transaction_id ?? '',
        },
      }));
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update payment.');
    } finally {
      setSavingId(null);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setProviderFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const getPageRangeText = () => {
    if (filteredPayments.length === 0) return '0 of 0';
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, filteredPayments.length);
    return `${start}-${end} of ${filteredPayments.length}`;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Payments</h1>
            <p className="mt-1 text-sm text-slate-500">
              View tenant payments, monitor amounts, and update payment method or status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
              Filtered total:{' '}
              <span className="font-semibold text-slate-900">
                {formatAmount(filteredSummary.totalAmount, currencyLabel)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => loadPayments(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total payments
              </div>
              <Wallet className="h-4 w-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {summary.total}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {formatAmount(summary.totalAmount, currencyLabel)}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                Paid
              </div>
              <BadgeCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-emerald-700">
              {summary.paid}
            </div>
            <div className="mt-1 text-sm text-emerald-700/80">
              {formatAmount(summary.paidAmount, currencyLabel)}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-wide text-amber-700">
                Pending
              </div>
              <Clock3 className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-amber-700">
              {summary.pending}
            </div>
            <div className="mt-1 text-sm text-amber-700/80">
              {formatAmount(summary.pendingAmount, currencyLabel)}
            </div>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-wide text-rose-700">
                Failed
              </div>
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-rose-700">
              {summary.failed}
            </div>
            <div className="mt-1 text-sm text-rose-700/80">
              Needs attention
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Email, username, phone, order..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-4 text-sm outline-none focus:border-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Provider
            </label>
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value="">All providers</option>
              {PROVIDER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Rows
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-500">
            Showing {getPageRangeText()}
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset filters
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading payments...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-base font-medium text-slate-700">No payments found</div>
            <div className="mt-1 text-sm text-slate-500">
              Try changing the search text or filters.
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedPayments.map((payment) => {
                    const draft = drafts[payment.id] ?? {
                      provider: payment.provider ?? '',
                      status: payment.status ?? '',
                      transaction_id: payment.transaction_id ?? '',
                    };

                    const changed =
                      draft.provider !== (payment.provider ?? '') ||
                      draft.status !== (payment.status ?? '') ||
                      draft.transaction_id !== (payment.transaction_id ?? '');

                    return (
                      <tr key={payment.id} className="align-top">
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-800">
                            {payment.username || 'User'}
                          </div>
                          <div className="text-sm text-slate-500">
                            {payment.user_email || '-'}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-800">
                            {payment.order_slug || '-'}
                          </div>
                          <div className="text-xs text-slate-500">
                            Order status: {payment.order_status || '-'}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-slate-700">
                          {formatAmount(payment.amount, payment.currency)}
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-700">
                          {payment.phone_number || '-'}
                        </td>

                        <td className="px-4 py-4">
                          <select
                            value={draft.provider}
                            onChange={(e) =>
                              updateDraft(payment.id, 'provider', e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                          >
                            {PROVIDER_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-4">
                          <select
                            value={draft.status}
                            onChange={(e) =>
                              updateDraft(payment.id, 'status', e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-4">
                          <button
                            type="button"
                            disabled={!changed || savingId === payment.id}
                            onClick={() => handleSave(payment)}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingId === payment.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                Save
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
