'use client';

import { useEffect, useState } from 'react';
import { cartApi, catalogApi, wishlistApi } from '@/lib/api/services';
import type { Product, Review } from '@/lib/types';
import { formatCurrency, getImage } from '@/lib/utils';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    (async () => {
      const p = await catalogApi.product(params.slug);
      setProduct(p);
      setReviews(await catalogApi.reviews(p.id));
    })();
  }, [params.slug]);

  if (!product) return <div>Loading...</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <img src={getImage(product.hero_image, product.image_urls)} alt={product.title} className="w-full rounded-2xl border object-cover" />
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{product.title}</h1>
        <p className="text-gray-600">{product.description}</p>
        <p className="text-2xl font-semibold">{formatCurrency(product.price)}</p>
        <div className="flex gap-3">
          <input className="input max-w-24" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          <button className="btn" onClick={() => cartApi.addItem({ product_id: product.id, quantity })}>Add to cart</button>
          <button className="btn btn-secondary" onClick={() => wishlistApi.addItem({ product_id: product.id })}>Wishlist</button>
        </div>
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Reviews</h2>
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-xl border p-3">
                <p className="font-medium">{review.user?.username} · {review.rating}/5</p>
                <p className="text-sm text-gray-600">{review.comment}</p>
              </div>
            ))}
            {!reviews.length ? <p className="text-sm text-gray-500">No reviews yet.</p> : null}
          </div>
        </div>
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
