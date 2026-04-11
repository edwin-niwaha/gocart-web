'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { cartApi, catalogApi, wishlistApi } from '@/lib/api/services';
import type { Product, Review } from '@/lib/types';
import { formatCurrency, getImage } from '@/lib/utils';
import { showError, showSuccess } from '@/lib/toast';

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

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => {
        const filled = i < Math.round(rating);
        return (
          <Star
            key={i}
            size={18}
            className={filled ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}
          />
        );
      })}
    </div>
  );
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [addingCart, setAddingCart] = useState(false);
  const [addingWishlist, setAddingWishlist] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await catalogApi.product(params.slug);
        setProduct(p);
        setReviews(await catalogApi.reviews(p.id));
      } catch (error: any) {
        showError(getErrorMessage(error, 'Failed to load product details.'));
      }
    })();
  }, [params.slug]);

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      const firstAvailableVariant = product.variants?.find(
        (variant) => variant.is_active && variant.stock_quantity > 0
      );

      if (!firstAvailableVariant) {
        showError('This product has no available variant in stock.');
        return;
      }

      setAddingCart(true);

      await cartApi.addItem({
        variant_id: firstAvailableVariant.id,
        quantity,
      });

      showSuccess('Added to cart');
    } catch (error: any) {
      showError(getErrorMessage(error, 'Failed to add item to cart.'));
    } finally {
      setAddingCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!product) return;

    try {
      setAddingWishlist(true);

      await wishlistApi.addItem({
        product_id: product.id,
      });

      showSuccess('Added to wishlist');
    } catch (error: any) {
      showError(getErrorMessage(error, 'Failed to add item to wishlist.'));
    } finally {
      setAddingWishlist(false);
    }
  };

  if (!product) {
    return <div className="py-10 text-center text-sm text-slate-500">Loading...</div>;
  }

  const price = Number(product.base_price ?? product.price ?? 0);
  const rating = Number(product.average_rating ?? 0);
  const totalReviews = Number(product.total_reviews ?? reviews.length ?? 0);

  return (
    <div className="py-6">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="mx-auto w-full max-w-md lg:max-w-lg">
          <img
            src={getImage(product.hero_image, product.image_urls)}
            alt={product.title}
            className="h-72 w-full rounded-3xl border object-cover shadow-sm sm:h-80 md:h-96"
          />
        </div>

        <div className="space-y-5">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-[var(--brand-green)]/10 px-3 py-1 text-xs font-semibold text-[var(--brand-green)]">
              {product.category?.name ?? 'Product'}
            </span>

            <h1 className="text-2xl font-black leading-tight sm:text-3xl md:text-4xl">
              {product.title}
            </h1>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <RatingStars rating={rating} />
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">
                  {rating > 0 ? rating.toFixed(1) : 'No rating'}
                </span>
                <span>•</span>
                <span>{totalReviews} review{totalReviews === 1 ? '' : 's'}</span>
              </div>
            </div>

            <p className="text-sm leading-7 text-slate-600 sm:text-base">
              {product.description || 'No description available.'}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Price</p>
                <p className="text-2xl font-extrabold sm:text-3xl">
                  {formatCurrency(price)}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  product.is_in_stock
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {product.is_in_stock ? 'In stock' : 'Out of stock'}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                className="input h-11 w-full sm:max-w-28"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              />

              <button
                className="btn flex-1"
                onClick={handleAddToCart}
                disabled={addingCart || !product.is_in_stock}
              >
                {addingCart ? 'Adding...' : 'Add to cart'}
              </button>

              <button
                className="btn btn-secondary flex-1 sm:flex-none"
                onClick={handleAddToWishlist}
                disabled={addingWishlist}
              >
                {addingWishlist ? 'Adding...' : 'Add to Wishlist'}
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="mb-4 text-lg font-semibold">Customer reviews</h2>

            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border p-4">
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-slate-800">
                      {review.user?.username ?? 'Anonymous'}
                    </p>
                    <div className="flex items-center gap-2">
                      <RatingStars rating={Number(review.rating ?? 0)} />
                      <span className="text-sm text-slate-500">
                        {review.rating}/5
                      </span>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{review.comment}</p>
                </div>
              ))}

              {!reviews.length ? (
                <p className="text-sm text-slate-500">No reviews yet.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}