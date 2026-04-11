'use client';

import { useEffect, useMemo, useState } from 'react';
import { addressApi, cartApi, orderApi, shippingApi } from '@/lib/api/services';
import type { Address, CartItem, ShippingMethod } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export function CheckoutPanel() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | ''>('');
  const [selectedMethod, setSelectedMethod] = useState<number | ''>('');
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    cartApi.listItems().then(setItems).catch(() => setItems([]));
    addressApi.list().then((data) => {
      setAddresses(data);
      const fallback = data.find((item) => item.is_default) || data[0];
      if (fallback) setSelectedAddress(fallback.id);
    }).catch(() => setAddresses([]));
    shippingApi.methods().then((data) => {
      const active = data.filter((item) => item.is_active);
      setMethods(active);
      if (active[0]) setSelectedMethod(active[0].id);
    }).catch(() => setMethods([]));
  }, []);

  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.line_total || 0), 0), [items]);

  async function placeOrder() {
    if (!items.length) return setMessage('Add products to cart first.');
    if (!selectedAddress) return setMessage('Select a delivery address first.');
    setPlacing(true);
    setMessage('');
    try {
      const order = await orderApi.checkout({
        address_id: Number(selectedAddress),
        shipping_method_id: selectedMethod ? Number(selectedMethod) : undefined,
        payment_method: 'MANUAL',
      });
      setMessage(`Order ${order.slug} created successfully.`);
      setItems([]);
    } catch {
      setMessage('We could not complete checkout. Confirm you are logged in and have a valid address.');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="card space-y-4">
      <div>
        <p className="badge">Checkout</p>
        <h2 className="mt-2 text-2xl font-black">Place your order online</h2>
      </div>
      <div className="space-y-3 text-sm">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 p-3">
            <div>
              <p className="font-bold">{item.product.title}</p>
              <p className="subtle">Qty {item.quantity}</p>
            </div>
            <p className="font-bold">{formatCurrency(item.line_total)}</p>
          </div>
        ))}
        {!items.length ? <p className="subtle">Your cart is empty.</p> : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <select className="select" value={selectedAddress} onChange={(e) => setSelectedAddress(Number(e.target.value))}>
          <option value="">Select address</option>
          {addresses.map((address) => <option key={address.id} value={address.id}>{address.label} · {address.city}</option>)}
        </select>
        <select className="select" value={selectedMethod} onChange={(e) => setSelectedMethod(Number(e.target.value))}>
          <option value="">Select shipping method</option>
          {methods.map((method) => <option key={method.id} value={method.id}>{method.name} · {formatCurrency(method.fee)}</option>)}
        </select>
      </div>
      <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
        <span className="font-semibold">Estimated total</span>
        <span className="text-2xl font-black">{formatCurrency(total)}</span>
      </div>
      {message ? <p className="text-sm font-medium text-[var(--brand-green)]">{message}</p> : null}
      <button onClick={placeOrder} disabled={placing} className="btn btn-accent w-full">{placing ? 'Processing…' : 'Checkout now'}</button>
    </div>
  );
}
