'use client';

import Link from 'next/link';
import { Heart, ShoppingCart } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatCurrency, getImage } from '@/lib/utils';
import { cartApi, wishlistApi } from '@/lib/api/services';

export function ProductCard({ product }: { product: Product }) {
  async function handleAddToCart() {
    try { await cartApi.addItem({ product_id: product.id, quantity: 1 }); } catch {}
  }
  async function handleAddToWishlist() {
    try { await wishlistApi.addItem({ product_id: product.id }); } catch {}
  }

  return (
    <div className="card space-y-3 overflow-hidden">
      <img src={getImage(product.hero_image, product.image_urls)} alt={product.title} className="h-56 w-full rounded-2xl object-cover" />
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-green)]">{product.category?.name}</p>
        <h3 className="text-lg font-bold">{product.title}</h3>
        <p className="line-clamp-2 text-sm subtle">{product.description}</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-extrabold">{formatCurrency(product.price)}</span>
        <span className={`badge ${product.is_in_stock ? '' : 'opacity-70'}`}>{product.is_in_stock ? 'In stock' : 'Out of stock'}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={handleAddToCart} className="btn flex-1"><ShoppingCart size={16} /> Add</button>
        <button onClick={handleAddToWishlist} className="btn btn-secondary"><Heart size={16} /></button>
        <Link href={`/products/${product.slug}`} className="btn btn-accent">Details</Link>
      </div>
    </div>
  );
}
