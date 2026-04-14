'use client';

import { useEffect, useState } from 'react';
import { cartApi } from '@/lib/api/services';
import type { CartItem } from '@/lib/types';
import { CheckoutPanel } from '@/components/checkout-panel';

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cartApi
      .listItems()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 py-6">
        <div className="card">
          <p className="badge">Cart</p>
          <h1 className="mt-2 text-4xl font-black">Your cart</h1>
          <p className="mt-2 subtle">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="space-y-6 py-6">
        <div className="card text-center">
          <p className="badge">Cart</p>
          <h1 className="mt-2 text-4xl font-black">Your cart is empty</h1>
          <p className="mt-2 subtle">
            Add products from the shop to start checkout.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <div className="card">
        <p className="badge">Cart & checkout</p>
        <h1 className="mt-2 text-4xl font-black">Complete your purchase</h1>
        <p className="mt-2 subtle">
          Select a delivery address, choose your payment method, and complete your order.
        </p>
      </div>

      <CheckoutPanel />
    </div>
  );
}