'use client';

import Link from 'next/link';
import { Heart, ShoppingCart, Star, Eye, ImageIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { canUseStorefrontShopping } from '@/lib/auth/roles';
import type { Product } from '@/lib/types';
import { useAuthStore } from '@/lib/stores/auth-store';
import { formatCurrency } from '@/lib/utils';
import { cartApi, wishlistApi } from '@/lib/api/services';
import { showError, showInfo, showSuccess } from '@/lib/toast';

const FALLBACK_IMAGE =
  'https://via.placeholder.com/400x300.png?text=Product';

function renderStars(rating: number) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-slate-300'
          }
        />
      ))}
    </div>
  );
}

function getErrorMessage(error: any, fallback: string) {
  const data = error?.response?.data;

  if (typeof data === 'string') return data;
  if (data?.detail) return String(data.detail);
  if (data?.message) return String(data.message);

  if (typeof data === 'object' && data !== null) {
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return String(firstValue[0]);
    }
    if (typeof firstValue === 'string') {
      return firstValue;
    }
  }

  return fallback;
}

function toAbsoluteImageUrl(url?: string | null) {
  if (!url) return null;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    '';

  if (!base) return url;

  return `${base.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
}

function resolveProductImage(product: any) {
  const raw =
    product?.hero_image ||
    product?.image_urls?.[0] ||
    product?.image ||
    product?.image_url ||
    product?.thumbnail ||
    product?.thumbnail_url ||
    product?.featured_image ||
    product?.featured_image_url ||
    product?.photo ||
    product?.photo_url ||
    product?.product_image ||
    product?.product_image_url ||
    null;

  return toAbsoluteImageUrl(raw);
}

export function ProductCard({ product }: { product: Product }) {
  const user = useAuthStore((state) => state.user);
  const safePrice = Number(product?.base_price ?? (product as any)?.price ?? 0);
  const rating = Number((product as any)?.average_rating ?? 0);
  const reviews = Number((product as any)?.total_reviews ?? 0);
  const canShop = canUseStorefrontShopping(user);

  const [addingCart, setAddingCart] = useState(false);
  const [addingWishlist, setAddingWishlist] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageError, setImageError] = useState(false);

  const firstAvailableVariant = useMemo(
    () =>
      product?.variants?.find(
        (variant: any) => variant.is_active && Number(variant.stock_quantity) > 0
      ),
    [product]
  );

  const resolvedImage = resolveProductImage(product);
  const imageSrc = !imageError && resolvedImage ? resolvedImage : FALLBACK_IMAGE;
  const hasImage = !imageError && Boolean(resolvedImage);

  async function handleAddToCart() {
    try {
      if (!canShop) {
        showInfo(
          'Store management accounts cannot use the customer cart. Open the dashboard or sign in with a customer account to shop.'
        );
        return;
      }

      if (!firstAvailableVariant) {
        showError('This product is currently unavailable.');
        return;
      }

      setAddingCart(true);

      await cartApi.addItem({
        variant_id: (firstAvailableVariant as any).id,
        quantity: 1,
        product,
        variant: firstAvailableVariant,
      });

      showSuccess('Added to cart');
    } catch (error: any) {
      showError(getErrorMessage(error, 'Failed to add item to cart.'));
    } finally {
      setAddingCart(false);
    }
  }

  async function handleToggleWishlist() {
    try {
      setAddingWishlist(true);

      if (isWishlisted) {
        showInfo('Already in wishlist');
        return;
      }

      await wishlistApi.addItem({
        product_id: product.id,
      });

      setIsWishlisted(true);
      showSuccess('Added to wishlist');
    } catch (error: any) {
      showError(getErrorMessage(error, 'Failed to update wishlist.'));
    } finally {
      setAddingWishlist(false);
    }
  }

  return (
    <div className="group flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative overflow-hidden">
        <Link href={`/products/${product.slug}`} className="block">
          <div className="relative h-60 w-full overflow-hidden bg-slate-100">
            {hasImage ? (
              <img
                src={imageSrc}
                alt={product.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100">
                <ImageIcon size={28} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-400">
                  No image
                </span>
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        </Link>

        <div className="absolute left-4 top-4">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur ${
              (product as any).is_in_stock
                ? 'bg-white/90 text-emerald-700'
                : 'bg-white/90 text-slate-500'
            }`}
          >
            {(product as any).is_in_stock ? 'In stock' : 'Out of stock'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleToggleWishlist}
          disabled={addingWishlist}
          className={`absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-sm backdrop-blur transition-all duration-300 ${
            isWishlisted
              ? 'border-rose-200 bg-rose-50 text-rose-600'
              : 'border-white/70 bg-white/90 text-slate-700 hover:bg-white'
          }`}
          aria-label="Add to wishlist"
        >
          <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
        </button>

        <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!(product as any).is_in_stock || addingCart}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#127D61] px-4 text-sm font-semibold text-white shadow-lg transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShoppingCart size={16} />
              {addingCart ? 'Adding...' : 'Quick add'}
            </button>

            <Link
              href={`/products/${product.slug}`}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 text-slate-800 shadow-lg transition hover:bg-white"
              aria-label="View product"
            >
              <Eye size={17} />
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-green)]">
            {product.category?.name ?? 'Product'}
          </p>

          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-bold leading-snug text-slate-900 transition-colors duration-200 group-hover:text-[var(--brand-green)]">
              {product.title}
            </h3>
          </Link>

          <div className="flex h-6 items-center justify-between gap-3">
            {reviews > 0 ? (
              <div className="flex items-center gap-2">
                {renderStars(rating)}
                <span className="text-sm text-slate-500">
                  {rating.toFixed(1)} ({reviews})
                </span>
              </div>
            ) : (
              <span className="text-sm text-slate-400">No reviews</span>
            )}
          </div>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xl font-extrabold text-slate-900">
              {formatCurrency(safePrice)}
            </span>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!(product as any).is_in_stock || addingCart}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-green)] hover:text-[var(--brand-green)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShoppingCart size={16} />
              {addingCart ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
