'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/lib/api/services';
import type { SupportMessage } from '@/lib/types';

const STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED'] as const;

const statusStyles: Record<string, string> = {
  NEW: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const activeStatusStyles: Record<string, string> = {
  NEW: 'bg-blue-600 text-white border-blue-600 shadow-blue-100',
  IN_PROGRESS: 'bg-amber-500 text-white border-amber-500 shadow-amber-100',
  RESOLVED: 'bg-[#127D61] text-white border-[#127D61] shadow-emerald-100',
};

export default function SupportPage() {
  const [items, setItems] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      setItems(await adminApi.supportMessages());
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load support inbox.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: items.length,
      new: items.filter((item: any) => item.status === 'NEW').length,
      progress: items.filter((item: any) => item.status === 'IN_PROGRESS').length,
      resolved: items.filter((item: any) => item.status === 'RESOLVED').length,
    };
  }, [items]);

  const updateStatus = async (id: number, status: string) => {
    try {
      setUpdatingId(id);
      await adminApi.updateSupportMessage(id, { status: status as any });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to update support message.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen space-y-8 py-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-[#0f6f57] via-[#127D61] to-[#0b3f33] p-6 text-white shadow-xl shadow-emerald-900/10 md:p-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 left-20 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-50">
              Support inbox
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              Customer support
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/90 md:text-base">
              Track, prioritize, and resolve tenant-specific support messages from one clean workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#127D61] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-emerald-50"
          >
            Refresh inbox
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Total messages', stats.total],
          ['New', stats.new],
          ['In progress', stats.progress],
          ['Resolved', stats.resolved],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          Loading support messages…
        </div>
      ) : null}

      <section className="space-y-4">
        {items.map((item: any) => (
          <article
            key={item.id}
            className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
          >
            <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between md:p-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-black uppercase text-[#127D61]">
                    {item.name?.slice(0, 1) || 'U'}
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">{item.name || 'Unknown customer'}</h2>
                    <p className="text-sm text-slate-500">{item.email}</p>
                  </div>
                </div>

                <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {item.message}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>
                    Created {new Date(item.created_at).toLocaleString()}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 font-bold ${
                      statusStyles[item.status] || 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {item.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                {STATUSES.map((status) => {
                  const active = item.status === status;
                  const disabled = updatingId === item.id;

                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={disabled}
                      onClick={() => updateStatus(item.id, status)}
                      className={`rounded-2xl border px-4 py-2 text-xs font-black uppercase tracking-wide shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${
                        active
                          ? activeStatusStyles[status]
                          : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#127D61]'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>
          </article>
        ))}

        {!loading && !items.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-50 text-2xl">
              ✉️
            </div>
            <h2 className="mt-4 text-lg font-black text-slate-900">No support messages yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              New customer messages will appear here once they are submitted.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}