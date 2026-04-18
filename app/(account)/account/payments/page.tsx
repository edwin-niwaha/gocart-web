'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  RefreshCw,
  Wallet,
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

/* -------------------- REUSABLE COMPONENTS -------------------- */

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`mt-2 text-2xl font-bold ${color || 'text-gray-900'}`}>
            {value}
          </p>
        </div>
        <div className="rounded-2xl bg-gray-100 p-3">{icon}</div>
      </div>
    </div>
  );
}

function PaymentCard({ payment }: { payment: Payment }) {
  return (
    <article className="rounded-3xl border bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {payment.order_slug
              ? `Order ${payment.order_slug}`
              : payment.reference}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {payment.provider}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(Number(payment.amount || 0))}
          </p>
          <p className="text-sm text-gray-500">{payment.currency}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-gray-500">Reference</p>
          <p className="font-medium">{payment.reference}</p>
        </div>

        <div>
          <p className="text-gray-500">Transaction</p>
          <p className="font-medium">{payment.transaction_id || '—'}</p>
        </div>

        <div>
          <p className="text-gray-500">Created</p>
          <p className="font-medium">{formatDate(payment.created_at)}</p>
        </div>

        <div>
          <p className="text-gray-500">Paid</p>
          <p className="font-medium">{formatDate(payment.paid_at)}</p>
        </div>
      </div>
    </article>
  );
}

/* -------------------- MAIN PAGE -------------------- */

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

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

  const stats = useMemo(() => {
    const total = payments.length;
    const paid = payments.filter(p => p.status === 'PAID').length;
    const pending = payments.filter(
      p => p.status === 'PENDING' || p.status === 'PROCESSING'
    ).length;

    const totalAmount = payments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0
    );

    return { total, paid, pending, totalAmount };
  }, [payments]);

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-7xl px-4 py-8">
        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--brand-green)]">My account</p>
            <h1 className="text-3xl font-bold">Payments</h1>
          </div>

          <button
            onClick={() => fetchPayments(true)}
            className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"
          >
            <RefreshCw className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* STATS */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
          <StatCard label="Total" value={stats.total} icon={<Wallet />} />
          <StatCard label="Paid" value={stats.paid} icon={<CheckCircle2 />} color="text-emerald-600" />
          <StatCard label="Pending" value={stats.pending} icon={<Clock3 />} color="text-amber-600" />
          <StatCard label="Total Amount" value={formatCurrency(stats.totalAmount)} icon={<CreditCard />} />
        </div>

        {/* STATES */}
        {loading ? (
          <p className="text-center text-gray-500">Loading payments...</p>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-4 text-red-600">
            <AlertCircle className="inline mr-2" />
            {error}
          </div>
        ) : payments.length === 0 ? (
          <p className="text-center text-gray-500">No payments yet</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {payments.map(payment => (
              <PaymentCard key={payment.id} payment={payment} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}