'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api/services';
import type { SupportMessage } from '@/lib/types';

const STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED'];

export default function SupportPage() {
  const [items, setItems] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => { void load(); }, []);

  const updateStatus = async (id: number, status: string) => {
    await adminApi.updateSupportMessage(id, { status: status as any });
    await load();
  };

  return (
    <div className="space-y-6 py-6">
      <div className="card">
        <p className="badge">Support inbox</p>
        <h1 className="mt-3 text-3xl font-black">Customer support</h1>
        <p className="mt-2 subtle">Track and resolve tenant-specific support messages.</p>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {loading ? <div className="card text-slate-500">Loading support messages…</div> : null}

      <div className="space-y-4">
        {items.map((item: any) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-sm text-slate-500">{item.name} • {item.email}</div>
                <p className="mt-2 text-base text-slate-800">{item.message}</p>
                <p className="mt-3 text-xs text-slate-400">Created {new Date(item.created_at).toLocaleString()}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <button key={status} type="button" onClick={() => updateStatus(item.id, status)} className={`rounded-xl px-3 py-2 text-sm font-semibold ${item.status === status ? 'bg-[#127D61] text-white' : 'border border-slate-200 text-slate-700'}`}>
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
        {!loading && !items.length ? <div className="card text-slate-500">No support messages yet.</div> : null}
      </div>
    </div>
  );
}
