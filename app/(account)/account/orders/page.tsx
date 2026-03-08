'use client';

import { useEffect, useState } from 'react';
import { Pencil, Save, Trash2 } from 'lucide-react';
import { orderApi } from '@/lib/api/services';
import type { Order } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function loadOrders() {
    const data = await orderApi.list().catch(() => []);
    setOrders(data);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function saveDescription(slug: string) {
    setBusy(slug);
    await orderApi.update(slug, { description }).catch(() => null);
    setEditingSlug(null);
    setBusy(null);
    loadOrders();
  }

  async function removeItem(itemId: number) {
    setBusy(String(itemId));
    await orderApi.removeItem(itemId).catch(() => null);
    setBusy(null);
    loadOrders();
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="inline-flex rounded-full bg-[#127D61]/10 px-3 py-1 text-sm font-bold text-[#127D61]">Orders</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">Manage your orders</h1>
        <p className="mt-2 text-slate-600">
          Review order status, update order notes, and manage items from your account.
        </p>
      </div>

      {!orders.length ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-slate-500">
          No orders yet. Place an order from the shop to see it here.
        </div>
      ) : null}

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-black text-slate-900">{order.slug}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Status: <span className="font-semibold">{order.status}</span> · {order.items.length} items
                </p>
              </div>
              <p className="text-2xl font-black text-[#127D61]">{formatCurrency(order.total_price)}</p>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-bold text-slate-900">Order note</p>
                {editingSlug === order.slug ? null : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSlug(order.slug);
                      setDescription(order.description || '');
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                )}
              </div>

              {editingSlug === order.slug ? (
                <div className="space-y-3">
                  <textarea
                    className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#127D61]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add delivery notes or extra instructions"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveDescription(order.slug)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#127D61] px-4 py-2 font-bold text-white"
                    >
                      <Save size={16} />
                      {busy === order.slug ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSlug(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600">{order.description || 'No order note yet.'}</p>
              )}
            </div>

            <div className="mt-5 space-y-3">
              <p className="font-bold text-slate-900">Items</p>
              {order.items.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.product_title}</p>
                    <p className="text-sm text-slate-500">
                      Qty {item.quantity} · Unit {formatCurrency(item.unit_price)} · Line {formatCurrency(item.line_total)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700"
                  >
                    <Trash2 size={16} />
                    {busy === String(item.id) ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
