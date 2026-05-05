import {
  api,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getTenantSlug,
  normalizeList,
  setTokens,
} from './client';
import { notifyCartUpdated } from '@/lib/cart-events';
import {
  addGuestCartItem,
  clearGuestCart,
  hasGuestCartItems,
  isGuestCartItemId,
  listGuestCartItems,
  listGuestCartSyncItems,
  removeGuestCartItem,
  retainGuestCartItems,
  updateGuestCartItem,
} from '@/lib/cart/guest-cart';
import { IDEMPOTENCY_KEY_HEADER } from '@/lib/security/idempotency';
import type {
  AuthResponse,
  Cart,
  CartItem,
  Category,
  Coupon,
  CouponValidation,
  CustomerAddress,
  CustomerAddressPayload,
  DeliveryRate,
  DeliveryRatePayload,
  Inventory,
  InventoryMovement,
  Notification,
  Order,
  OrderItem,
  Payment as BasePayment,
  PaymentPayload,
  PickupStation,
  PickupStationPayload,
  Product,
  ProductRating,
  ProductVariant,
  Review,
  Shipment,
  ShipmentPayload,
  ShippingMethod,
  ShippingMethodPayload,
  SupportMessage,
  TenantBranding,
  TenantFeatureFlag,
  TenantMembership,
  TenantSettings,
  User,
  Wishlist,
  WishlistItem,
} from '@/lib/types';

/* ============================================================================
 * Shared types
 * ========================================================================== */

export type PaginatedResponse<T> =
  | T[]
  | {
      count: number;
      next: string | null;
      previous: string | null;
      results: T[];
    };

export type ListResponse<T> = T[] | { results: T[] };
export type ApiListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  is_active?: boolean;
  [key: string]: unknown;
};
type MutationOptions = {
  idempotencyKey?: string;
};

export function isPaginatedResponse<T>(
  data: PaginatedResponse<T>
): data is {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
} {
  return !Array.isArray(data) && Array.isArray(data.results);
}

function compactObject<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

type ApiErrorPayload =
  | string
  | string[]
  | {
      detail?: unknown;
      message?: unknown;
      error?: unknown;
      errors?: unknown;
      non_field_errors?: unknown;
      [key: string]: unknown;
    };

function getObjectValue(value: unknown, key: string): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return (value as Record<string, unknown>)[key];
}

function firstMessage(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return firstMessage(value[0]);
  }

  if (value && typeof value === 'object') {
    for (const candidate of Object.values(value as Record<string, unknown>)) {
      const message = firstMessage(candidate);
      if (message) return message;
    }
  }

  return null;
}

function isGenericAxiosStatusMessage(message: string): boolean {
  return /^Request failed with status code \d+$/i.test(message.trim());
}

function getResponseData(error: unknown): ApiErrorPayload | null {
  if (!error || typeof error !== 'object' || !('response' in error)) {
    return null;
  }

  const response = (error as { response?: { data?: unknown } }).response;
  return (response?.data as ApiErrorPayload | undefined) ?? null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong.'
): string {
  const data = getResponseData(error);

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (Array.isArray(data) && data.length > 0) {
    const message = firstMessage(data);
    if (message) return message;
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const explicitMessage = firstMessage(data.message);
    if (explicitMessage) return explicitMessage;

    const nestedErrorMessage = firstMessage(
      getObjectValue(data.error, 'message')
    );
    if (nestedErrorMessage) return nestedErrorMessage;

    const detailMessage = firstMessage(data.detail);
    if (detailMessage) return detailMessage;

    const nonFieldMessage = firstMessage(data.non_field_errors);
    if (nonFieldMessage) return nonFieldMessage;

    const nestedDetailsMessage = firstMessage(
      getObjectValue(data.error, 'details')
    );
    if (nestedDetailsMessage) return nestedDetailsMessage;

    const errorMessage = firstMessage(data.error);
    if (errorMessage) return errorMessage;

    const errorsMessage = firstMessage(data.errors);
    if (errorsMessage) return errorsMessage;

    const fieldMessage = firstMessage(data);
    if (fieldMessage) return fieldMessage;
  }

  if (
    error instanceof Error &&
    error.message.trim() &&
    !isGenericAxiosStatusMessage(error.message)
  ) {
    return error.message;
  }

  return fallback;
}

function getResourceTenantSlug(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const tenantSlug = (value as { tenant_slug?: unknown }).tenant_slug;
  if (typeof tenantSlug !== 'string' || !tenantSlug.trim()) return null;

  return tenantSlug.trim().toLowerCase();
}

function assertTenantScopedResource(value: unknown, url: string) {
  const expectedTenantSlug = getTenantSlug();
  if (!expectedTenantSlug) return;

  const returnedTenantSlug = getResourceTenantSlug(value);
  if (!returnedTenantSlug || returnedTenantSlug === expectedTenantSlug) return;

  throw new Error(
    `Refused ${url} response because it belongs to a different tenant.`
  );
}

function assertTenantScopedList<T>(items: T[], url: string): T[] {
  items.forEach((item) => assertTenantScopedResource(item, url));
  return items;
}

async function syncGuestCartToServer() {
  if (!getAccessToken()) return;

  const pendingItems = listGuestCartSyncItems();
  if (!pendingItems.length) return;

  const failedIds: number[] = [];
  let syncedCount = 0;

  for (const item of pendingItems) {
    try {
      await postOne<CartItem>('/cart-items/', {
        variant_id: item.variant_id,
        quantity: item.quantity,
      });
      syncedCount += 1;
    } catch {
      failedIds.push(item.id);
    }
  }

  if (failedIds.length) {
    retainGuestCartItems(failedIds);
  } else {
    clearGuestCart();
  }

  if (syncedCount > 0) {
    notifyCartUpdated();
  }
}

