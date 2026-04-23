'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Star } from 'lucide-react';
import { catalogApi, getApiErrorMessage, reviewApi } from '@/lib/api/services';
import { useAuth } from '@/lib/hooks/use-auth';
import type { Product, Review } from '@/lib/types';
import { showError, showSuccess } from '@/lib/toast';

export default function WriteReviewPage({
  params,
}: {
  params: { slug: string };
}) {
  const router = useRouter();
  const { user, ready, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!ready) return;

    if (!isAuthenticated) {
      router.replace(`/auth/login?next=/reviews/${params.slug}/write`);
    }
  }, [ready, isAuthenticated, router, params.slug]);

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      if (!ready || !isAuthenticated) return;

      try {
        setLoadingPage(true);

        const productData = await catalogApi.product(String(params.slug));

        if (!mounted) return;
        setProduct(productData);

        const myReview = await reviewApi.myReviewForProduct(String(params.slug));

        if (!mounted) return;

        setExistingReview(myReview);

        if (myReview) {
          setRating(Number(myReview.rating) || 0);
          setComment(myReview.comment || '');
        }
      } catch (error: unknown) {
        if (!mounted) return;
        showError(getApiErrorMessage(error, 'Could not load this review form.'));
      } finally {
        if (mounted) {
          setLoadingPage(false);
        }
      }
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, [params.slug, ready, isAuthenticated]);

  const activeRating = useMemo(() => hoverRating || rating, [hoverRating, rating]);
  const isEditing = !!existingReview;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      showError('Please log in to write a review.');
      router.push(`/auth/login?next=/reviews/${params.slug}/write`);
      return;
    }

    if (!product?.id) {
      showError('Product information is missing.');
      return;
    }

    if (rating < 1 || rating > 5) {
      showError('Please select a star rating.');
      return;
    }

    if (!comment.trim()) {
      showError('Please write your review comment.');
      return;
    }

    try {
      setSubmitting(true);

      if (isEditing && existingReview?.id) {
        await reviewApi.update(existingReview.id, {
          rating,
          comment: comment.trim(),
        });

        showSuccess('Review updated successfully.');
      } else {
        await reviewApi.create({
          product: product.id,
          rating,
          comment: comment.trim(),
        });

        showSuccess('Review submitted successfully.');
      }

      router.push(`/reviews/${params.slug}`);
      router.refresh();
    } catch (error: unknown) {
      showError(getApiErrorMessage(error, 'Failed to submit review.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready || loadingPage) {
    return (
      <div className="py-16">
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-green)]" />
          <p className="text-sm font-medium text-slate-500">Loading review form...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="py-6">
      <div className="mx-auto max-w-3xl space-y-5">
        <Link
          href={product?.slug ? `/reviews/${product.slug}` : '/products'}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:border-slate-300"
        >
          <ChevronLeft size={16} />
          Back to reviews
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            {isEditing ? 'Edit your review' : 'Write a review'}
          </p>

          <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
            {product?.title ?? 'Product review'}
          </h1>

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-900">
                Your rating
              </label>

              <div
                className="flex items-center gap-2"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= activeRating;

                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onClick={() => setRating(star)}
                      className="rounded-full p-1 transition hover:scale-105"
                      aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
                    >
                      <Star
                        size={28}
                        className={
                          filled
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300'
                        }
                      />
                    </button>
                  );
                })}
              </div>

              <p className="mt-2 text-sm text-slate-500">
                {rating > 0 ? `You selected ${rating} out of 5.` : 'Choose a rating.'}
              </p>
            </div>

            <div>
              <label
                htmlFor="comment"
                className="mb-3 block text-sm font-bold text-slate-900"
              >
                Your review
              </label>

              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={6}
                maxLength={1000}
                placeholder="Share your experience with this product..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--brand-green)]"
              />

              <p className="mt-2 text-xs font-medium text-slate-500">
                {comment.trim().length}/1000 characters
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--brand-green)] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                {submitting
                  ? isEditing
                    ? 'Updating...'
                    : 'Submitting...'
                  : isEditing
                    ? 'Update review'
                    : 'Submit review'}
              </button>

              <Link
                href={product?.slug ? `/reviews/${product.slug}` : '/products'}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:border-slate-300"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
