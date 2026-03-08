'use client';

import { useEffect, useState } from 'react';
import { shippingApi } from '@/lib/api/services';
import type { Shipment } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);

  useEffect(() => {
    shippingApi.shipments().then(setShipments).catch(() => setShipments([]));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Shipments</h1>
      {shipments.map((shipment) => (
        <div key={shipment.id} className="card space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{shipment.order_slug}</p>
              <p className="text-sm text-gray-500">{shipment.shipping_method_name} · {shipment.status}</p>
            </div>
            <strong>{formatCurrency(shipment.shipping_fee)}</strong>
          </div>
          <div className="text-sm text-gray-600">
            <p>Tracking: {shipment.tracking_number || 'Not assigned'}</p>
            <p>Address ID: {shipment.address}</p>
          </div>
        </div>
      ))}
      {!shipments.length ? <div className="card text-sm text-gray-500">No shipments yet.</div> : null}
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
