'use client';

import { useEffect, useState } from 'react';
import { orderApi } from '@/lib/api/services';
import type { Order } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.list().then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="inline-flex rounded-full bg-[#127D61]/10 px-3 py-1 text-sm font-bold text-[#127D61]">Orders</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">Your orders</h1>
        <p className="mt-2 text-slate-600">Track status, review totals, and confirm the items in each order.</p>
      </div>

      {loading ? <div className="card">Loading orders…</div> : null}
      {!loading && !orders.length ? (
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
                <p className="mt-1 text-sm text-slate-500">Status: <span className="font-semibold">{order.status}</span> · {order.items.length} items</p>
              </div>
              <p className="text-2xl font-black text-[#127D61]">{formatCurrency(order.total_price)}</p>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="font-bold text-slate-900">Order note</p>
              <p className="mt-2 text-sm text-slate-600">{order.description || 'No order note attached.'}</p>
            </div>

            <div className="mt-5 space-y-3">
              <p className="font-bold text-slate-900">Items</p>
              {order.items.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.product_title}</p>
                    <p className="text-sm text-slate-500">Qty {item.quantity} · Unit {formatCurrency(item.unit_price)} · Line {formatCurrency(item.line_total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
