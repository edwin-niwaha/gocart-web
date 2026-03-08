'use client';

import { useEffect, useState } from 'react';
import { addressApi } from '@/lib/api/services';
import type { Address } from '@/lib/types';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    addressApi.list().then(setAddresses).catch(() => setAddresses([]));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Addresses</h1>
      {addresses.map((address) => (
        <div key={address.id} className="card space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{address.label}</p>
              <p className="text-sm text-gray-500">{address.city}, {address.country}</p>
            </div>
            {address.is_default ? <span className="rounded-full bg-black px-3 py-1 text-xs text-white">Default</span> : null}
          </div>
          <div className="text-sm text-gray-600">
            <p>{address.address_line1}</p>
            {address.address_line2 ? <p>{address.address_line2}</p> : null}
            <p>{address.state} {address.postal_code}</p>
            <p>{address.phone_number}</p>
          </div>
        </div>
      ))}
      {!addresses.length ? <div className="card text-sm text-gray-500">No saved addresses yet.</div> : null}
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
