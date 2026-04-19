'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { CheckoutPanel } from '@/components/checkout-panel';

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Checkout
                </p>
                <h1 className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                  Checkout
                </h1>
                <p className="mt-2 text-sm text-gray-500 sm:text-base">
                  Delivery details, payment method, and order review.
                </p>
              </div>

              <div className="inline-flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold">Safe checkout</p>
                  <p className="text-xs font-medium text-emerald-600">
                    Protected order and payment flow
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CheckoutPanel />
      </section>
    </main>
  );
}