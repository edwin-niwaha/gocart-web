'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShoppingCart,
  ArrowLeft,
  Loader2,
  PackageOpen,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { canUseStorefrontShopping } from '@/lib/auth/roles';
import { cartApi, getApiErrorMessage } from '@/lib/api/services';
import { CustomerSessionRequired } from '@/components/storefront/customer-session-required';
import { resolveCartItemImage } from '@/lib/product-images';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { CartItem } from '@/lib/types';

export default function CartPage() {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<number[]>([]);
  const canShop = canUseStorefrontShopping(user);

  const loadCart = useCallback(async () => {
    try {
      const data = await cartApi.listItems();
      setItems(data);
      setError(null);
    } catch (error: unknown) {
      setItems([]);
      setError(getApiErrorMessage(error, 'Failed to load cart items.'));
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!canShop) {
      setItems([]);
      setError(null);
      setNotice(null);
      setLoading(false);
      return;
    }

    loadCart().finally(() => setLoading(false));
  }, [canShop, hydrated, loadCart]);

  const getItemPrice = (item: CartItem) => {
    return (
      Number(
        (item as any).product_variant?.price ??
          (item as any).variant?.price ??
          (item as any).product?.price ??
          0
      ) || 0
    );
  };

  const getItemTitle = (item: CartItem) => {
    return (
      (item as any).product?.title ??
      (item as any).product_variant?.product?.title ??
      (item as any).variant?.product?.title ??
      'Cart item'
    );
  };

  const getItemImage = (item: CartItem) => {
    return resolveCartItemImage(item);
  };

  const getVariantLabel = (item: CartItem) => {
    return (
      (item as any).product_variant?.name ??
      (item as any).variant?.name ??
      (item as any).product_variant?.sku ??
      (item as any).variant?.sku ??
      ''
    );
  };

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + Number(item.quantity ?? 0), 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => {
        return total + getItemPrice(item) * Number(item.quantity ?? 0);
      }, 0),
    [items]
  );

  const withBusy = async (id: number, action: () => Promise<void>) => {
    if (busyIds.includes(id)) return;

    setBusyIds((prev) => [...prev, id]);
    setNotice(null);

    try {
      await action();
    } finally {
      setBusyIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const updateQuantity = async (item: CartItem, nextQuantity: number) => {
    if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
      setNotice('Quantity must be at least 1.');
      return;
    }

    const previousItems = items;

    await withBusy(item.id, async () => {
      setItems((prev) =>
        prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: nextQuantity }
            : cartItem
        )
      );

      try {
        const updated = await cartApi.updateItem(item.id, {
          quantity: nextQuantity,
        });

        setItems((prev) =>
          prev.map((cartItem) =>
            cartItem.id === item.id ? { ...cartItem, ...updated } : cartItem
          )
        );
      } catch (error: unknown) {
        setItems(previousItems);
        setNotice(
          getApiErrorMessage(error, 'Failed to update quantity.')
        );
      }
    });
  };

  const handleRemove = async (id: number) => {
    const previousItems = items;

    await withBusy(id, async () => {
      setItems((prev) => prev.filter((item) => item.id !== id));

      try {
        await cartApi.removeItem(id);
      } catch (error: unknown) {
        setItems(previousItems);
        setNotice(
          getApiErrorMessage(error, 'Failed to remove item.')
        );
      }
    });
  };

  const retryLoadCart = () => {
    setLoading(true);
    loadCart().finally(() => setLoading(false));
  };

  if (!hydrated || loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Cart
                </p>
                <h1 className="mt-1 text-2xl font-extrabold text-gray-900">
                  Your cart
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  Loading your cart items...
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!canShop) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <CustomerSessionRequired
            title="The customer cart is not available in a management session."
            description="Your dashboard session is kept separate from customer shopping so staff and tenant accounts do not inherit storefront cart items."
          />
        </section>
      </main>
    );
  }

  if (error && !items.length) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
            <h1 className="text-2xl font-extrabold text-red-700">
              Unable to load cart
            </h1>
            <p className="mt-2 text-sm text-red-600">{error}</p>

            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={retryLoadCart}
                className="inline-flex items-center justify-center rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Try again
              </button>

              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <PackageOpen className="h-6 w-6 text-gray-500" />
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Cart
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-gray-900">
              Your cart is empty
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Add products from the shop to start checkout.
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                <ShoppingCart className="h-4 w-4" />
                Start shopping
              </Link>

              <Link
                href="/"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back home
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Cart
                  </p>
                  <h1 className="mt-1 text-2xl font-extrabold text-gray-900">
                    Your cart
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Review your items before checkout.
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
                  <ShoppingCart className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </div>

            {notice ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                {notice}
              </div>
            ) : null}

            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4">
                <h2 className="text-lg font-extrabold text-gray-900">
                  Cart items
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Update quantities or remove items.
                </p>
              </div>

              <div className="space-y-4">
                {items.map((item) => {
                  const quantity = Number(item.quantity ?? 0);
                  const price = getItemPrice(item);
                  const lineTotal = price * quantity;
                  const title = getItemTitle(item);
                  const image = getItemImage(item);
                  const variantLabel = getVariantLabel(item);
                  const isBusy = busyIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      className="rounded-3xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="h-24 w-full overflow-hidden rounded-2xl bg-white sm:h-24 sm:w-24">
                          {image ? (
                            <img
                              src={image}
                              alt={title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-400">
                              No image
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <h3 className="truncate text-base font-extrabold text-gray-900">
                                {title}
                              </h3>

                              {variantLabel ? (
                                <p className="mt-1 text-sm text-gray-500">
                                  {variantLabel}
                                </p>
                              ) : null}

                              <p className="mt-2 text-sm font-semibold text-gray-700">
                                UGX {price.toLocaleString()} each
                              </p>
                            </div>

                            <div className="text-left lg:text-right">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Total
                              </p>
                              <p className="mt-1 text-lg font-extrabold text-gray-900">
                                UGX {lineTotal.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="inline-flex w-fit items-center rounded-full border border-gray-200 bg-white p-1">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item, quantity - 1)}
                                disabled={isBusy || quantity <= 1}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Minus className="h-4 w-4" />
                              </button>

                              <span className="min-w-[44px] text-center text-sm font-bold text-gray-900">
                                {quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() => updateQuantity(item, quantity + 1)}
                                disabled={isBusy}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemove(item.id)}
                              disabled={isBusy}
                              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isBusy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Summary
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Items</span>
                  <span className="font-bold text-gray-900">{itemCount}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-bold text-gray-900">
                    UGX {subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-500">Total</span>
                  <span className="text-2xl font-extrabold text-gray-900">
                    UGX {subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <Link
                href={items.length ? '/checkout' : '#'}
                className={`mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white transition ${
                  items.length
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'cursor-not-allowed bg-gray-300'
                }`}
              >
                Proceed to checkout
              </Link>

              <Link
                href="/products"
                className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
