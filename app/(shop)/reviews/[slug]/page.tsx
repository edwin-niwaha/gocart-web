'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, Star } from 'lucide-react';
import { catalogApi, productReviewApi } from '@/lib/api/services';
import { useAuth } from '@/lib/hooks/use-auth';
import type { Product, Review } from '@/lib/types';

function getErrorMessage(error: any, fallback: string) {
  if (error instanceof Error && error.message) return error.message;

  const data = error?.response?.data;

  if (typeof data === 'string') return data;
  if (data?.detail) return String(data.detail);
  if (data?.message) return String(data.message);

  if (typeof data === 'object' && data !== null) {
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return String(firstValue[0]);
    }
    if (typeof firstValue === 'string') return firstValue;
  }

  return fallback;
}

function normalizeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatRating(value: number) {
  return value > 0 ? value.toFixed(1) : '0.0';
}

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

function getDisplayName(review: Review) {
  const user = review.user;
  if (!user) return 'Anonymous';

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;
  if (user.username) return user.username;
  if (user.email) return user.email;
  return 'Customer';
}

function StarRating({
  rating,
  size = 16,
}: {
  rating: number;
  size?: number;
}) {
  const rounded = Math.round(rating);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= rounded
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-slate-300'
          }
        />
      ))}
    </div>
  );
}

export default function ProductReviewsPage({
  params,
}: {
  params: { slug: string };
}) {
  const { ready, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const [productData, reviewsData] = await Promise.all([
        catalogApi.product(String(params.slug)),
        productReviewApi.listBySlug(String(params.slug)),
      ]);

      setProduct(productData);
      setReviews(reviewsData);
    } catch (error: any) {
      setError(getErrorMessage(error, 'Could not load reviews.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const averageRating = useMemo(() => {
    const productAny = product as Product & {
      average_rating?: number | string;
      product_rating?: { average_rating?: number | string };
      rating?: { average_rating?: number | string };
    };

    return normalizeNumber(
      productAny?.product_rating?.average_rating ??
        productAny?.rating?.average_rating ??
        productAny?.average_rating,
      0
    );
  }, [product]);

  const totalReviews = useMemo(() => {
    const productAny = product as Product & {
      total_reviews?: number;
      product_rating?: { total_reviews?: number };
      rating?: { total_reviews?: number };
    };

    return normalizeNumber(
      productAny?.product_rating?.total_reviews ??
        productAny?.rating?.total_reviews ??
        productAny?.total_reviews ??
        reviews.length,
      reviews.length
    );
  }, [product, reviews.length]);

  const ratingBreakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach((review) => {
      const rating = Math.max(1, Math.min(5, Math.round(Number(review.rating) || 0)));
      counts[rating as 1 | 2 | 3 | 4 | 5] += 1;
    });

    return counts;
  }, [reviews]);

  if (loading || !ready) {
    return (
      <div className="py-16">
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-green)]" />
          <p className="text-sm font-medium text-slate-500">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <h1 className="text-xl font-black text-slate-900">Reviews unavailable</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>

          <div className="mt-6">
            <Link
              href={product?.slug ? `/products/${product.slug}` : '/products'}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
            >
              <ChevronLeft size={16} />
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={product?.slug ? `/products/${product.slug}` : '/products'}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:border-slate-300"
          >
            <ChevronLeft size={16} />
            Back to product
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {isAuthenticated && product?.slug ? (
              <Link
                href={`/reviews/${product.slug}/write`}
                className="inline-flex items-center rounded-2xl bg-[var(--brand-green)] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
              >
                Write review
              </Link>
            ) : null}

            <button
              type="button"
              onClick={() => loadData(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:border-slate-300 disabled:opacity-60"
              disabled={refreshing}
            >
              {refreshing ? <Loader2 size={16} className="animate-spin" /> : null}
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {!!product?.title && (
            <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">
              {product.title}
            </h1>
          )}

          <p className="mt-2 text-sm font-semibold text-slate-500">
            Customer reviews
          </p>

          <div className="mt-5">
            <p className="text-4xl font-black text-[var(--brand-green)]">
              {formatRating(averageRating)}
            </p>
            <div className="mt-2">
              <StarRating rating={averageRating} size={18} />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-500">
              {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingBreakdown[star as 1 | 2 | 3 | 4 | 5];
              const widthPct = totalReviews ? (count / totalReviews) * 100 : 0;

              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="w-8 text-sm font-bold text-slate-800">{star}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-yellow-400"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-bold text-slate-500">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-950">All reviews</h2>

          {reviews.length ? (
            reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-base font-extrabold text-slate-900">
                      {getDisplayName(review)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {formatDate(review.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-1 sm:items-end">
                    <StarRating rating={Number(review.rating) || 0} size={14} />
                    <span className="text-xs font-bold text-slate-500">
                      {formatRating(Number(review.rating) || 0)}
                    </span>
                  </div>
                </div>

                {!!review.comment?.trim() && (
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {review.comment.trim()}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <h3 className="text-lg font-black text-slate-900">No reviews yet</h3>
              <p className="mt-2 text-sm text-slate-500">
                Be the first customer to share feedback on this product.
              </p>

              {isAuthenticated && product?.slug ? (
                <div className="mt-5">
                  <Link
                    href={`/reviews/${product.slug}/write`}
                    className="inline-flex items-center rounded-2xl bg-[var(--brand-green)] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-95"
                  >
                    Write the first review
                  </Link>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}