function buildGuestCart(): Cart {
  const items = listGuestCartItems();
  const totalItems = items.reduce(
    (sum, item) => sum + Number(item.quantity ?? 0),
    0
  );
  const totalPrice = items.reduce(
    (sum, item) => sum + Number(item.line_total ?? 0),
    0
  );
  const timestamp = new Date().toISOString();

  return {
    id: 0,
    user: 0,
    items,
    total_items: totalItems,
    total_price: String(totalPrice),
    created_at: timestamp,
    updated_at: timestamp,
  };
}

async function getList<T>(url: string, params?: Record<string, unknown>): Promise<T[]> {
  const { data } = await api.get<ListResponse<T>>(url, { params });
  return assertTenantScopedList(normalizeList<T>(data), url);
}

async function getPaginatedList<T>(
  url: string,
  params?: Record<string, unknown>
): Promise<PaginatedResponse<T>> {
  const { data } = await api.get<PaginatedResponse<T>>(url, { params });

  if (Array.isArray(data)) {
    return assertTenantScopedList(data, url);
  }

  if (isPaginatedResponse(data)) {
    return {
      ...data,
      results: assertTenantScopedList(data.results, url),
    };
  }

  return {
    count: 0,
    next: null,
    previous: null,
    results: [],
  };
}

async function getOne<T>(url: string): Promise<T> {
  const { data } = await api.get<T>(url);
  assertTenantScopedResource(data, url);
  return data;
}

async function postOne<T>(
  url: string,
  payload?: unknown,
  options?: MutationOptions
): Promise<T> {
  const { data } = await api.post<T>(url, payload, {
    headers: options?.idempotencyKey
      ? { [IDEMPOTENCY_KEY_HEADER]: options.idempotencyKey }
      : undefined,
  });
  assertTenantScopedResource(data, url);
  return data;
}

async function patchOne<T>(url: string, payload?: unknown): Promise<T> {
  const { data } = await api.patch<T>(url, payload);
  assertTenantScopedResource(data, url);
  return data;
}

async function deleteOne<T = unknown>(url: string): Promise<T> {
  const { data } = await api.delete<T>(url);
  return data;
}

/* ============================================================================
 * Query / domain types
 * ========================================================================== */

export type ProductQueryParams = ApiListParams & {
  category?: string | number;
  is_featured?: boolean;
};

export type CategoryQueryParams = ApiListParams & {
  parent?: string | number;
};

export type VariantQueryParams = ApiListParams & {
  product?: number | string;
  product_slug?: string;
  sku?: string;
};

export type ProductVariantPayload = {
  product?: number;
  product_slug?: string;
  name: string;
  sku: string;
  price: string | number;
  stock_quantity?: number;
  max_quantity_per_order?: number | null;
  is_active?: boolean;
  sort_order?: number;
};

type ReviewQueryParams = ApiListParams & {
  product?: number | string;
  product_slug?: string;
  rating?: number;
};

type RatingQueryParams = ApiListParams & {
  product?: number;
  product_slug?: string;
};

type ReviewOrParams = number | string | ReviewQueryParams;
type RatingOrParams = number | RatingQueryParams;

