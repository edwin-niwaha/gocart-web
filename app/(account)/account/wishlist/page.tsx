'use client';

import { useEffect, useState } from 'react';
import { wishlistApi } from '@/lib/api/services';
import type { Wishlist } from '@/lib/types';

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  useEffect(() => { wishlistApi.getOrCreate().then(setWishlist).catch(() => setWishlist(null)); }, []);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Wishlist</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {wishlist?.items?.map((item) => (
          <div key={item.id} className="card">
            <p className="font-semibold">{item.product.title}</p>
            <p className="text-sm text-gray-500">{item.product.slug}</p>
          </div>
        ))}
      </div>
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
