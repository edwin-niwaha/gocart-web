'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Package,
  PackageCheck,
  Receipt,
  RefreshCcw,
  Search,
  ShoppingBag,
  Star,
  Truck,
  XCircle,
} from 'lucide-react';

import { getApiErrorMessage, orderApi, reviewApi } from '@/lib/api/services';
import type { Order, OrderItem, Review } from '@/lib/types';

const ORDER_STEPS = ['PENDING', 'PROCESSING', 'PAID', 'SHIPPED', 'DELIVERED'];

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
  return normalizeStatus(status).replace(/_/g, ' ');
}

function money(value: number | string) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function getStatusClasses(status?: string) {
  switch (normalizeStatus(status)) {
    case 'DELIVERED':
      return 'bg-green-50 text-green-700 ring-green-200';
    case 'SHIPPED':
      return 'bg-blue-50 text-blue-700 ring-blue-200';
    case 'PROCESSING':
      return 'bg-amber-50 text-amber-700 ring-amber-200';
    case 'PAID':
      return 'bg-violet-50 text-violet-700 ring-violet-200';
    case 'CANCELLED':
      return 'bg-red-50 text-red-700 ring-red-200';
    default:
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
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
    0,
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

  const itemTitles = (((order as any).items || []) as any[])
    .map((item) => getProductTitle(item).toLowerCase())
    .join(' ');

  return [
    (order as any).slug,
    (order as any).id,
    (order as any).status,
    (order as any).total_price,
    itemTitles,
  ]
    .join(' ')
    .toLowerCase()
    .includes(q);
}

function normalizeReviewList(data: any): Review[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function OrderProgress({ status }: { status?: string }) {
  const normalized = normalizeStatus(status);

  if (normalized === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700">
        <XCircle className="h-4 w-4" />
        Order cancelled
      </div>
    );
  }

  const currentIndex = Math.max(0, ORDER_STEPS.indexOf(normalized));

  return (
    <div className="overflow-x-auto rounded-2xl bg-slate-50 px-4 py-4">
      <div className="flex min-w-max items-center gap-2">
        {ORDER_STEPS.map((step, index) => {
          const done = index <= currentIndex;

          return (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                  done ? 'bg-[#127D61] text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </div>

              <span
                className={`text-xs font-black ${
                  done ? 'text-[#127D61]' : 'text-slate-400'
                }`}
              >
                {step}
              </span>

              {index < ORDER_STEPS.length - 1 ? (
                <div
                  className={`h-1 w-8 rounded-full ${
                    index < currentIndex ? 'bg-[#127D61]' : 'bg-slate-200'
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RatingPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="rounded-full p-1 transition hover:bg-amber-50"
        >
          <Star
            className={`h-8 w-8 ${
              star <= value ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
            }`}
          />
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#127D61]">
              Product review
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-900">
              {initialReview ? 'Update your review' : 'Write a review'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{productTitle}</p>
          </div>

          <button
            type="button"
            onClick={saving ? undefined : onClose}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-black text-slate-800">Rating</p>
            <RatingPicker value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={5}
              disabled={saving}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#127D61] focus:bg-white"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                onSubmit({
                  rating,
                  comment: comment.trim(),
                })
              }
              className="flex-1 rounded-2xl bg-[#127D61] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
            >
              {saving ? 'Saving...' : initialReview ? 'Update review' : 'Submit review'}
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
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <button
        type="button"
        onClick={() => onOpen(order)}
        className="w-full text-left"
      >
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#127D61]">
                <Receipt className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-black text-slate-900">
                  Order #{(order as any).slug || (order as any).id}
                </h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {formatDate((order as any).created_at)}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-[11px] font-black ring-1 ${getStatusClasses(
                  (order as any).status,
                )}`}
              >
                {formatStatus((order as any).status)}
              </span>
            </div>

            <p className="mt-4 line-clamp-2 text-sm font-bold text-slate-900">
              {getProductTitle(firstItem)}
            </p>

            {moreCount > 0 ? (
              <p className="mt-1 text-xs font-semibold text-slate-500">
                +{moreCount} more item{moreCount > 1 ? 's' : ''}
              </p>
            ) : null}
          </div>

          <div className="flex min-w-0 shrink-0 flex-col gap-2 lg:items-end">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Total amount
            </p>
            <p className="max-w-full break-words text-xl font-black leading-tight text-slate-950 sm:text-2xl">
              {money((order as any).total_price ?? 0)}
            </p>

            <span className="inline-flex items-center gap-2 text-sm font-black text-[#127D61]">
              View details
              <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </div>

        <div className="px-5 pb-5">
          <OrderProgress status={(order as any).status} />
        </div>
      </button>

      {reviewable && uniqueItems.length > 0 ? (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
            Review delivered items
          </p>

          <div className="flex flex-wrap gap-2">
            {uniqueItems.slice(0, 3).map((orderItem: any) => {
              const existingReview = reviewMap.get(orderItem.product);

              return (
                <button
                  key={orderItem.id}
                  type="button"
                  onClick={() =>
                    onReview({
                      productId: orderItem.product,
                      productTitle: getProductTitle(orderItem),
                      review: existingReview || null,
                    })
                  }
                  className={`rounded-2xl border px-4 py-2 text-xs font-black transition ${
                    existingReview
                      ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {existingReview ? 'Edit review' : 'Review item'}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
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

  const reviewMap = useMemo(
    () => new Map<number, Review>(reviews.map((review: any) => [review.product, review])),
    [reviews],
  );

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesOrderSearch(order, search)),
    [orders, search],
  );

  const totalSpent = useMemo(
    () => orders.reduce((sum, order: any) => sum + Number(order.total_price || 0), 0),
    [orders],
  );

  const deliveredCount = useMemo(
    () => orders.filter((order: any) => normalizeStatus(order.status) === 'DELIVERED').length,
    [orders],
  );

  const activeCount = useMemo(
    () =>
      orders.filter(
        (order: any) =>
          !['DELIVERED', 'CANCELLED'].includes(normalizeStatus(order.status)),
      ).length,
    [orders],
  );

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [ordersData, reviewsData] = await Promise.all([
        orderApi.list(),
        reviewApi.myReviews(),
      ]);

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setReviews(normalizeReviewList(reviewsData));
    } catch (error: unknown) {
      setOrders([]);
      setReviews([]);
      setError(getApiErrorMessage(error, 'Failed to load orders.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleOpenOrder = useCallback(
    (order: Order) => {
      router.push(`/account/orders/${(order as any).slug || (order as any).id}`);
    },
    [router],
  );

  const handleReviewSubmit = useCallback(
    async (values: ReviewFormValues) => {
      if (!selectedProduct) return;

      setSaving(true);

      try {
        if (selectedProduct.review) {
          await reviewApi.update(selectedProduct.review.id, values);
        } else {
          await reviewApi.create({
            product: selectedProduct.productId,
            rating: values.rating,
            comment: values.comment,
          });
        }

        const refreshed = await reviewApi.myReviews();
        setReviews(normalizeReviewList(refreshed));
        setSelectedProduct(null);
      } catch (error: unknown) {
        setError(getApiErrorMessage(error, 'Review was not saved.'));
      } finally {
        setSaving(false);
      }
    },
    [selectedProduct],
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[360px] max-w-6xl items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <div className="text-center">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#127D61]" />
            <p className="mt-3 text-sm font-bold text-slate-600">Loading orders...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#127D61] via-emerald-700 to-slate-950 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-wide">
                Client portal
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight">
                Your orders
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50">
                Track purchases, check progress, open order details, and review delivered products.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadOrders()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#127D61]"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh orders
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <ShoppingBag className="h-5 w-5 text-[#127D61]" />
            <p className="mt-3 text-sm font-bold text-slate-500">Total orders</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{orders.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <PackageCheck className="h-5 w-5 text-[#127D61]" />
            <p className="mt-3 text-sm font-bold text-slate-500">Delivered</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{deliveredCount}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <Receipt className="h-5 w-5 text-[#127D61]" />
            <p className="mt-3 text-sm font-bold text-slate-500">Total spent</p>
            <p className="mt-1 break-words text-2xl font-black leading-tight text-slate-950 sm:text-3xl">{money(totalSpent)}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order number, status, amount, or product..."
                className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>

            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-[#127D61]">
              {activeCount} active order{activeCount === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        {error && !orders.length ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
            <p className="text-sm font-bold text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="mt-4 rounded-2xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
            >
              Try again
            </button>
          </div>
        ) : !orders.length ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <Package className="mx-auto h-9 w-9 text-slate-400" />
            <h2 className="mt-4 text-xl font-black text-slate-900">No orders yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Your orders will appear here after checkout.
            </p>
          </div>
        ) : !filteredOrders.length ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <Search className="mx-auto h-9 w-9 text-slate-400" />
            <h2 className="mt-4 text-xl font-black text-slate-900">No matching orders</h2>
            <p className="mt-2 text-sm text-slate-500">
              Try another order number, product name, amount, or status.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={(order as any).id || (order as any).slug}
                order={order}
                reviewMap={reviewMap}
                onOpen={handleOpenOrder}
                onReview={setSelectedProduct}
              />
            ))}
          </div>
        )}
      </section>

      <ReviewModal
        open={!!selectedProduct}
        saving={saving}
        productTitle={selectedProduct?.productTitle || ''}
        initialReview={selectedProduct?.review || null}
        onClose={() => {
          if (!saving) setSelectedProduct(null);
        }}
        onSubmit={handleReviewSubmit}
      />
    </main>
  );
}
