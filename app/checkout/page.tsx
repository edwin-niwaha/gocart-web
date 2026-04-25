'use client';

import { CheckoutPanel } from '@/components/checkout-panel';
import { canUseStorefrontShopping } from '@/lib/auth/roles';
import { CustomerSessionRequired } from '@/components/storefront/customer-session-required';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function CheckoutPage() {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const canShop = canUseStorefrontShopping(user);

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm text-gray-500">Loading checkout...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!canShop) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <CustomerSessionRequired
            title="Checkout is only available for customer shopping sessions."
            description="Store management accounts now stay out of the customer checkout flow so tenant staff and storefront customers do not share cart context."
          />
        </section>
      </main>
    );
  }

  return <CheckoutPanel />;
}