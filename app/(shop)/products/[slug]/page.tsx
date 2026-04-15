'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  Heart,
  Layers3,
  Loader2,
  MessageCircleMore,
  Package,
  Star,
  Tag,
} from 'lucide-react';
import { cartApi, catalogApi, wishlistApi } from '@/lib/api/services';
import type { Product, Review } from '@/lib/types';
import { formatCurrency, getImage } from '@/lib/utils';
import { showError, showSuccess } from '@/lib/toast';

type ProductVariant = Product['variants'] extends Array<infer T> ? T : never;

type ProductRatingShape = {
  average_rating?: number | string;
  total_reviews?: number;
};

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

function normalizeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getAverageRating(product: Product | null) {
  const productAny = product as Product & {
    product_rating?: ProductRatingShape;
    rating?: ProductRatingShape;
    average_rating?: number | string;
  };

  return normalizeNumber(
    productAny?.product_rating?.average_rating ??
      productAny?.rating?.average_rating ??
      productAny?.average_rating,
    0
  );
}

function getTotalReviews(product: Product | null, reviews: Review[]) {
  const productAny = product as Product & {
    product_rating?: ProductRatingShape;
    rating?: ProductRatingShape;
    total_reviews?: number;
  };

  return normalizeNumber(
    productAny?.product_rating?.total_reviews ??
      productAny?.rating?.total_reviews ??
      productAny?.total_reviews ??
      reviews.length,
    0
  );
}

function formatRating(value: number) {
  return value > 0 ? value.toFixed(1) : '0.0';
}