export const PAYMENT_STATUSES = [
  'PENDING',
  'PROCESSING',
  'PAID',
  'FAILED',
  'REFUNDED',
  'CANCELLED',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PROVIDERS = [
  'CASH',
  'CARD',
  'STRIPE',
  'PAYSTACK',
  'FLUTTERWAVE',
  'MTN',
] as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export type Payment = BasePayment & {
  user_email?: string;
  username?: string;
  tenant?: number | null;
  order_slug?: string | null;
  order_status?: string | null;
  address_id?: number | null;
};

export interface PaymentListParams {
  status?: PaymentStatus | string;
  provider?: PaymentProvider | string;
  search?: string;
}

export interface UpdatePaymentPayload {
  provider?: PaymentProvider | string;
  status?: PaymentStatus | string;
  transaction_id?: string;
  provider_response?: Record<string, unknown>;
}

export type ContactPayload = {
  name: string;
  email: string;
  message: string;
  subject?: string;
};

export type CheckoutPayload = {
  address_id: number;
  delivery_option?: 'HOME_DELIVERY' | 'PICKUP_STATION';
  payment_method?: string;
  pickup_station_id?: number;
  coupon_code?: string;
};

export type CheckoutSummaryRequest = {
  address_id?: number;
  delivery_option?: 'HOME_DELIVERY' | 'PICKUP_STATION';
  pickup_station_id?: number;
  coupon_code?: string;
};

export type CheckoutSummary = {
  items_subtotal: string | number;
  discount: string | number;
  shipping: string | number;
  total: string | number;
  delivery_option?: 'HOME_DELIVERY' | 'PICKUP_STATION';
  coupon_id?: number | null;
  coupon_code?: string | null;
  delivery_rate_id?: number | null;
  estimated_days?: number | null;
  shipping_method_id?: number | null;
  pickup_station_id?: number | null;
};

export type DashboardSummary = {
  orders?: number;
  revenue?: string | number;
  customers?: number;
  products?: number;
  low_stock_items?: number;
  pending_support_messages?: number;
  [key: string]: unknown;
};

export type TenantCurrentResponse = {
  id?: number;
  name?: string;
  slug?: string;
  tenant_slug?: string;
  branding?: TenantBranding | null;
  settings?: TenantSettings | null;
  feature_flags?: TenantFeatureFlag[];
};

export type MembershipListParams = ApiListParams & {
  status?: 'active' | 'inactive' | string;
};

export type TenantMembershipPayload = {
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  role: string;
  is_active?: boolean;
};

export type TenantMembershipUpdatePayload = {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  role?: string;
  is_active?: boolean;
  user_is_active?: boolean;
};

/* ============================================================================
 * Auth
 * ========================================================================== */

export const authApi = {
  register: async (payload: {
    email: string;
    username: string;
    password: string;
    password_confirm: string;
  }) => {
    const data = await postOne<AuthResponse>('/auth/register/', payload);
    setTokens(data.tokens.access, data.tokens.refresh);
    await syncGuestCartToServer();
    return data;
  },

  login: async (payload: { email: string; password: string }) => {
    const data = await postOne<AuthResponse>('/auth/login/', payload);
    setTokens(data.tokens.access, data.tokens.refresh);
    await syncGuestCartToServer();
    return data;
  },

  googleLogin: async (access_token: string) => {
    const data = await postOne<AuthResponse>('/auth/social/google/', {
      access_token,
    });
    setTokens(data.tokens.access, data.tokens.refresh);
    await syncGuestCartToServer();
    return data;
  },

  me: async () => {
    const token = getAccessToken();
    if (!token) throw new Error('No access token found');
    return getOne<User>('/auth/me/');
  },

  updateProfile: async (payload: FormData) => {
    const { data } = await api.patch('/auth/me/', payload, {
      headers: {
        Accept: 'application/json',
        'Content-Type': undefined,
      },
    });
    return data;
  },

  updateProfileJson: async (payload: {
    username: string;
    first_name: string;
    last_name: string;
  }) => {
    const { data } = await api.patch('/auth/me/', payload, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    return data;
  },

  changePassword: async (payload: {
    current_password: string;
    new_password: string;
    new_password_confirm: string;
  }) => postOne('/auth/change-password/', payload),

  forgotPassword: async (email: string) =>
    postOne('/auth/forgot-password/', { email }),

  resetPassword: async (payload: {
    email: string;
    code: string;
    password: string;
    password_confirm: string;
  }) => postOne('/auth/reset-password/', payload),

  sendEmailVerification: async () =>
    postOne('/auth/send-email-verification/'),

  verifyEmail: async (code: string) =>
    postOne('/auth/verify-email/', { code }),

  logout: async () => {
    const refresh = getRefreshToken();

    try {
      if (refresh) {
        await postOne('/auth/logout/', { refresh });
      }
    } finally {
      clearTokens();
    }
  },
};

/* ============================================================================
 * Catalog / public
 * ========================================================================== */

export const catalogApi = {
  products: async (params?: ProductQueryParams) =>
    getList<Product>('/products/', params),

  productsPage: async (params?: ProductQueryParams) =>
    getPaginatedList<Product>('/products/', params),

  product: async (slug: string) =>
    getOne<Product>(`/products/${slug}/`),

  categories: async (params?: CategoryQueryParams) =>
    getList<Category>('/categories/', params),

  categoriesPage: async (params?: CategoryQueryParams) =>
    getPaginatedList<Category>('/categories/', params),

  category: async (slug: string) =>
    getOne<Category>(`/categories/${slug}/`),

  reviews: async (productOrParams?: ReviewOrParams) => {
    const params =
      typeof productOrParams === 'number'
        ? { product: productOrParams }
        : typeof productOrParams === 'string'
        ? { product_slug: productOrParams }
        : productOrParams;

    return getList<Review>('/reviews/', params);
  },

  ratings: async (productOrParams?: RatingOrParams) => {
    const params =
      typeof productOrParams === 'number'
        ? { product: productOrParams }
        : productOrParams;

    return getList<ProductRating>('/ratings/', params);
  },

  createReview: async (payload: {
    product: number;
    rating: number;
    comment: string;
  }) => postOne<Review>('/reviews/', payload),
};

export const commonApi = {
  subscribeToNewsletter: async (payload: { email: string }) =>
    postOne('/newsletter/', payload),
};

/* ============================================================================
 * Variants
 * ========================================================================== */

export const variantApi = {
  list: async (params?: VariantQueryParams) =>
    getList<ProductVariant>('/variants/', params),

  listPage: async (params?: VariantQueryParams) =>
    getPaginatedList<ProductVariant>('/variants/', params),

  byProduct: async (product: number | string) => {
    const params =
      typeof product === 'number'
        ? { product }
        : { product_slug: product };

    return getList<ProductVariant>('/variants/', params);
  },

  detail: async (id: number | string) =>
    getOne<ProductVariant>(`/variants/${id}/`),

  create: async (payload: ProductVariantPayload) =>
    postOne<ProductVariant>('/variants/', payload),

  update: async (
    id: number | string,
    payload: Partial<ProductVariantPayload>
  ) => patchOne<ProductVariant>(`/variants/${id}/`, payload),

  remove: async (id: number | string) =>
    deleteOne(`/variants/${id}/`),
};

/* ============================================================================
 * Cart
 * ========================================================================== */

export const cartApi = {
  async ensure() {
    if (!getAccessToken()) {
      return buildGuestCart();
    }

    await syncGuestCartToServer();

    try {
      return await postOne<Cart>('/cart/', {});
    } catch {
      const carts = await getList<Cart>('/cart/');
      return carts[0];
    }
  },

  async listItems() {
    if (!getAccessToken()) {
      return listGuestCartItems();
    }

    await syncGuestCartToServer();

    try {
      const serverItems = await getList<CartItem>('/cart-items/');
      if (!hasGuestCartItems()) {
        return serverItems;
      }

      return [...serverItems, ...listGuestCartItems()];
    } catch (error: unknown) {
      const guestItems = listGuestCartItems();
      if (guestItems.length) {
        return guestItems;
      }

      throw new Error(
        getApiErrorMessage(error, 'Failed to load cart items.')
      );
    }
  },

  async addItem(payload: {
    variant_id: number;
    quantity: number;
    product?: Product;
    variant?: ProductVariant;
  }) {
    if (!getAccessToken()) {
      if (!payload.product || !payload.variant) {
        throw new Error('Product details are required for guest cart items.');
      }

      const data = addGuestCartItem({
        product: payload.product,
        quantity: payload.quantity,
        variant: payload.variant,
      });
      notifyCartUpdated();
      return data;
    }

    await syncGuestCartToServer();

    try {
      const data = await postOne<CartItem>('/cart-items/', {
        variant_id: payload.variant_id,
        quantity: payload.quantity,
      });
      notifyCartUpdated();
      return data;
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Failed to add item to cart.'));
    }
  },

  async updateItem(
    id: number,
    payload: { quantity?: number; variant_id?: number }
  ) {
    if (isGuestCartItemId(id) || !getAccessToken()) {
      try {
        const data = updateGuestCartItem(id, payload.quantity);
        notifyCartUpdated();
        return data;
      } catch (error: unknown) {
        throw new Error(
          getApiErrorMessage(error, 'Failed to update cart item.')
        );
      }
    }

    try {
      const data = await patchOne<CartItem>(`/cart-items/${id}/`, payload);
      notifyCartUpdated();
      return data;
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Failed to update cart item.'));
    }
  },

  async removeItem(id: number) {
    if (isGuestCartItemId(id) || !getAccessToken()) {
      try {
        removeGuestCartItem(id);
        notifyCartUpdated();
        return { success: true };
      } catch (error: unknown) {
        throw new Error(
          getApiErrorMessage(error, 'Failed to remove cart item.')
        );
      }
    }

    try {
      await deleteOne(`/cart-items/${id}/`);
      notifyCartUpdated();
      return { success: true };
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Failed to remove cart item.'));
    }
  },
};

/* ============================================================================
 * Reviews / ratings
 * ========================================================================== */

export const reviewApi = {
  myReviews: async (params?: { product?: number; product_slug?: string }) => {
    const { data } = await api.get('/reviews/', { params });
    return data;
  },

  create: async (payload: {
    product: number;
    rating: number;
    comment: string;
  }) => postOne('/reviews/', payload),

  update: async (
    id: number,
    payload: {
      rating: number;
      comment: string;
    }
  ) => patchOne(`/reviews/${id}/`, payload),

  remove: async (id: number) =>
    deleteOne(`/reviews/${id}/`),

  myReviewForProduct: async (product_slug: string) => {
    const { data } = await api.get('/reviews/', {
      params: { product_slug },
    });

    if (Array.isArray(data)) return data[0] ?? null;
    if (Array.isArray(data?.results)) return data.results[0] ?? null;

    return null;
  },
};

export const productReviewApi = {
  listBySlug: async (slug: string) => {
    const { data } = await api.get('/product-reviews/', {
      params: { product_slug: slug },
    });

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;

    return [];
  },

  listByProduct: async ({
    product,
    product_slug,
  }: {
    product?: number;
    product_slug?: string;
  }) => {
    const { data } = await api.get('/product-reviews/', {
      params: compactObject({
        product,
        product_slug,
      }),
    });

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;

    return [];
  },
};

export const productRatingApi = {
  listByProduct: async (params: { product?: number; product_slug?: string }) => {
    const { data } = await api.get('/product-ratings/', { params });
    return data;
  },
};

/* ============================================================================
 * Wishlist
 * ========================================================================== */

export const wishlistApi = {
  getOrCreate: async () =>
    postOne<Wishlist>('/wishlist/', {}),

  current: async () =>
    getOne<Wishlist>('/wishlist/current/'),

  listItems: async (params?: ApiListParams) =>
    getList<WishlistItem>('/wishlist-items/', params),

  listItemsPage: async (params?: ApiListParams) =>
    getPaginatedList<WishlistItem>('/wishlist-items/', params),

  addItem: async (payload: { product_id: number }) => {
    try {
      return await postOne<WishlistItem>('/wishlist-items/', payload);
    } catch (error: unknown) {
      throw new Error(
        getApiErrorMessage(error, 'Failed to add item to wishlist.')
      );
    }
  },

  removeItem: async (id: number) => {
    try {
      return await deleteOne(`/wishlist-items/${id}/`);
    } catch (error: unknown) {
      throw new Error(
        getApiErrorMessage(error, 'Failed to remove item from wishlist.')
      );
    }
  },
};

/* ============================================================================
 * Orders
 * ========================================================================== */

export type CheckoutResponse = {
  order: Order;
  payment_reference: string | null;
  payment_status?: string | null;
  payment_provider?: string | null;
};

export const checkoutApi = {
  summary: async (params?: CheckoutSummaryRequest) => {
    const { data } = await api.get<CheckoutSummary>('/checkout/summary/', {
      params: compactObject(params ?? {}),
    });
    assertTenantScopedResource(data, '/checkout/summary/');
    return data;
  },

  validate: async (payload: CheckoutSummaryRequest) =>
    postOne<CheckoutSummary>('/checkout/validate/', payload),

  submit: async (
    payload: CheckoutPayload,
    options?: MutationOptions
  ) => postOne<CheckoutResponse>('/orders/checkout/', payload, options),
};

export const orderApi = {
  list: async (params?: ApiListParams) =>
    getList<Order>('/orders/', params),

  listPage: async (params?: ApiListParams) =>
    getPaginatedList<Order>('/orders/', params),

  detail: async (slug: string) =>
    getOne<Order>(`/orders/${slug}/`),

  checkout: checkoutApi.submit,

  update: async (slug: string, payload: Record<string, unknown>) =>
    patchOne<Order>(`/orders/${slug}/`, payload),

  cancel: async (slug: string, payload?: { reason?: string }) =>
    postOne<Order>(`/orders/${slug}/cancel/`, payload ?? {}),

  requestRefund: async (slug: string, payload?: { reason?: string }) =>
    postOne<Order>(`/orders/${slug}/refund/`, payload ?? {}),

  remove: async (slug: string) =>
    deleteOne(`/orders/${slug}/`),

  removeItem: async (id: number) =>
    deleteOne(`/orders/${id}/`),
};

/* ============================================================================
 * Notifications
 * ========================================================================== */

export const notificationApi = {
  async list(
    urlOrParams?: string | ApiListParams
  ): Promise<PaginatedResponse<Notification>> {
    try {
      const endpoint =
        typeof urlOrParams === 'string' ? urlOrParams : '/notifications/';
      const params = typeof urlOrParams === 'object' ? urlOrParams : undefined;
      return await getPaginatedList<Notification>(endpoint, params);
    } catch (error: unknown) {
      throw new Error(
        getApiErrorMessage(error, 'Failed to load notifications.')
      );
    }
  },

  async markRead(id: number): Promise<Notification> {
    try {
      return await postOne<Notification>(`/notifications/${id}/mark_read/`);
    } catch (error: unknown) {
      throw new Error(
        getApiErrorMessage(error, 'Failed to mark notification as read.')
      );
    }
  },

  async markAllRead() {
    try {
      return await postOne('/notifications/mark_all_read/');
    } catch (error: unknown) {
      throw new Error(
        getApiErrorMessage(error, 'Failed to mark notifications as read.')
      );
    }
  },
};

/* ============================================================================
 * Coupons / inventory / addresses
 * ========================================================================== */

export const couponApi = {
  list: async (params?: ApiListParams) =>
    getList<Coupon>('/coupons/', params),

  listPage: async (params?: ApiListParams) =>
    getPaginatedList<Coupon>('/coupons/', params),

  validate: async (payload: { code: string; amount: string | number }) =>
    postOne<CouponValidation>('/coupons/validate/', payload),
};

export const inventoryApi = {
  list: async (params?: ApiListParams) =>
    getList<Inventory>('/inventory/', params),

  listPage: async (params?: ApiListParams) =>
    getPaginatedList<Inventory>('/inventory/', params),

  movements: async (params?: ApiListParams) =>
    getList<InventoryMovement>('/inventory-movements/', params),
};

export const addressApi = {
  list: async (params?: ApiListParams) =>
    getList<CustomerAddress>('/addresses/', params),

  detail: async (id: number | string) =>
    getOne<CustomerAddress>(`/addresses/${id}/`),

  create: async (payload: CustomerAddressPayload) =>
    postOne<CustomerAddress>('/addresses/', payload),

  update: async (id: number, payload: Partial<CustomerAddressPayload>) =>
    patchOne<CustomerAddress>(`/addresses/${id}/`, payload),

  remove: async (id: number) =>
    deleteOne(`/addresses/${id}/`),
};

/* ============================================================================
 * Payments (customer)
 * ========================================================================== */

export interface InitiateMTNResponse {
  reference: string;
  external_id?: string;
  status?: PaymentStatus | string;
  amount?: string | number;
  currency?: string;
}

export interface InitiateCardPayload {
  address_id?: number;
  order?: number;
  delivery_option?: 'HOME_DELIVERY' | 'PICKUP_STATION';
  pickup_station_id?: number;
  coupon_code?: string;
  gateway?: string;
  cardholder_name: string;
  card_last4: string;
  expiry_month: number;
  expiry_year: number;
  billing_email?: string;
  billing_phone?: string;
}

export interface InitiateCardResponse {
  reference?: string;
  checkout_url?: string | null;
  status?: PaymentStatus | string;
  amount?: string | number;
  currency?: string;
}

export interface PaymentStatusResponse {
  reference: string;
  provider: PaymentProvider | string;
  status: PaymentStatus | string;
  amount?: string | number;
  currency?: string;
  phone_number?: string;
  external_id?: string | null;
  transaction_id?: string | null;
  provider_response?: Record<string, unknown> | null;
  paid_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FinalizeOrderResponse {
  order: Order;
  payment_reference?: string | null;
}

export const paymentApi = {
  list: async (params?: PaymentListParams) => {
    try {
      return await getList<Payment>('/payments/', compactObject(params ?? {}));
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Failed to load payments.'));
    }
  },

  listPage: async (params?: PaymentListParams & ApiListParams) =>
    getPaginatedList<Payment>('/payments/', compactObject(params ?? {})),

  create: async (payload: PaymentPayload) => {
    try {
      return await postOne<Payment>('/payments/', payload);
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Failed to create payment.'));
    }
  },

  initiateMTN: async (
    payload: {
      address_id?: number;
      order?: number;
      phone_number: string;
      delivery_option?: 'HOME_DELIVERY' | 'PICKUP_STATION';
      pickup_station_id?: number;
      coupon_code?: string;
    },
    options?: MutationOptions
  ): Promise<InitiateMTNResponse> => {
    try {
      return await postOne('/payments/mtn/initiate/', payload, options);
    } catch (error: unknown) {
      throw new Error(
        getApiErrorMessage(
          error,
          'Failed to start MTN payment. Please check your number and try again.'
        )
      );
    }
  },

  initiateCard: async (
    payload: InitiateCardPayload,
    options?: MutationOptions
  ): Promise<InitiateCardResponse> => {
    try {
      // TODO: Backend must use a PCI-compliant gateway token/hosted checkout
      // flow. This client must never send full PAN or CVV to GoCart servers.
      return await postOne('/payments/card/initiate/', payload, options);
    } catch (error: unknown) {
      throw new Error(
        getApiErrorMessage(
          error,
          'Failed to start card payment. Please try another payment method.'
        )
      );
    }
  },

  checkStatus: async (reference: string): Promise<PaymentStatusResponse> => {
    try {
      return await getOne(`/payments/${reference}/status/`);
    } catch (error: unknown) {
      throw new Error(
        getApiErrorMessage(
          error,
          'Failed to check payment status. Please try again.'
        )
      );
    }
  },

  finalizeOrder: async (
    reference: string,
    options?: MutationOptions
  ): Promise<FinalizeOrderResponse> => {
    try {
      return await postOne(
        `/payments/${reference}/finalize-order/`,
        undefined,
        options
      );
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, '');

      if (message.toLowerCase().includes('still being confirmed')) {
        throw new Error(
          'Payment is still being confirmed. Please wait a few seconds and try again.'
        );
      }

      throw new Error(message || 'Failed to finalize paid order.');
    }
  },

  cancel: async (reference: string, payload?: { reason?: string }) =>
    postOne<PaymentStatusResponse>(
      `/payments/${reference}/cancel/`,
      payload ?? {}
    ),

  refund: async (
    reference: string,
    payload?: { amount?: string | number; reason?: string }
  ) =>
    postOne<PaymentStatusResponse>(
      `/payments/${reference}/refund/`,
      payload ?? {}
    ),
};

/* ============================================================================
 * Shipping
 * ========================================================================== */

export const shippingApi = {
  methods: async (params?: ApiListParams) =>
    getList<ShippingMethod>('/shipping-methods/', params),

  deliveryRates: async (params?: ApiListParams) =>
    getList<DeliveryRate>('/delivery-rates/', params),

  pickupStations: async (params?: ApiListParams) =>
    getList<PickupStation>('/pickup-stations/', params),

  shipments: async (params?: ApiListParams) =>
    getList<Shipment>('/shipments/', params),

  shipment: async (id: number | string) =>
    getOne<Shipment>(`/shipments/${id}/`),

  createShipment: async (payload: ShipmentPayload) =>
    postOne<Shipment>('/shipments/', payload),
};

/* ============================================================================
 * Tenant
 * ========================================================================== */

export const tenantApi = {
  current: async () => getOne<TenantCurrentResponse>('/tenants/current/'),

  branding: async () =>
    getOne<TenantBranding>('/tenants/current/branding/'),

  updateBranding: async (payload: Partial<TenantBranding>) =>
    patchOne<TenantBranding>('/tenants/current/branding/', payload),

  settings: async () =>
    getOne<TenantSettings>('/tenants/current/settings/'),

  updateSettings: async (payload: Partial<TenantSettings>) =>
    patchOne<TenantSettings>('/tenants/current/settings/', payload),

  featureFlags: async () =>
    getList<TenantFeatureFlag>('/tenants/current/feature-flags/'),

  createFeatureFlag: async (payload: Partial<TenantFeatureFlag>) =>
    postOne<TenantFeatureFlag>('/tenants/current/feature-flags/', payload),

  memberships: async (params?: MembershipListParams) =>
    getList<TenantMembership>('/tenants/current/memberships/', compactObject(params ?? {})),

  membershipsPage: async (params?: MembershipListParams) =>
    getPaginatedList<TenantMembership>('/tenants/current/memberships/', compactObject(params ?? {})),

  membership: async (id: number | string) =>
    getOne<TenantMembership>(`/tenants/current/memberships/${id}/`),

  createMembership: async (payload: TenantMembershipPayload) =>
    postOne<TenantMembership>('/tenants/current/memberships/', payload),

  updateMembership: async (
    id: number | string,
    payload: TenantMembershipUpdatePayload
  ) => patchOne<TenantMembership>(`/tenants/current/memberships/${id}/`, compactObject(payload)),

  deleteMembership: async (id: number | string) =>
    deleteOne(`/tenants/current/memberships/${id}/`),
};

/* ============================================================================
 * Support
 * ========================================================================== */

export const supportApi = {
  create: async (payload: ContactPayload) =>
    postOne<{ detail: string; id?: number }>('/contact/', payload),

  contact: async (payload: ContactPayload) =>
    postOne<{ detail: string; id?: number }>('/contact/', payload),

  list: async (params?: ApiListParams) =>
    getList<SupportMessage>('/support-messages/', params),

  listPage: async (params?: ApiListParams) =>
    getPaginatedList<SupportMessage>('/support-messages/', params),

  detail: async (id: number | string) =>
    getOne<SupportMessage>(`/support-messages/${id}/`),

  createTicket: async (payload: ContactPayload) =>
    postOne<SupportMessage>('/support-messages/', payload),

  update: async (id: number, payload: Partial<SupportMessage>) =>
    patchOne<SupportMessage>(`/support-messages/${id}/`, payload),
};

/* ============================================================================
 * Admin dashboard
 * ========================================================================== */

export const dashboardApi = {
  summary: async (params?: ApiListParams) => {
    const { data } = await api.get<DashboardSummary>('/admin/dashboard/summary/', {
      params,
    });
    assertTenantScopedResource(data, '/admin/dashboard/summary/');
    return data;
  },
};

/* ============================================================================
 * Admin payments
 * ========================================================================== */

const ADMIN_PAYMENTS_BASE = '/admin/payments';

const adminPaymentsApi = {
  list: async (params?: PaymentListParams): Promise<Payment[]> =>
    getList<Payment>(`${ADMIN_PAYMENTS_BASE}/`, compactObject({
      status: params?.status,
      provider: params?.provider,
      search: params?.search,
    })),

  get: async (id: number): Promise<Payment> =>
    getOne<Payment>(`${ADMIN_PAYMENTS_BASE}/${id}/`),

  update: async (id: number, payload: UpdatePaymentPayload): Promise<Payment> =>
    patchOne<Payment>(`${ADMIN_PAYMENTS_BASE}/${id}/`, compactObject(payload)),

  updateStatus: async (
    id: number,
    status: PaymentStatus | string
  ): Promise<Payment> =>
    patchOne<Payment>(`${ADMIN_PAYMENTS_BASE}/${id}/`, { status }),

  updateProvider: async (
    id: number,
    provider: PaymentProvider | string
  ): Promise<Payment> =>
    patchOne<Payment>(`${ADMIN_PAYMENTS_BASE}/${id}/`, { provider }),

  updateTransactionId: async (
    id: number,
    transaction_id: string
  ): Promise<Payment> =>
    patchOne<Payment>(`${ADMIN_PAYMENTS_BASE}/${id}/`, { transaction_id }),

  markPaid: async (
    id: number,
    payload?: {
      transaction_id?: string;
      provider_response?: Record<string, unknown>;
    }
  ): Promise<Payment> =>
    patchOne<Payment>(`${ADMIN_PAYMENTS_BASE}/${id}/`, {
      status: 'PAID',
      ...payload,
    }),

  markFailed: async (
    id: number,
    payload?: {
      provider_response?: Record<string, unknown>;
    }
  ): Promise<Payment> =>
    patchOne<Payment>(`${ADMIN_PAYMENTS_BASE}/${id}/`, {
      status: 'FAILED',
      ...payload,
    }),

  markProcessing: async (id: number): Promise<Payment> =>
    patchOne<Payment>(`${ADMIN_PAYMENTS_BASE}/${id}/`, {
      status: 'PROCESSING',
    }),

  markRefunded: async (id: number): Promise<Payment> =>
    patchOne<Payment>(`${ADMIN_PAYMENTS_BASE}/${id}/`, {
      status: 'REFUNDED',
    }),

  markCancelled: async (id: number): Promise<Payment> =>
    patchOne<Payment>(`${ADMIN_PAYMENTS_BASE}/${id}/`, {
      status: 'CANCELLED',
    }),
};

/* ============================================================================
 * Admin
 * ========================================================================== */

export const adminApi = {
  /* users / tenant */
  clients: tenantApi.memberships,
  clientsPage: tenantApi.membershipsPage,
  client: tenantApi.membership,
  createClient: tenantApi.createMembership,
  updateClient: tenantApi.updateMembership,
  removeClient: tenantApi.deleteMembership,
  users: tenantApi.memberships,
  memberships: tenantApi.memberships,
  createMembership: tenantApi.createMembership,
  updateMembership: tenantApi.updateMembership,
  deleteMembership: tenantApi.deleteMembership,

  branding: tenantApi.branding,
  updateBranding: tenantApi.updateBranding,
  settings: tenantApi.settings,
  updateSettings: tenantApi.updateSettings,
  featureFlags: tenantApi.featureFlags,
  createFeatureFlag: tenantApi.createFeatureFlag,

  /* categories */
  categories: async () => getList<Category>('/categories/'),
  activeCategories: async () =>
    getList<Category>('/categories/', { is_active: true }),
  category: async (slug: string) =>
    getOne<Category>(`/categories/${slug}/`),
  createCategory: async (payload: Partial<Category> & { name: string; slug: string }) =>
    postOne<Category>('/categories/', payload),
  updateCategory: async (slug: string, payload: Record<string, unknown>) =>
    patchOne<Category>(`/categories/${slug}/`, payload),
  removeCategory: async (slug: string) =>
    deleteOne(`/categories/${slug}/`),

  /* products */
  products: async (params?: ProductQueryParams) =>
    getList<Product>('/products/', params),
  activeProducts: async () =>
    getList<Product>('/products/', { is_active: true }),
  product: async (slug: string) =>
    getOne<Product>(`/products/${slug}/`),
  createProduct: async (payload: Record<string, unknown>) =>
    postOne<Product>('/products/', payload),
  updateProduct: async (slug: string, payload: Record<string, unknown>) =>
    patchOne<Product>(`/products/${slug}/`, payload),
  removeProduct: async (slug: string) =>
    deleteOne(`/products/${slug}/`),

  variants: variantApi.list,
  variantsPage: variantApi.listPage,
  createVariant: variantApi.create,
  updateVariant: variantApi.update,
  removeVariant: variantApi.remove,

  /* orders */
  orders: async () =>
    getList<Order>('/orders/'),
  updateOrder: async (slug: string, payload: Record<string, unknown>) =>
    patchOne<Order>(`/orders/${slug}/`, payload),
  transitionOrder: async (slug: string, status: string) =>
    postOne<Order>(`/orders/${slug}/transition-status/`, { status }),
  cancelOrder: orderApi.cancel,
  requestOrderRefund: orderApi.requestRefund,

  dashboardSummary: dashboardApi.summary,

  /* payments */
  payments: adminPaymentsApi.list,
  payment: adminPaymentsApi.get,
  updatePayment: adminPaymentsApi.update,
  updatePaymentStatus: adminPaymentsApi.updateStatus,
  updatePaymentProvider: adminPaymentsApi.updateProvider,
  updatePaymentTransactionId: adminPaymentsApi.updateTransactionId,
  markPaymentPaid: adminPaymentsApi.markPaid,
  markPaymentFailed: adminPaymentsApi.markFailed,
  markPaymentProcessing: adminPaymentsApi.markProcessing,
  markPaymentRefunded: adminPaymentsApi.markRefunded,
  markPaymentCancelled: adminPaymentsApi.markCancelled,

  /* shared resources */
  inventory: inventoryApi.list,
  inventoryMovements: inventoryApi.movements,

  coupons: couponApi.list,
  createCoupon: async (payload: Record<string, unknown>) =>
    postOne<Coupon>('/coupons/', payload),
  updateCoupon: async (id: number, payload: Record<string, unknown>) =>
    patchOne<Coupon>(`/coupons/${id}/`, payload),
  removeCoupon: async (id: number) =>
    deleteOne(`/coupons/${id}/`),

  notifications: async () => normalizeList<Notification>(await notificationApi.list()),
  createNotification: async (payload: Record<string, unknown>) =>
    postOne<Notification>('/notifications/', payload),
  updateNotification: async (id: number, payload: Record<string, unknown>) =>
    patchOne<Notification>(`/notifications/${id}/`, payload),
  removeNotification: async (id: number) =>
    deleteOne(`/notifications/${id}/`),
  markNotificationRead: async (id: number) =>
    postOne<Notification>(`/notifications/${id}/mark_read/`),

  supportMessages: supportApi.list,
  updateSupportMessage: supportApi.update,

  addresses: addressApi.list,

  shippingMethods: shippingApi.methods,
  deliveryRates: shippingApi.deliveryRates,
  pickupStations: shippingApi.pickupStations,
  shipments: shippingApi.shipments,

  reviews: catalogApi.reviews,
  ratings: catalogApi.ratings,

  wishlists: async () =>
    getList<Wishlist>('/wishlist/'),
  wishlistItems: async () =>
    getList<WishlistItem>('/wishlist-items/'),

  carts: async () =>
    getList<Cart>('/cart/'),
  cartItems: cartApi.listItems,

  orderItems: async () =>
    getList<OrderItem>('/order-items/'),

  createCart: async () =>
    postOne<Cart>('/cart/', {}),
  removeCart: async (id: number) =>
    deleteOne(`/cart/${id}/`),

  createCartItem: async (payload: { variant_id: number; quantity: number }) =>
    postOne<CartItem>('/cart-items/', payload),
  updateCartItem: async (
    id: number,
    payload: { quantity?: number; variant_id?: number }
  ) => patchOne<CartItem>(`/cart-items/${id}/`, payload),
  removeCartItem: async (id: number) =>
    deleteOne(`/cart-items/${id}/`),

  createOrder: async (payload: { slug: string; description: string }) =>
    postOne<Order>('/orders/', payload),
  removeOrder: async (slug: string) =>
    deleteOne(`/orders/${slug}/`),

  createOrderItem: async (payload: {
    order: number;
    product: number;
    quantity: number;
  }) => postOne<OrderItem>('/order-items/', payload),
  updateOrderItem: async (id: number, payload: Record<string, unknown>) =>
    patchOne<OrderItem>(`/order-items/${id}/`, payload),
  removeOrderItem: async (id: number) =>
    deleteOne(`/order-items/${id}/`),

  createReview: async (payload: {
    product: number;
    rating: number;
    comment: string;
  }) => postOne<Review>('/reviews/', payload),
  updateReview: async (id: number, payload: Record<string, unknown>) =>
    patchOne<Review>(`/reviews/${id}/`, payload),
  removeReview: async (id: number) =>
    deleteOne(`/reviews/${id}/`),

  createWishlist: async () =>
    postOne<Wishlist>('/wishlist/', {}),
  removeWishlist: async (id: number) =>
    deleteOne(`/wishlist/${id}/`),

  createWishlistItem: async (payload: { product_id: number }) =>
    postOne<WishlistItem>('/wishlist-items/', payload),
  removeWishlistItem: async (id: number) =>
    deleteOne(`/wishlist-items/${id}/`),

  createAddress: async (payload: CustomerAddressPayload) =>
    postOne<CustomerAddress>('/addresses/', payload),
  updateAddress: async (id: number, payload: Record<string, unknown>) =>
    patchOne<CustomerAddress>(`/addresses/${id}/`, payload),
  removeAddress: async (id: number) =>
    deleteOne(`/addresses/${id}/`),

  createPayment: async (payload: PaymentPayload) =>
    postOne<Payment>('/payments/', payload),

  createShippingMethod: async (payload: ShippingMethodPayload) =>
    postOne<ShippingMethod>('/shipping-methods/', payload),
  updateShippingMethod: async (id: number, payload: Record<string, unknown>) =>
    patchOne<ShippingMethod>(`/shipping-methods/${id}/`, payload),
  removeShippingMethod: async (id: number) =>
    deleteOne(`/shipping-methods/${id}/`),

  createDeliveryRate: async (payload: DeliveryRatePayload) =>
    postOne<DeliveryRate>('/delivery-rates/', payload),
  updateDeliveryRate: async (
    id: number,
    payload: Partial<DeliveryRatePayload>
  ) => patchOne<DeliveryRate>(`/delivery-rates/${id}/`, payload),
  removeDeliveryRate: async (id: number) =>
    deleteOne(`/delivery-rates/${id}/`),

  createPickupStation: async (payload: PickupStationPayload) =>
    postOne<PickupStation>('/pickup-stations/', payload),
  updatePickupStation: async (
    id: number,
    payload: Partial<PickupStationPayload>
  ) => patchOne<PickupStation>(`/pickup-stations/${id}/`, payload),
  removePickupStation: async (id: number) =>
    deleteOne(`/pickup-stations/${id}/`),

  createShipment: async (payload: ShipmentPayload) =>
    postOne<Shipment>('/shipments/', payload),
  updateShipment: async (id: number, payload: Record<string, unknown>) =>
    patchOne<Shipment>(`/shipments/${id}/`, payload),
  removeShipment: async (id: number) =>
    deleteOne(`/shipments/${id}/`),
  markShipmentShipped: async (id: number, payload: { tracking_number?: string }) =>
    postOne<Shipment>(`/shipments/${id}/mark_shipped/`, payload),
  markShipmentInTransit: async (id: number) =>
    postOne<Shipment>(`/shipments/${id}/mark_in_transit/`),
  markShipmentDelivered: async (id: number) =>
    postOne<Shipment>(`/shipments/${id}/mark_delivered/`),

  createInventory: async (payload: Record<string, unknown>) =>
    postOne<Inventory>('/inventory/', payload),
  updateInventory: async (id: number, payload: Record<string, unknown>) =>
    patchOne<Inventory>(`/inventory/${id}/`, payload),
  removeInventory: async (id: number) =>
    deleteOne(`/inventory/${id}/`),
  adjustInventory: async (id: number, payload: Record<string, unknown>) =>
    postOne(`/inventory/${id}/adjust/`, payload),
};
