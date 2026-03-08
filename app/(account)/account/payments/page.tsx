'use client';

import { useEffect, useState } from 'react';
import { paymentApi } from '@/lib/api/services';
import type { Payment } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    paymentApi.list().then(setPayments).catch(() => setPayments([]));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Payments</h1>
      {payments.map((payment) => (
        <div key={payment.id} className="card space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{payment.order_slug}</p>
              <p className="text-sm text-gray-500">{payment.provider} · {payment.status}</p>
            </div>
            <strong>{formatCurrency(payment.amount)}</strong>
          </div>
          <div className="text-sm text-gray-600">
            <p>Reference: {payment.reference || 'Pending'}</p>
            <p>Currency: {payment.currency}</p>
            {payment.checkout_url ? <p className="truncate">Checkout URL: {payment.checkout_url}</p> : null}
          </div>
        </div>
      ))}
      {!payments.length ? <div className="card text-sm text-gray-500">No payments yet.</div> : null}
    </div>
  );
}


export type AuthTokens = {
  refresh: string;
  access: string;
};

export type BackendUser = {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  user_type: string;
  is_active: boolean;
  created_at: string;
};

export type AuthResponse = {
  user: BackendUser;
  tokens: AuthTokens;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
};

export type LogoutPayload = {
  refresh: string;
};

export type GoogleLoginPayload = {
  access_token: string;
};
