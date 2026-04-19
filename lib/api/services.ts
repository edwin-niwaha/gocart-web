import {
  api,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  normalizeList,
  setTokens,
} from './client';
import { notifyCartUpdated } from '@/lib/cart-events';
import type {
  Address,
  AddressPayload,
  AuthResponse,
  Cart,
  CartItem,
  Category,
  Coupon,
  CouponValidation,
  Inventory,
  InventoryMovement,
  Notification,
  Order,
  OrderItem,
  Payment as BasePayment,
  PaymentPayload,
  Product,
  ProductRating,
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

function compactObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

function getApiErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data;

  if (!data) return fallback;

  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.message === 'string') return data.message;

  if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) {
    return String(data.non_field_errors[0]);
  }

  if (data && typeof data === 'object') {
    const firstValue = Object.values(data)[0];

    if (Array.isArray(firstValue) && firstValue[0]) {
      return String(firstValue[0]);
    }

    if (typeof firstValue === 'string') {
      return firstValue;
    }

    try {
      return JSON.stringify(data);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

async function getList<T>(url: string, params?: Record<string, unknown>): Promise<T[]> {
  const { data } = await api.get<ListResponse<T>>(url, { params });
  return normalizeList(data);
}

async function getOne<T>(url: string): Promise<T> {
  const { data } = await api.get<T>(url);
  return data;
}

async function postOne<T>(url: string, payload?: unknown): Promise<T> {
  const { data } = await api.post<T>(url, payload);
  return data;
}

async function patchOne<T>(url: string, payload?: unknown): Promise<T> {
  const { data } = await api.patch<T>(url, payload);
  return data;
}

async function deleteOne<T = unknown>(url: string): Promise<T> {
  const { data } = await api.delete<T>(url);
  return data;
}

/* ============================================================================
 * Query / domain types
 * ========================================================================== */

type ProductQueryParams = {
  category?: string | number;
  is_featured?: boolean;
  is_active?: boolean;
  search?: string;
  ordering?: string;
};

type ReviewQueryParams = {
  product?: number;
};

type RatingQueryParams = {
  product?: number;
};

type ReviewOrParams = number | ReviewQueryParams;
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
  'STRIPE',
  'PAYSTACK',
  'FLUTTERWAVE',
  'MTN',
  'AIRTEL',
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
    return data;
  },

  login: async (payload: { email: string; password: string }) => {
    const data = await postOne<AuthResponse>('/auth/login/', payload);
    setTokens(data.tokens.access, data.tokens.refresh);
    return data;
  },

  googleLogin: async (access_token: string) => {
    const data = await postOne<AuthResponse>('/auth/social/google/', {
      access_token,
    });
    setTokens(data.tokens.access, data.tokens.refresh);
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

  product: async (slug: string) =>
    getOne<Product>(`/products/${slug}/`),

  categories: async () =>
    getList<Category>('/categories/'),

  category: async (slug: string) =>
    getOne<Category>(`/categories/${slug}/`),

  reviews: async (productOrParams?: ReviewOrParams) => {
    const params =
      typeof productOrParams === 'number'
        ? { product: productOrParams }
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
 * Cart
 * ========================================================================== */

export const cartApi = {
  async ensure() {
    try {
      return await postOne<Cart>('/carts/', {});
    } catch {
      const carts = await getList<Cart>('/carts/');
      return carts[0];
    }
  },

  async listItems() {
    try {
      return await getList<CartItem>('/cart-items/');
    } catch (error: any) {
      console.log('GET /cart-items/ error:', error?.response?.data || error.message);
      throw new Error(
        getApiErrorMessage(error, 'Failed to load cart items.')
      );
    }
  },

  async addItem(payload: { variant_id: number; quantity: number }) {
    try {
      const data = await postOne<CartItem>('/cart-items/', payload);
      notifyCartUpdated();
      return data;
    } catch (error: any) {
      console.log('POST /cart-items/ error:', error?.response?.data || error.message);
      throw new Error(getApiErrorMessage(error, 'Failed to add item to cart.'));
    }
  },

  async updateItem(
    id: number,
    payload: { quantity?: number; variant_id?: number }
  ) {
    try {
      const data = await patchOne<CartItem>(`/cart-items/${id}/`, payload);
      notifyCartUpdated();
      return data;
    } catch (error: any) {
      console.log(
        `PATCH /cart-items/${id}/ error:`,
        error?.response?.data || error.message
      );
      throw new Error(getApiErrorMessage(error, 'Failed to update cart item.'));
    }
  },

  async removeItem(id: number) {
    try {
      await deleteOne(`/cart-items/${id}/`);
      notifyCartUpdated();
      return { success: true };
    } catch (error: any) {
      console.log(
        `DELETE /cart-items/${id}/ error:`,
        error?.response?.data || error.message
      );
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

  listItems: async () =>
    getList<WishlistItem>('/wishlist-items/'),

  addItem: async (payload: { product_id: number }) => {
    try {
      return await postOne<WishlistItem>('/wishlist-items/', payload);
    } catch (error) {
      console.error('wishlistApi.addItem failed:', error);
      throw error;
    }
  },

  removeItem: async (id: number) => {
    try {
      return await deleteOne(`/wishlist-items/${id}/`);
    } catch (error) {
      console.error('wishlistApi.removeItem failed:', error);
      throw error;
    }
  },
};

/* ============================================================================
 * Orders
 * ========================================================================== */

export const orderApi = {
  list: async () =>
    getList<Order>('/orders/'),

  detail: async (slug: string) =>
    getOne<Order>(`/orders/${slug}/`),

  checkout: async (payload: {
    address_id: number;
    payment_method?: string;
    shipping_method_id?: number;
    coupon_code?: string;
  }) => postOne<Order>('/orders/checkout/', payload),

  update: async (slug: string, payload: Record<string, unknown>) =>
    patchOne<Order>(`/orders/${slug}/`, payload),

  removeItem: async (id: number) =>
    deleteOne(`/orders/${id}/`),
};

/* ============================================================================
 * Notifications
 * ========================================================================== */

export const notificationApi = {
  async list(url?: string): Promise<PaginatedResponse<Notification>> {
    try {
      const endpoint = url ?? '/notifications/';
      const { data } = await api.get<PaginatedResponse<Notification>>(endpoint);

      if (Array.isArray(data)) return data;
      if (isPaginatedResponse(data)) return data;

      return {
        count: 0,
        next: null,
        previous: null,
        results: [],
      };
    } catch (error: any) {
      console.log(
        `GET ${url ?? '/notifications/'} error:`,
        error?.response?.data || error.message
      );
      throw error;
    }
  },

  async markRead(id: number): Promise<Notification> {
    try {
      return await postOne<Notification>(`/notifications/${id}/mark_read/`);
    } catch (error: any) {
      console.log(
        `POST /notifications/${id}/mark_read/ error:`,
        error?.response?.data || error.message
      );
      throw error;
    }
  },

  async markAllRead() {
    try {
      return await postOne('/notifications/mark_all_read/');
    } catch (error: any) {
      console.log(
        'POST /notifications/mark_all_read/ error:',
        error?.response?.data || error.message
      );
      throw error;
    }
  },
};

/* ============================================================================
 * Coupons / inventory / addresses
 * ========================================================================== */

export const couponApi = {
  list: async () =>
    getList<Coupon>('/coupons/'),

  validate: async (payload: { code: string; amount: string | number }) =>
    postOne<CouponValidation>('/coupons/validate/', payload),
};

export const inventoryApi = {
  list: async () =>
    getList<Inventory>('/inventory/'),

  movements: async () =>
    getList<InventoryMovement>('/inventory-movements/'),
};

export const addressApi = {
  list: async () =>
    getList<Address>('/addresses/'),

  create: async (payload: AddressPayload) =>
    postOne<Address>('/addresses/', payload),

  update: async (id: number, payload: Partial<AddressPayload>) =>
    patchOne<Address>(`/addresses/${id}/`, payload),

  remove: async (id: number) =>
    deleteOne(`/addresses/${id}/`),
};

/* ============================================================================
 * Payments (customer)
 * ========================================================================== */

export const paymentApi = {
  list: async () => {
    try {
      return await getList<Payment>('/payments/');
    } catch (error: any) {
      console.log('GET /payments/ error:', error?.response?.data || error.message);
      throw new Error(getApiErrorMessage(error, 'Failed to load payments.'));
    }
  },

  create: async (payload: PaymentPayload) => {
    try {
      return await postOne<Payment>('/payments/', payload);
    } catch (error: any) {
      console.log('POST /payments/ error:', error?.response?.data || error.message);
      throw new Error(getApiErrorMessage(error, 'Failed to create payment.'));
    }
  },

  initiateMTN: async (payload: {
    address_id?: number;
    order?: number;
    phone_number: string;
  }) => {
    try {
      return await postOne('/payments/mtn/initiate/', payload);
    } catch (error: any) {
      console.log(
        'POST /payments/mtn/initiate/ error:',
        error?.response?.data || error.message
      );

      throw new Error(
        getApiErrorMessage(
          error,
          'Failed to start MTN payment. Please check your number and try again.'
        )
      );
    }
  },

  checkStatus: async (reference: string) => {
    try {
      return await getOne(`/payments/${reference}/status/`);
    } catch (error: any) {
      console.log(
        `GET /payments/${reference}/status/ error:`,
        error?.response?.data || error.message
      );

      throw new Error(
        getApiErrorMessage(
          error,
          'Failed to check payment status. Please try again.'
        )
      );
    }
  },

  finalizeOrder: async (reference: string) => {
    try {
      return await postOne(`/payments/${reference}/finalize-order/`);
    } catch (error: any) {
      console.log(
        `POST /payments/${reference}/finalize-order/ error:`,
        error?.response?.data || error.message
      );

      const message = getApiErrorMessage(error, '');

      if (message.toLowerCase().includes('still being confirmed')) {
        throw new Error(
          'Payment is still being confirmed. Please wait a few seconds and try again.'
        );
      }

      throw new Error(message || 'Failed to finalize paid order.');
    }
  },
};

/* ============================================================================
 * Shipping
 * ========================================================================== */

export const shippingApi = {
  methods: async () =>
    getList<ShippingMethod>('/shipping-methods/'),

  shipments: async () =>
    getList<Shipment>('/shipments/'),

  createShipment: async (payload: ShipmentPayload) =>
    postOne<Shipment>('/shipments/', payload),
};

/* ============================================================================
 * Tenant
 * ========================================================================== */

export const tenantApi = {
  current: async () => getOne('/tenants/current/'),

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

  memberships: async () =>
    getList<TenantMembership>('/tenants/current/memberships/'),

  createMembership: async (payload: Record<string, unknown>) =>
    postOne<TenantMembership>('/tenants/current/memberships/', payload),

  updateMembership: async (id: number | string, payload: Record<string, unknown>) =>
    patchOne<TenantMembership>(`/tenants/current/memberships/${id}/`, payload),
};

/* ============================================================================
 * Support
 * ========================================================================== */

export const supportApi = {
  create: async (payload: ContactPayload) =>
    postOne<{ detail: string; id?: number }>('/contact/', payload),

  list: async () =>
    getList<SupportMessage>('/support-messages/'),

  update: async (id: number, payload: Partial<SupportMessage>) =>
    patchOne<SupportMessage>(`/support-messages/${id}/`, payload),
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
  users: tenantApi.memberships,
  memberships: tenantApi.memberships,
  createMembership: tenantApi.createMembership,
  updateMembership: tenantApi.updateMembership,

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

  /* orders */
  orders: async () =>
    getList<Order>('/orders/'),
  updateOrder: async (slug: string, payload: Record<string, unknown>) =>
    patchOne<Order>(`/orders/${slug}/`, payload),
  transitionOrder: async (slug: string, status: string) =>
    postOne<Order>(`/orders/${slug}/transition-status/`, { status }),

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

  notifications: notificationApi.list,
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
  shipments: shippingApi.shipments,

  reviews: catalogApi.reviews,
  ratings: catalogApi.ratings,

  wishlists: async () =>
    getList<Wishlist>('/wishlist/'),
  wishlistItems: async () =>
    getList<WishlistItem>('/wishlist-items/'),

  carts: async () =>
    getList<Cart>('/carts/'),
  cartItems: cartApi.listItems,

  orderItems: async () =>
    getList<OrderItem>('/order-items/'),

  createCart: async () =>
    postOne<Cart>('/carts/', {}),
  removeCart: async (id: number) =>
    deleteOne(`/carts/${id}/`),

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

  createAddress: async (payload: AddressPayload) =>
    postOne<Address>('/addresses/', payload),
  updateAddress: async (id: number, payload: Record<string, unknown>) =>
    patchOne<Address>(`/addresses/${id}/`, payload),
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