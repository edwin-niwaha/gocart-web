'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Heart,
  Search,
  ShoppingCart,
  Tag,
  ImageIcon,
  Trash2,
  Loader2,
} from 'lucide-react';

import { wishlistApi } from '@/lib/api/services';
import { formatCurrency } from '@/lib/utils';
import { showError, showInfo, showSuccess } from '@/lib/toast';

function toAbsoluteMediaUrl(url?: string | null) {
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

function getProductTitle(item: any) {
  return item?.product?.title || item?.product?.name || 'Untitled product';
}

function getProductSlug(item: any) {
  return item?.product?.slug || '';
}

function getProductKey(item: any) {
  return (
    item?.product?.id ||
    item?.product_id ||
    item?.product?.slug ||
    item?.id
  );
}

function getProductImage(item: any) {
  const product = item?.product || {};

  const raw =
    item?.product_image ||
    item?.image ||
    item?.product_image_url ||
    item?.thumbnail ||
    product.image ||
    product.image_url ||
    product.thumbnail ||
    product.thumbnail_url ||
    product.featured_image ||
    product.featured_image_url ||
    product.photo ||
    product.photo_url ||
    product.product_image ||
    product.product_image_url ||
    product.hero_image ||
    product.image_urls?.[0] ||
    null;

  return toAbsoluteMediaUrl(raw);
}

function getProductPrice(item: any) {
  const product = item?.product || {};

  const rawPrice =
    item?.price ??
    item?.selling_price ??
    item?.current_price ??
    item?.base_price ??
    item?.unit_price ??
    item?.discount_price ??
    product.price ??
    product.selling_price ??
    product.current_price ??
    product.base_price ??
    product.unit_price ??
    product.discount_price ??
    0;

  const parsed =
    typeof rawPrice === 'string' ? Number(rawPrice) : rawPrice;

  return Number.isFinite(parsed) ? parsed : 0;
}

function getProductDescription(item: any) {
  return item?.product?.description || '';
}

function dedupeWishlistItems(items: any[]) {
  const map = new Map();

  for (const item of items) {
    const key = String(getProductKey(item));
    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [removingId, setRemovingId] = useState<number | string | null>(null);

  useEffect(() => {
    wishlistApi
      .listItems()
      .then((data) => {
        const safeItems = Array.isArray(data) ? data : [];
        const uniqueItems = dedupeWishlistItems(safeItems);

        if (safeItems.length !== uniqueItems.length) {
          showInfo('Some duplicate wishlist items were hidden.');
        }

        setItems(uniqueItems);
      })
      .catch(() => {
        setItems([]);
        showError('Failed to load wishlist.');
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleRemove(item: any) {
    const itemId = item?.id;

    if (!itemId) {
      showError('Unable to remove this wishlist item.');
      return;
    }

    try {
      setRemovingId(itemId);
      await wishlistApi.removeItem(itemId);

      setItems((prev) => prev.filter((entry) => entry.id !== itemId));
      showSuccess('Removed from wishlist');
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        'Failed to remove item from wishlist.';
      showError(String(message));
    } finally {
      setRemovingId(null);
    }
  }

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item: any) => {
      const title = getProductTitle(item).toLowerCase();
      const slug = getProductSlug(item).toLowerCase();
      const description = getProductDescription(item).toLowerCase();

      return (
        title.includes(query) ||
        slug.includes(query) ||
        description.includes(query)
      );
    });
  }, [items, search]);

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-[#127D61]/10 px-3 py-1 text-sm font-bold text-[#127D61]">
              Wishlist
            </p>

            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Saved products
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Keep your favorite products here and return to them anytime.
            </p>
          </div>

          {!loading ? (
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                <Heart size={16} className="text-slate-500" />
                {items.length} saved item{items.length === 1 ? '' : 's'}
              </div>

              {search.trim() ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                  <Search size={16} className="text-slate-500" />
                  {filteredItems.length} result{filteredItems.length === 1 ? '' : 's'}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 sm:shadow-sm">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
          Search wishlist
        </label>

        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search wishlist..."
            className="h-12 w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 animate-pulse"
              >
                <div className="h-56 bg-slate-200" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-2/3 rounded-full bg-slate-200" />
                  <div className="h-4 w-1/2 rounded-full bg-slate-200" />
                  <div className="h-10 rounded-2xl bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!loading && !items.length ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Heart size={28} className="text-slate-400" />
          </div>

          <h2 className="mt-4 text-xl font-black text-slate-900">
            Wishlist is empty
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Save products here for later and they will appear in your wishlist.
          </p>

          <Link
            href="/products"
            className="mt-5 inline-flex rounded-2xl bg-[#127D61] px-5 py-3 text-sm font-bold text-white transition hover:opacity-95"
          >
            Browse products
          </Link>
        </div>
      ) : null}

      {!loading && !!items.length && !filteredItems.length ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Search size={28} className="text-slate-400" />
          </div>

          <h2 className="mt-4 text-xl font-black text-slate-900">
            No matching products
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Try a different search term to find saved products faster.
          </p>
        </div>
      ) : null}

      {!!filteredItems.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item: any) => {
            const image = getProductImage(item);
            const title = getProductTitle(item);
            const slug = getProductSlug(item);
            const price = getProductPrice(item);
            const isRemoving = removingId === item.id;

            return (
              <div
                key={item.id}
                className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <Link href={`/products/${slug}`} className="block">
                  <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                    {image ? (
                      <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100">
                        <ImageIcon size={28} className="text-slate-400" />
                        <span className="text-xs font-semibold text-slate-400">
                          No image
                        </span>
                      </div>
                    )}

                    <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
                      <Heart size={13} className="text-[#127D61]" />
                      Saved
                    </div>
                  </div>
                </Link>

                <div className="space-y-4 p-4">
                  <div>
                    <Link href={`/products/${slug}`}>
                      <h2 className="line-clamp-2 min-h-[3.5rem] text-lg font-black text-slate-900 transition hover:text-[#127D61]">
                        {title}
                      </h2>
                    </Link>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Tag size={14} />
                        {slug || 'No slug'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Price
                      </p>
                      <p className="mt-1 text-xl font-black text-slate-900">
                        {formatCurrency(price)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Link
                      href={`/products/${slug}`}
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
                    >
                      View product
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      disabled={isRemoving}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isRemoving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Removing...
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} />
                          Remove
                        </>
                      )}
                    </button>
                  </div>

                  <Link
                    href={`/products/${slug}`}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#127D61] px-4 text-sm font-bold text-white transition hover:opacity-95"
                  >
                    <ShoppingCart size={16} />
                    Buy now
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}