function dedupeImageUrls(urls: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of urls) {
    if (!url || typeof url !== 'string') continue;
    const normalized = url.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function dedupeVariants(variants: ProductVariant[] = []) {
  const seenIds = new Set<number | string>();
  const seenKeys = new Set<string>();

  return variants.filter((variant: any) => {
    if (variant?.id !== undefined && variant?.id !== null) {
      if (seenIds.has(variant.id)) return false;
      seenIds.add(variant.id);
      return true;
    }

    const fallbackKey = `${variant?.name}-${variant?.sku ?? ''}-${variant?.price ?? ''}`;
    if (seenKeys.has(fallbackKey)) return false;
    seenKeys.add(fallbackKey);
    return true;
  });
}

function getInitialVariant(variants: ProductVariant[]) {
  return (
    variants.find((variant: any) => variant.is_active && variant.is_in_stock) ||
    variants.find((variant: any) => variant.is_active) ||
    variants[0] ||
    null
  );
}

function RatingStars({ rating, size = 18 }: { rating: number; size?: number }) {
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

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[78px] flex-1 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mt-0.5 text-[var(--brand-green)]">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="mt-1 line-clamp-2 text-sm font-extrabold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-green)]/10 text-[var(--brand-green)]">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {expanded ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [productLoading, setProductLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [productError, setProductError] = useState<string | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingCart, setAddingCart] = useState(false);
  const [addingWishlist, setAddingWishlist] = useState(false);
  const [wished, setWished] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      try {
        setProductLoading(true);
        setProductError(null);

        const nextProduct = await catalogApi.product(params.slug);

        if (!mounted) return;
        setProduct(nextProduct);
      } catch (error: any) {
        if (!mounted) return;

        setProduct(null);
        setProductError(getErrorMessage(error, 'Failed to load product details.'));
      } finally {
        if (mounted) {
          setProductLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      mounted = false;
    };
  }, [params.slug]);

  useEffect(() => {
    let mounted = true;

    async function loadReviews(productId: number | string) {
      try {
        setReviewsLoading(true);
        setReviewsError(null);

        const nextReviews = await catalogApi.reviews(productId);

        if (!mounted) return;
        setReviews(nextReviews);
      } catch (error: any) {
        if (!mounted) return;

        setReviews([]);

        const status = error?.response?.status;

        if (status === 401) {
          setReviewsError('Reviews are not publicly available right now.');
        } else {
          setReviewsError(getErrorMessage(error, 'Failed to load reviews.'));
        }
      } finally {
        if (mounted) {
          setReviewsLoading(false);
        }
      }
    }

    if (!product?.id) {
      setReviews([]);
      setReviewsError(null);
      setReviewsLoading(false);
      return;
    }

    loadReviews(product.id);

    return () => {
      mounted = false;
    };
  }, [product?.id]);

  const activeVariants = useMemo(() => {
    const source = product?.variants?.filter((variant: any) => variant.is_active) || [];
    return dedupeVariants(source);
  }, [product]);

  useEffect(() => {
    if (!activeVariants.length) {
      setSelectedVariant(null);
      return;
    }

    setSelectedVariant((current) => {
      if (current) {
        const stillExists = activeVariants.find((variant: any) => variant.id === (current as any).id);
        if (stillExists) return stillExists;
      }

      return getInitialVariant(activeVariants);
    });
  }, [activeVariants]);

  const productImages = useMemo(() => {
    return dedupeImageUrls([product?.hero_image, ...(product?.image_urls || [])]);
  }, [product]);

  const imageUrl =
    productImages[0] ||
    getImage(product?.hero_image, product?.image_urls) ||
    'https://via.placeholder.com/900x700?text=Product';

  const averageRating = getAverageRating(product);
  const totalReviews = getTotalReviews(product, reviews);

  const displayPrice = Number(
    selectedVariant?.price ?? product?.base_price ?? product?.price ?? 0
  );

  const isOutOfStock = selectedVariant
    ? !selectedVariant.is_in_stock
    : !product?.is_in_stock;

  const categoryName = product?.category?.name || 'General';
  const selectedOptionName = selectedVariant?.name || 'Default';
  const description = product?.description || 'No description provided.';
  const hasVariants = activeVariants.length > 0;

  const handleAddToCart = async () => {
    if (!product || addingCart) return;

    if (hasVariants && !selectedVariant) {
      showError('Please choose an option before adding this item to cart.');
      return;
    }

    if (selectedVariant && !selectedVariant.is_in_stock) {
      showError('This option is currently unavailable.');
      return;
    }

    if (!selectedVariant && !product.is_in_stock) {
      showError('This product is currently unavailable.');
      return;
    }

    if (!selectedVariant) {
      showError('This product has no purchasable option yet.');
      return;
    }

    try {
      setAddingCart(true);

      await cartApi.addItem({
        variant_id: selectedVariant.id,
        quantity: Math.max(1, quantity),
      });

      showSuccess('Added to cart');
    } catch (error: any) {
      showError(getErrorMessage(error, 'Failed to add item to cart.'));
    } finally {
      setAddingCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product || addingWishlist) return;

    try {
      setAddingWishlist(true);

      if (wished) {
        if (typeof wishlistApi.removeItem === 'function') {
          await wishlistApi.removeItem(product.id);
        }
        setWished(false);
        showSuccess('Removed from wishlist');
      } else {
        await wishlistApi.addItem({ product_id: product.id });
        setWished(true);
        showSuccess('Added to wishlist');
      }
    } catch (error: any) {
      showError(getErrorMessage(error, 'Failed to update wishlist.'));
    } finally {
      setAddingWishlist(false);
    }
  };

  if (productLoading) {
    return (
      <div className="py-16">
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-green)]" />
          <p className="text-sm font-medium text-slate-500">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="py-16">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <h1 className="text-xl font-black text-slate-900">Product not available</h1>
          <p className="mt-2 text-sm text-slate-500">
            {productError || 'We could not load this product right now.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="mx-auto w-full max-w-xl">
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <img
              src={imageUrl}
              alt={product.title}
              className="h-80 w-full object-cover sm:h-[420px]"
            />

            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={addingWishlist}
              className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full border border-black/5 bg-white/95 shadow-sm transition hover:scale-105 disabled:opacity-70"
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {addingWishlist ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-700" />
              ) : (
                <Heart
                  size={22}
                  className={wished ? 'fill-red-500 text-red-500' : 'text-slate-700'}
                />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                  {categoryName}
                </p>
                <h1 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                  {product.title}
                </h1>
              </div>

              <span
                className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-extrabold ${
                  isOutOfStock
                    ? 'bg-red-50 text-red-600'
                    : 'bg-green-50 text-green-700'
                }`}
              >
                {isOutOfStock ? 'Out of stock' : 'In stock'}
              </span>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <p className="text-3xl font-black text-[var(--brand-green)] sm:text-4xl">
                {formatCurrency(displayPrice)}
              </p>

              <Link
                href={`/reviews/${product.slug}`}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-300"
              >
                <div className="flex items-center gap-2">
                  <RatingStars rating={averageRating} size={15} />
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatRating(averageRating)}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </p>
                <p className="mt-1 text-xs font-bold text-[var(--brand-green)]">
                  See all reviews
                </p>
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoPill icon={<Tag size={16} />} label="Category" value={categoryName} />
              <InfoPill icon={<Package size={16} />} label="Option" value={selectedOptionName} />
              <InfoPill
                icon={<Layers3 size={16} />}
                label="Availability"
                value={isOutOfStock ? 'Unavailable' : 'Available'}
              />
              <InfoPill
                icon={<MessageCircleMore size={16} />}
                label="Customer rating"
                value={`${formatRating(averageRating)} / 5`}
              />
            </div>
          </div>

          {hasVariants ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-black text-slate-900">Choose option</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select the version you want before adding to cart.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {activeVariants.map((variant: any) => {
                  const active = selectedVariant?.id === variant.id;
                  const disabled = !variant.is_in_stock;

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => !disabled && setSelectedVariant(variant)}
                      disabled={disabled}
                      className={[
                        'min-w-[120px] rounded-2xl border px-4 py-3 text-left transition',
                        active
                          ? 'border-[var(--brand-green)] bg-[var(--brand-green)]/10'
                          : 'border-slate-200 bg-white hover:border-slate-300',
                        disabled ? 'cursor-not-allowed opacity-50' : '',
                      ].join(' ')}
                    >
                      <p
                        className={`text-sm font-extrabold ${
                          active ? 'text-[var(--brand-green)]' : 'text-slate-900'
                        }`}
                      >
                        {variant.name}
                      </p>

                      {typeof variant.stock_quantity === 'number' ? (
                        <p
                          className={`mt-1 text-xs font-semibold ${
                            active ? 'text-[var(--brand-green)]' : 'text-slate-500'
                          }`}
                        >
                          {disabled ? 'Unavailable' : `${variant.stock_quantity} left`}
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <Section
            title="Product details"
            expanded={detailsExpanded}
            onToggle={() => setDetailsExpanded((prev) => !prev)}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="text-sm font-semibold text-slate-500">Category</span>
                <span className="text-right text-sm font-extrabold text-slate-900">
                  {categoryName}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="text-sm font-semibold text-slate-500">Selected option</span>
                <span className="text-right text-sm font-extrabold text-slate-900">
                  {selectedOptionName}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="text-sm font-semibold text-slate-500">Availability</span>
                <span className="text-right text-sm font-extrabold text-slate-900">
                  {isOutOfStock ? 'Unavailable' : 'Available'}
                </span>
              </div>

              {typeof selectedVariant?.stock_quantity === 'number' ? (
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                  <span className="text-sm font-semibold text-slate-500">Stock quantity</span>
                  <span className="text-right text-sm font-extrabold text-slate-900">
                    {selectedVariant.stock_quantity}
                  </span>
                </div>
              ) : null}

              {selectedVariant?.max_quantity_per_order ? (
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                  <span className="text-sm font-semibold text-slate-500">Max per order</span>
                  <span className="text-right text-sm font-extrabold text-slate-900">
                    {selectedVariant.max_quantity_per_order}
                  </span>
                </div>
              ) : null}

              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                <span className="text-sm font-semibold text-slate-500">Reviews</span>
                <span className="text-right text-sm font-extrabold text-slate-900">
                  {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-sm font-semibold text-slate-500">Average rating</span>
                <span className="text-right text-sm font-extrabold text-slate-900">
                  {formatRating(averageRating)} / 5
                </span>
              </div>
            </div>
          </Section>

          <Section
            title="Description"
            expanded={descriptionExpanded}
            onToggle={() => setDescriptionExpanded((prev) => !prev)}
          >
            <p className="text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
          </Section>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[var(--brand-green)] sm:max-w-[110px]"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              />

              <button
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--brand-green)] px-5 text-sm font-extrabold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleAddToCart}
                disabled={isOutOfStock || addingCart}
              >
                {addingCart ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {addingCart ? 'Adding...' : isOutOfStock ? 'Out of stock' : 'Add to cart'}
              </button>

              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-900 transition hover:border-slate-300 disabled:opacity-60"
                onClick={handleToggleWishlist}
                disabled={addingWishlist}
              >
                {addingWishlist ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart
                    size={16}
                    className={wished ? 'fill-red-500 text-red-500' : 'text-slate-700'}
                  />
                )}
                {wished ? 'Saved to wishlist' : 'Save to wishlist'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}