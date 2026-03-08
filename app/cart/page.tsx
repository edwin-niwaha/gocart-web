import { CheckoutPanel } from '@/components/checkout-panel';

export default function CartPage() {
  return (
    <div className="space-y-6 py-6">
      <div className="card">
        <p className="badge">Cart & checkout</p>
        <h1 className="mt-2 text-4xl font-black">Complete your purchase</h1>
        <p className="mt-2 subtle">This flow uses your backend cart items, creates an order, attaches order items, then creates shipment and payment records.</p>
      </div>
      <CheckoutPanel />
    </div>
  );
}
