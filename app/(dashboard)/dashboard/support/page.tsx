'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Inbox,
  Loader2,
  Mail,
  RefreshCcw,
  Search,
  User,
} from 'lucide-react';

import { adminApi, getApiErrorMessage } from '@/lib/api/services';
import type { SupportMessage } from '@/lib/types';

const STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED'] as const;

const statusStyles: Record<string, string> = {
  NEW: 'bg-blue-50 text-blue-700 ring-blue-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 ring-amber-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

const activeStatusStyles: Record<string, string> = {
  NEW: 'bg-blue-600 text-white',
  IN_PROGRESS: 'bg-amber-500 text-white',
  RESOLVED: 'bg-[#127D61] text-white',
};

function formatStatus(status?: string) {
  return String(status || 'NEW').replace(/_/g, ' ');
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function matchesSearch(item: any, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [item.name, item.email, item.subject, item.message, item.status]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(q);
}

export default function SupportPage() {
  const [items, setItems] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function load(showRefresh = false) {
    setError('');

    try {
      showRefresh ? setRefreshing(true) : setLoading(true);

      const data = await adminApi.supportMessages();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load support inbox.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item: any) => {
      const matchesStatus = !statusFilter || item.status === statusFilter;
      return matchesStatus && matchesSearch(item, search);
    });
  }, [items, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      new: items.filter((item: any) => item.status === 'NEW').length,
      progress: items.filter((item: any) => item.status === 'IN_PROGRESS').length,
      resolved: items.filter((item: any) => item.status === 'RESOLVED').length,
    };
  }, [items]);

  async function updateStatus(id: number, status: string) {
    try {
      setUpdatingId(id);
      setError('');

      await adminApi.updateSupportMessage(id, { status: status as any });
      await load(true);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to update support message.'));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#127D61] to-emerald-600 px-6 py-7 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-wide">
                Support inbox
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight">
                Customer support
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-50">
                Track, prioritize, and resolve customer messages from one professional workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void load(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#127D61] disabled:opacity-60"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh inbox
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-100 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Inbox} label="Total messages" value={stats.total} />
          <StatCard icon={AlertCircle} label="New" value={stats.new} tone="blue" />
          <StatCard icon={Clock3} label="In progress" value={stats.progress} tone="amber" />
          <StatCard icon={CheckCircle2} label="Resolved" value={stats.resolved} tone="green" />
        </div>

        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, subject, message, or status..."
                className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>

            <div className="flex gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('')}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-black ${
                  statusFilter === ''
                    ? 'bg-[#127D61] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>

              {STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-black ${
                    statusFilter === status
                      ? activeStatusStyles[status]
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {formatStatus(status)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <div className="mx-5 mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-4 p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-50 px-6 py-16 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading support messages...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <Mail className="mx-auto h-10 w-10 text-slate-400" />
              <h2 className="mt-4 text-lg font-black text-slate-900">
                No support messages found
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                New customer messages or matching search results will appear here.
              </p>
            </div>
          ) : (
            filteredItems.map((item: any) => (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-black uppercase text-[#127D61]">
                        {item.name?.slice(0, 1) || <User className="h-5 w-5" />}
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-black text-slate-900">
                          {item.name || 'Unknown customer'}
                        </h2>
                        <p className="truncate text-sm font-semibold text-slate-500">
                          {item.email || 'No email'}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${
                          statusStyles[item.status] || 'bg-slate-100 text-slate-700 ring-slate-200'
                        }`}
                      >
                        {formatStatus(item.status)}
                      </span>
                    </div>

                    {item.subject ? (
                      <p className="mt-4 text-sm font-black text-slate-900">
                        Subject: {item.subject}
                      </p>
                    ) : null}

                    <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {item.message || 'No message provided.'}
                    </p>

                    <p className="mt-3 text-xs font-semibold text-slate-400">
                      Created: {formatDate(item.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    {STATUSES.map((status) => {
                      const active = item.status === status;
                      const disabled = updatingId === item.id || active;

                      return (
                        <button
                          key={status}
                          type="button"
                          disabled={disabled}
                          onClick={() => updateStatus(item.id, status)}
                          className={`rounded-2xl px-4 py-2.5 text-xs font-black uppercase tracking-wide shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            active
                              ? activeStatusStyles[status]
                              : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#127D61]'
                          }`}
                        >
                          {updatingId === item.id && !active
                            ? 'Updating...'
                            : formatStatus(status)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'slate',
}: {
  icon: any;
  label: string;
  value: number;
  tone?: 'slate' | 'blue' | 'amber' | 'green';
}) {
  const classes = {
    slate: 'bg-slate-50 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <div className={`rounded-2xl p-4 ${classes[tone]}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-wide">{label}</p>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </div>
  );
}