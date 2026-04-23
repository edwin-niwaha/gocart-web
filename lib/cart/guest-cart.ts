import { getTenantSlug } from '@/lib/api/client';
import type { CartItem, Product, ProductVariant } from '@/lib/types';

const GUEST_CART_STORAGE_PREFIX = 'gocart_guest_cart';

type GuestCartProduct = Product & {
  image?: string | null;
  image_url?: string | null;
};

type GuestCartVariant = ProductVariant & {
  product?: GuestCartProduct;
};

type StoredGuestCartItem = {
  id: number;
  variant_id: number;
  quantity: number;
  unit_price: number;
  product: GuestCartProduct;
  variant: GuestCartVariant;
  created_at: string;
  updated_at: string;
};

export type GuestCartSyncItem = {
  id: number;
  quantity: number;
  variant_id: number;
};

export type GuestCartAddPayload = {
  product: Product;
  quantity: number;
  variant: ProductVariant;
};

function isBrowser() {
  return typeof window !== 'undefined';
}

function getStorageKey() {
  return `${GUEST_CART_STORAGE_PREFIX}:${getTenantSlug() ?? 'default'}`;
}

function normalizeQuantity(value: number) {
  const parsed = Math.trunc(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function resolvePrimaryImage(product: Product) {
  const productRecord = product as Product & {
    image?: string | null;
    image_url?: string | null;
  };

  return (
    product.hero_image ??
    product.image_urls?.[0] ??
    productRecord.image ??
    productRecord.image_url ??
    null
  );
}

function resolveUnitPrice(product: Product, variant: ProductVariant) {
  const rawPrice = variant.price ?? product.base_price ?? product.price ?? 0;
  const parsed = Number(rawPrice);
  return Number.isFinite(parsed) ? parsed : 0;
}

function createProductSnapshot(product: Product): GuestCartProduct {
  const image = resolvePrimaryImage(product);

  return {
    ...product,
    image: image ?? null,
    image_url: image ?? null,
    image_urls:
      product.image_urls?.filter((value) => typeof value === 'string' && value.trim()) ??
      (image ? [image] : []),
  };
}

function createVariantSnapshot(
  product: GuestCartProduct,
  variant: ProductVariant
): GuestCartVariant {
  return {
    ...variant,
    product,
  };
}

function matchesGuestCartItemId(item: StoredGuestCartItem, id: number) {
  return item.id === id || item.variant_id === Math.abs(id);
}

function readStoredItems(): StoredGuestCartItem[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(getStorageKey());
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item || typeof item !== 'object') return null;

        const record = item as Partial<StoredGuestCartItem>;
        if (
          typeof record.id !== 'number' ||
          typeof record.variant_id !== 'number' ||
          typeof record.quantity !== 'number' ||
          typeof record.unit_price !== 'number' ||
          !record.product ||
          !record.variant
        ) {
          return null;
        }

        return {
          id: record.id,
          variant_id: record.variant_id,
          quantity: normalizeQuantity(record.quantity),
          unit_price: Number.isFinite(record.unit_price)
            ? record.unit_price
            : 0,
          product: record.product as GuestCartProduct,
          variant: record.variant as GuestCartVariant,
          created_at:
            typeof record.created_at === 'string'
              ? record.created_at
              : new Date().toISOString(),
          updated_at:
            typeof record.updated_at === 'string'
              ? record.updated_at
              : new Date().toISOString(),
        } satisfies StoredGuestCartItem;
      })
      .filter((item): item is StoredGuestCartItem => Boolean(item));
  } catch {
    return [];
  }
}

function writeStoredItems(items: StoredGuestCartItem[]) {
  if (!isBrowser()) return;

  try {
    if (!items.length) {
      window.localStorage.removeItem(getStorageKey());
      return;
    }

    window.localStorage.setItem(getStorageKey(), JSON.stringify(items));
  } catch {
    // Ignore storage write failures and keep the request flow usable.
  }
}

function toCartItem(item: StoredGuestCartItem): CartItem {
  const variant = {
    ...item.variant,
    product: item.product,
  };

  return {
    id: item.id,
    product: item.product,
    quantity: item.quantity,
    unit_price: String(item.unit_price),
    line_total: String(item.unit_price * item.quantity),
    created_at: item.created_at,
    updated_at: item.updated_at,
    variant_id: item.variant_id,
    variant,
    product_variant: variant,
  } as CartItem;
}

export function isGuestCartItemId(id: number) {
  return id < 0;
}

export function hasGuestCartItems() {
  return readStoredItems().length > 0;
}

export function listGuestCartItems() {
  return readStoredItems().map(toCartItem);
}

export function addGuestCartItem(payload: GuestCartAddPayload) {
  const items = readStoredItems();
  const quantity = normalizeQuantity(payload.quantity);
  const product = createProductSnapshot(payload.product);
  const variant = createVariantSnapshot(product, payload.variant);
  const unitPrice = resolveUnitPrice(payload.product, payload.variant);
  const now = new Date().toISOString();

  const existingItem = items.find(
    (item) => item.variant_id === payload.variant.id
  );

  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.unit_price = unitPrice;
    existingItem.product = product;
    existingItem.variant = variant;
    existingItem.updated_at = now;
    writeStoredItems(items);
    return toCartItem(existingItem);
  }

  const nextItem: StoredGuestCartItem = {
    id: -Math.abs(payload.variant.id),
    variant_id: payload.variant.id,
    quantity,
    unit_price: unitPrice,
    product,
    variant,
    created_at: now,
    updated_at: now,
  };

  items.push(nextItem);
  writeStoredItems(items);
  return toCartItem(nextItem);
}

export function updateGuestCartItem(id: number, quantity?: number) {
  if (quantity == null) {
    throw new Error('Quantity is required to update a guest cart item.');
  }

  const nextQuantity = normalizeQuantity(quantity);
  const items = readStoredItems();
  const item = items.find((entry) => matchesGuestCartItemId(entry, id));

  if (!item) {
    throw new Error('Cart item could not be found.');
  }

  item.quantity = nextQuantity;
  item.updated_at = new Date().toISOString();

  writeStoredItems(items);
  return toCartItem(item);
}

export function removeGuestCartItem(id: number) {
  const items = readStoredItems();
  const nextItems = items.filter((item) => !matchesGuestCartItemId(item, id));
  writeStoredItems(nextItems);
}

export function clearGuestCart() {
  writeStoredItems([]);
}

export function retainGuestCartItems(ids: number[]) {
  const idSet = new Set(ids);
  const items = readStoredItems().filter((item) => idSet.has(item.id));
  writeStoredItems(items);
}

export function listGuestCartSyncItems(): GuestCartSyncItem[] {
  return readStoredItems().map((item) => ({
    id: item.id,
    quantity: item.quantity,
    variant_id: item.variant_id,
  }));
}
