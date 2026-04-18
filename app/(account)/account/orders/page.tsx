'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Package,
  Search,
  Loader2,
  Receipt,
  Star,
} from 'lucide-react';

import { orderApi, reviewApi } from '@/lib/api/services';
import type { Order, OrderItem, Review } from '@/lib/types';

type SelectedProduct = {
  productId: number;
  productTitle: string;
  review: Review | null;
};

type ReviewFormValues = {
  rating: number;
  comment: string;
};

function normalizeStatus(status?: string) {
  return String(status || 'PENDING').toUpperCase();
}

function formatStatus(status?: string) {
  const value = normalizeStatus(status).toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getStatusClasses(status?: string) {
  switch (normalizeStatus(status)) {
    case 'DELIVERED':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'SHIPPED':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'PROCESSING':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'PAID':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'CANCELLED':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
}

function canReviewOrder(status?: string) {
  return normalizeStatus(status) === 'DELIVERED';
}

function getProductTitle(item?: OrderItem) {
  if (!item) return 'Product';
  return (
    (item as any).product_title ||
    (item as any).product_slug ||
    `Product #${(item as any).product}`
  );
}

function getOrderItemCount(order: Order) {
  return ((order as any).items || []).reduce(
    (sum: number, item: any) => sum + Number(item.quantity || 0),
    0
  );
}

function getUniqueOrderItems(items: OrderItem[] = []) {
  const seen = new Set<number>();

  return items.filter((item: any) => {
    if (seen.has(item.product)) return false;
    seen.add(item.product);
    return true;
  });
}

function matchesOrderSearch(order: Order, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const orderRef = String((order as any).slug || (order as any).id || '').toLowerCase();
  const status = String((order as any).status || '').toLowerCase();
  const amount = String((order as any).total_price || '').toLowerCase();
  const itemTitles = (((order as any).items || []) as any[])
    .map((item) => getProductTitle(item).toLowerCase())
    .join(' ');

  return (
    orderRef.includes(q) ||
    status.includes(q) ||
    amount.includes(q) ||
    itemTitles.includes(q)
  );
}

function money(value: number | string) {
  const amount = Number(value || 0);
  return `UGX ${amount.toLocaleString()}`;
}

function normalizeReviewList(data: any): Review[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function RatingPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="text-3xl leading-none"
        >
          <span className={star <= value ? 'text-amber-500' : 'text-gray-300'}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

function ReviewModal({
  open,
  saving,
  productTitle,
  initialReview,
  onClose,
  onSubmit,
}: {
  open: boolean;
  saving: boolean;
  productTitle: string;
  initialReview: Review | null;
  onClose: () => void;
  onSubmit: (values: ReviewFormValues) => void;
}) {
  const [rating, setRating] = useState(initialReview?.rating ?? 5);
  const [comment, setComment] = useState(initialReview?.comment ?? '');

  useEffect(() => {
    setRating(initialReview?.rating ?? 5);
    setComment(initialReview?.comment ?? '');
  }, [initialReview, open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!rating || rating < 1 || rating > 5) return;

    onSubmit({
      rating,
      comment: comment.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-t-3xl border border-gray-200 bg-white p-5 shadow-xl sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              {initialReview ? 'Update Review' : 'Write a Review'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{productTitle}</p>
          </div>

          <button
            type="button"
            onClick={saving ? undefined : onClose}
            className="rounded-full border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-bold text-gray-800">Rating</p>
            <RatingPicker value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-800">
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience"
              rows={5}
              disabled={saving}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="flex-1 rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm font-bold text-gray-800 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? 'Saving...' : initialReview ? 'Update' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  reviewMap,
  onOpen,
  onReview,
}: {
  order: Order;
  reviewMap: Map<number, Review>;
  onOpen: (order: Order) => void;
  onReview: (payload: SelectedProduct) => void;
}) {
  const firstItem = (order as any).items?.[0];
  const itemCount = getOrderItemCount(order);
  const uniqueItems = getUniqueOrderItems((order as any).items || []);
  const reviewable = canReviewOrder((order as any).status);
  const moreCount = itemCount > 1 ? itemCount - 1 : 0;

  return (
    <button
      type="button"
      onClick={() => onOpen(order)}
      className="w-full rounded-3xl border border-gray-200 bg-white text-left shadow-sm transition hover:bg-gray-50"
    >
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
          <Receipt className="h-5 w-5 text-emerald-600" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-gray-900">
            Order #{(order as any).slug || (order as any).id}
          </p>
          <p className="mt-1 text-xs font-semibold text-gray-500">
            {itemCount} item{itemCount === 1 ? '' : 's'}
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-extrabold ${getStatusClasses(
            (order as any).status
          )}`}
        >
          {formatStatus((order as any).status)}
        </span>
      </div>

      <div className="border-t border-gray-100 p-4">
        <p className="text-sm font-extrabold leading-6 text-gray-900">
          {getProductTitle(firstItem)}
        </p>

        {moreCount > 0 ? (
          <p className="mt-1 text-xs font-semibold text-gray-500">
            +{moreCount} more item{moreCount > 1 ? 's' : ''}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Total
          </p>
          <p className="text-xl font-black text-gray-900">
            {money((order as any).total_price ?? 0)}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-extrabold text-emerald-700">
            View details
          </span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>

        {reviewable && uniqueItems.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {uniqueItems.slice(0, 2).map((orderItem: any) => {
              const existingReview = reviewMap.get(orderItem.product);

              return (
                <button
                  key={orderItem.id}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onReview({
                      productId: orderItem.product,
                      productTitle: getProductTitle(orderItem),
                      review: existingReview || null,
                    });
                  }}
                  className={`rounded-xl border px-3 py-2 text-xs font-extrabold ${
                    existingReview
                      ? 'border-gray-200 bg-white text-gray-800'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {existingReview ? 'Edit Review' : 'Review Item'}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </button>
  );
}

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reviewMap = useMemo(() => {
    return new Map<number, Review>(reviews.map((review: any) => [review.product, review]));
  }, [reviews]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => matchesOrderSearch(order, search));
  }, [orders, search]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [ordersData, reviewsData] = await Promise.all([
        orderApi.list(),
        reviewApi.myReviews(),
      ]);

      setOrders(ordersData || []);
      setReviews(normalizeReviewList(reviewsData));
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
      setReviews([]);
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleOpenOrder = useCallback(
    (order: Order) => {
      router.push(`/account/orders/${(order as any).slug || (order as any).id}`);
    },
    [router]
  );

  const closeModal = useCallback(() => {
    if (saving) return;
    setSelectedProduct(null);
  }, [saving]);

  const handleReviewSubmit = useCallback(
    async (values: ReviewFormValues) => {
      if (!selectedProduct) return;

      setSaving(true);

      try {
        const saved = selectedProduct.review
          ? await reviewApi.update(selectedProduct.review.id, values)
          : await reviewApi.create({
              product: selectedProduct.productId,
              rating: values.rating,
              comment: values.comment,
            });

        if (saved) {
          const refreshed = await reviewApi.myReviews();
          setReviews(normalizeReviewList(refreshed));
          setSelectedProduct(null);
        }
      } catch (error) {
        console.error('Review not saved:', error);
      } finally {
        setSaving(false);
      }
    },
    [selectedProduct]
  );

  if (loading) {
    return (
      <main className="min-h-screen w-full bg-gray-50">
        <section className="w-full px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-gray-200 bg-white">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
              <p className="mt-3 text-sm font-semibold text-gray-600">Loading orders...</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-gray-50">
      <section className="w-full px-4 py-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Account
                </p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">
                  Your orders
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  Track your purchases, open order details, and review delivered items.
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
            <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders, status or product"
                className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-500"
              />
            </label>
          </div>

          {error && !orders.length ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
              <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          ) : !orders.length ? (
            <div className="rounded-3xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
              <Package className="mx-auto h-8 w-8 text-gray-400" />
              <h2 className="mt-4 text-xl font-black text-gray-900">No orders yet</h2>
              <p className="mt-2 text-sm text-gray-500">
                Your orders will appear here after checkout.
              </p>
            </div>
          ) : !filteredOrders.length ? (
            <div className="rounded-3xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
              <Search className="mx-auto h-8 w-8 text-gray-400" />
              <h2 className="mt-4 text-xl font-black text-gray-900">No matching orders</h2>
              <p className="mt-2 text-sm text-gray-500">
                Try another order number, product name, or status.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={(order as any).id}
                  order={order}
                  reviewMap={reviewMap}
                  onOpen={handleOpenOrder}
                  onReview={setSelectedProduct}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <ReviewModal
        open={!!selectedProduct}
        saving={saving}
        productTitle={selectedProduct?.productTitle || ''}
        initialReview={selectedProduct?.review || null}
        onClose={closeModal}
        onSubmit={handleReviewSubmit}
      />
    </main>
  );
}