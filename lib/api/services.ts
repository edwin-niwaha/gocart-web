import { api, clearTokens, getAccessToken, getRefreshToken, normalizeList, setTokens } from './client';
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
  Payment,
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

export const authApi = {
  register: async (payload: {
    email: string;
    username: string;
    password: string;
    password_confirm: string;
  }) => {
    const { data } = await api.post<AuthResponse>('/auth/register/', payload);
    setTokens(data.tokens.access, data.tokens.refresh);
    return data;
  },

  login: async (payload: { email: string; password: string }) => {
    const { data } = await api.post<AuthResponse>('/auth/login/', payload);
    setTokens(data.tokens.access, data.tokens.refresh);
    return data;
  },

  googleLogin: async (access_token: string) => {
    const { data } = await api.post<AuthResponse>('/auth/social/google/', { access_token });
    setTokens(data.tokens.access, data.tokens.refresh);
    return data;
  },

  me: async () => {
    const token = getAccessToken();
    if (!token) throw new Error('No access token found');
    const { data } = await api.get<User>('/auth/me/');
    return data;
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
  }) => {
    const { data } = await api.post('/auth/change-password/', payload);
    return data;
  },

  forgotPassword: async (email: string) => {
    const { data } = await api.post('/auth/forgot-password/', { email });
    return data;
  },

  resetPassword: async (payload: {
    email: string;
    code: string;
    password: string;
    password_confirm: string;
  }) => {
    const { data } = await api.post('/auth/reset-password/', payload);
    return data;
  },

  sendEmailVerification: async () => {
    const { data } = await api.post('/auth/send-email-verification/');
    return data;
  },

  verifyEmail: async (code: string) => {
    const { data } = await api.post('/auth/verify-email/', { code });
    return data;
  },
  
  logout: async () => {
    const refresh = getRefreshToken();
    try {
      if (refresh) {
        await api.post('/auth/logout/', { refresh });
      }
    } finally {
      clearTokens();
    }
  },
};

export const catalogApi = {
  products: async (params?: ProductQueryParams) =>
    normalizeList(
      (
        await api.get<Product[] | { results: Product[] }>('/products/', {
          params,
        })
      ).data
    ),

  product: async (slug: string) =>
    (await api.get<Product>(`/products/${slug}/`)).data,

  categories: async () =>
    normalizeList(
      (await api.get<Category[] | { results: Category[] }>('/categories/')).data
    ),

  category: async (slug: string) =>
    (await api.get<Category>(`/categories/${slug}/`)).data,

  reviews: async (productOrParams?: ReviewOrParams) => {
    const params =
      typeof productOrParams === 'number'
        ? { product: productOrParams }
        : productOrParams;

    return normalizeList(
      (
        await api.get<Review[] | { results: Review[] }>('/reviews/', {
          params,
        })
      ).data
    );
  },

  ratings: async (productOrParams?: RatingOrParams) => {
    const params =
      typeof productOrParams === 'number'
        ? { product: productOrParams }
        : productOrParams;

    return normalizeList(
      (
        await api.get<ProductRating[] | { results: ProductRating[] }>('/ratings/', {
          params,
        })
      ).data
    );
  },

  createReview: async (payload: {
    product: number;
    rating: number;
    comment: string;
  }) => (await api.post<Review>('/reviews/', payload)).data,
};

export const commonApi = {
  subscribeToNewsletter(payload: { email: string }) {
    return api.post('/newsletter/', payload);
  },
};

export const cartApi = {
  getOrCreate: async () => (await api.post<Cart>('/carts/', {})).data,

  listItems: async () =>
    normalizeList(
      (await api.get<CartItem[] | { results: CartItem[] }>('/cart-items/')).data
    ),

  addItem: async (payload: { variant_id: number; quantity: number }) => {
    try {
      return (await api.post<CartItem>('/cart-items/', payload)).data;
    } catch (error) {
      console.error('cartApi.addItem failed:', error);
      throw error;
    }
  },

  updateItem: async (id: number, payload: { quantity: number }) => {
    try {
      return (await api.patch<CartItem>(`/cart-items/${id}/`, payload)).data;
    } catch (error) {
      console.error('cartApi.updateItem failed:', error);
      throw error;
    }
  },

  removeItem: async (id: number) => {
    try {
      return (await api.delete(`/cart-items/${id}/`)).data;
    } catch (error) {
      console.error('cartApi.removeItem failed:', error);
      throw error;
    }
  },
};

export const reviewApi = {
  myReviews: async (params?: { product?: number; product_slug?: string }) => {
    const response = await api.get('/reviews/', { params });
    return response.data;
  },

  create: async (payload: {
    product: number;
    rating: number;
    comment: string;
  }) => {
    const response = await api.post('/reviews/', payload);
    return response.data;
  },

  update: async (
    id: number,
    payload: {
      rating: number;
      comment: string;
    }
  ) => {
    const response = await api.patch(`/reviews/${id}/`, payload);
    return response.data;
  },

  remove: async (id: number) => {
    const response = await api.delete(`/reviews/${id}/`);
    return response.data;
  },

  myReviewForProduct: async (product_slug: string) => {
    const response = await api.get('/reviews/', {
      params: { product_slug },
    });

    const data = response.data;

    if (Array.isArray(data)) return data[0] ?? null;
    if (Array.isArray(data?.results)) return data.results[0] ?? null;

    return null;
  },
};

export const productReviewApi = {
  listBySlug: async (slug: string) => {
    const response = await api.get('/product-reviews/', {
      params: { product_slug: slug },
    });

    const data = response.data;

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
    const response = await api.get('/product-reviews/', {
      params: {
        ...(product ? { product } : {}),
        ...(product_slug ? { product_slug } : {}),
      },
    });

    const data = response.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;

    return [];
  },
};

export const productRatingApi = {
  listByProduct: async (params: { product?: number; product_slug?: string }) => {
    const response = await api.get('/product-ratings/', { params });
    return response.data;
  },
};

export const wishlistApi = {
  getOrCreate: async () => (await api.post<Wishlist>('/wishlist/', {})).data,

  listItems: async () =>
    normalizeList(
      (await api.get<WishlistItem[] | { results: WishlistItem[] }>('/wishlist-items/')).data
    ),

  addItem: async (payload: { product_id: number }) => {
    try {
      return (await api.post<WishlistItem>('/wishlist-items/', payload)).data;
    } catch (error) {
      console.error('wishlistApi.addItem failed:', error);
      throw error;
    }
  },

  removeItem: async (id: number) => {
    try {
      return (await api.delete(`/wishlist-items/${id}/`)).data;
    } catch (error) {
      console.error('wishlistApi.removeItem failed:', error);
      throw error;
    }
  },
};


export const orderApi = {
  list: async () =>
    normalizeList((await api.get<Order[] | { results: Order[] }>('/orders/')).data),

  detail: async (slug: string) =>
    (await api.get<Order>(`/orders/${slug}/`)).data,

  checkout: async (payload: {
    address_id: number;
    payment_method?: string;
    shipping_method_id?: number;
    coupon_code?: string;
  }) => (await api.post<Order>('/orders/checkout/', payload)).data,

  create: async (payload: {
    address_id?: number;
    payment_method?: string;
    shipping_method_id?: number;
    coupon_code?: string;
  }) =>
    (
      await api.post<Order>('/orders/checkout/', {
        address_id: payload.address_id ?? 1,
        payment_method: payload.payment_method,
        shipping_method_id: payload.shipping_method_id,
        coupon_code: payload.coupon_code,
      })
    ).data,

  update: async (slug: string, payload: Record<string, unknown>) =>
    (await api.patch<Order>(`/orders/${slug}/`, payload)).data,

  removeItem: async (id: number) => api.delete(`/orders/${id}/`),

  addItem: async (payload: {
    address_id?: number;
    payment_method?: string;
    shipping_method_id?: number;
    coupon_code?: string;
  }) =>
    (
      await api.post<Order>('/orders/checkout/', {
        address_id: payload.address_id ?? 1,
        payment_method: payload.payment_method,
        shipping_method_id: payload.shipping_method_id,
        coupon_code: payload.coupon_code,
      })
    ).data,
};

export const notificationApi = {
  list: async () =>
    normalizeList(
      (await api.get<Notification[] | { results: Notification[] }>('/notifications/')).data
    ),

  markRead: async (id: number) =>
    (await api.post<Notification>(`/notifications/${id}/mark-read/`)).data,

  markAllRead: async () => {
    const items = normalizeList(
      (await api.get<Notification[] | { results: Notification[] }>('/notifications/')).data
    );

    await Promise.all(
      items
        .filter((n) => !(n as any).is_read)
        .map((n) => api.post(`/notifications/${(n as any).id}/mark-read/`))
    );

    return true;
  },
};

export const couponApi = {
  list: async () =>
    normalizeList((await api.get<Coupon[] | { results: Coupon[] }>('/coupons/')).data),

  validate: async (payload: { code: string; amount: string | number }) =>
    (await api.post<CouponValidation>('/coupons/validate/', payload)).data,
};

export const inventoryApi = {
  list: async () =>
    normalizeList((await api.get<Inventory[] | { results: Inventory[] }>('/inventory/')).data),

  movements: async () =>
    normalizeList(
      (await api.get<InventoryMovement[] | { results: InventoryMovement[] }>('/inventory-movements/')).data
    ),
};

export const addressApi = {
  list: async () =>
    normalizeList((await api.get<Address[] | { results: Address[] }>('/addresses/')).data),

  create: async (payload: AddressPayload) =>
    (await api.post<Address>('/addresses/', payload)).data,

  update: async (id: number, payload: Partial<AddressPayload>) =>
    (await api.patch<Address>(`/addresses/${id}/`, payload)).data,

  remove: async (id: number) =>
    (await api.delete(`/addresses/${id}/`)).data,
};

export const paymentApi = {
  list: async () =>
    normalizeList((await api.get<Payment[] | { results: Payment[] }>('/payments/')).data),

  create: async (payload: PaymentPayload) =>
    (await api.post<Payment>('/payments/', payload)).data,

  initiateMTN: async (payload: {
    address_id: number;
    phone_number: string;
  }) => (await api.post('/payments/mtn/initiate/', payload)).data,

  checkStatus: async (reference: string) =>
    (await api.get(`/payments/status/${reference}/`)).data,

  finalizeOrder: async (reference: string) =>
    (await api.post(`/payments/finalize/${reference}/`)).data,
};

export const shippingApi = {
  methods: async () =>
    normalizeList(
      (await api.get<ShippingMethod[] | { results: ShippingMethod[] }>('/shipping-methods/')).data
    ),

  shipments: async () =>
    normalizeList((await api.get<Shipment[] | { results: Shipment[] }>('/shipments/')).data),

  createShipment: async (payload: ShipmentPayload) =>
    (await api.post<Shipment>('/shipments/', payload)).data,
};

export const tenantApi = {
  current: async () => (await api.get('/tenants/current/')).data,
  branding: async () => (await api.get<TenantBranding>('/tenants/current/branding/')).data,
  updateBranding: async (payload: Partial<TenantBranding>) =>
    (await api.patch<TenantBranding>('/tenants/current/branding/', payload)).data,
  settings: async () => (await api.get<TenantSettings>('/tenants/current/settings/')).data,
  updateSettings: async (payload: Partial<TenantSettings>) =>
    (await api.patch<TenantSettings>('/tenants/current/settings/', payload)).data,
  featureFlags: async () =>
    normalizeList(
      (await api.get<TenantFeatureFlag[] | { results: TenantFeatureFlag[] }>('/tenants/current/feature-flags/')).data
    ),
  createFeatureFlag: async (payload: Partial<TenantFeatureFlag>) =>
    (await api.post<TenantFeatureFlag>('/tenants/current/feature-flags/', payload)).data,
  memberships: async () =>
    normalizeList(
      (await api.get<TenantMembership[] | { results: TenantMembership[] }>('/tenants/current/memberships/')).data
    ),
  createMembership: async (payload: Record<string, unknown>) =>
    (await api.post<TenantMembership>('/tenants/current/memberships/', payload)).data,
  updateMembership: async (id: number | string, payload: Record<string, unknown>) =>
    (await api.patch<TenantMembership>(`/tenants/current/memberships/${id}/`, payload)).data,
};

export type ContactPayload = {
  name: string;
  email: string;
  message: string;
  subject?: string;
};

export const supportApi = {
  create: async (payload: ContactPayload) =>
    (await api.post<{ detail: string; id?: number }>('/contact/', payload)).data,

  list: async () =>
    normalizeList(
      (
        await api.get<SupportMessage[] | { results: SupportMessage[] }>(
          '/support-messages/'
        )
      ).data
    ),

  update: async (id: number, payload: Partial<SupportMessage>) =>
    (await api.patch<SupportMessage>(`/support-messages/${id}/`, payload)).data,
};

export const adminApi = {
  users: tenantApi.memberships,

  categories: async () =>
    normalizeList((await api.get<Category[] | { results: Category[] }>('/categories/')).data),

  activeCategories: async () =>
    normalizeList(
      (await api.get<Category[] | { results: Category[] }>('/categories/', { params: { is_active: true } })).data
    ),

  category: async (slug: string) =>
    (await api.get<Category>(`/categories/${slug}/`)).data,

  createCategory: async (payload: Partial<Category> & { name: string; slug: string }) =>
    (await api.post<Category>('/categories/', payload)).data,

  updateCategory: async (slug: string, payload: Record<string, unknown>) =>
    (await api.patch<Category>(`/categories/${slug}/`, payload)).data,

  removeCategory: async (slug: string) =>
    (await api.delete(`/categories/${slug}/`)).data,

  products: async (params?: ProductQueryParams) =>
    normalizeList(
      (
        await api.get<Product[] | { results: Product[] }>('/products/', {
          params,
        })
      ).data
    ),

  activeProducts: async () =>
    normalizeList(
      (await api.get<Product[] | { results: Product[] }>('/products/', { params: { is_active: true } })).data
    ),

  product: async (slug: string) =>
    (await api.get<Product>(`/products/${slug}/`)).data,

  createProduct: async (payload: Record<string, unknown>) =>
    (await api.post<Product>('/products/', payload)).data,

  updateProduct: async (slug: string, payload: Record<string, unknown>) =>
    (await api.patch<Product>(`/products/${slug}/`, payload)).data,

  removeProduct: async (slug: string) =>
    (await api.delete(`/products/${slug}/`)).data,

  orders: async () =>
    normalizeList((await api.get<Order[] | { results: Order[] }>('/orders/')).data),

  updateOrder: async (slug: string, payload: Record<string, unknown>) =>
    (await api.patch<Order>(`/orders/${slug}/`, payload)).data,

  transitionOrder: async (slug: string, status: string) =>
    (await api.post<Order>(`/orders/${slug}/transition-status/`, { status })).data,

  payments: async () =>
    normalizeList((await api.get<Payment[] | { results: Payment[] }>('/payments/')).data),

  inventory: inventoryApi.list,

  coupons: async () =>
    normalizeList((await api.get<Coupon[] | { results: Coupon[] }>('/coupons/')).data),

  createCoupon: async (payload: Record<string, unknown>) =>
    (await api.post<Coupon>('/coupons/', payload)).data,

  updateCoupon: async (id: number, payload: Record<string, unknown>) =>
    (await api.patch<Coupon>(`/coupons/${id}/`, payload)).data,

  removeCoupon: async (id: number) =>
    (await api.delete(`/coupons/${id}/`)).data,

  notifications: notificationApi.list,
  supportMessages: supportApi.list,
  updateSupportMessage: supportApi.update,
  branding: tenantApi.branding,
  updateBranding: tenantApi.updateBranding,
  settings: tenantApi.settings,
  updateSettings: tenantApi.updateSettings,
  featureFlags: tenantApi.featureFlags,
  createFeatureFlag: tenantApi.createFeatureFlag,
  memberships: tenantApi.memberships,
  createMembership: tenantApi.createMembership,
  updateMembership: tenantApi.updateMembership,
  addresses: addressApi.list,
  paymentsList: paymentApi.list,
  shippingMethods: shippingApi.methods,
  shipments: shippingApi.shipments,
  reviews: catalogApi.reviews,
  ratings: catalogApi.ratings,

  wishlists: async () =>
    normalizeList((await api.get<Wishlist[] | { results: Wishlist[] }>('/wishlist/')).data),

  wishlistItems: async () =>
    normalizeList(
      (await api.get<WishlistItem[] | { results: WishlistItem[] }>('/wishlist-items/')).data
    ),

  carts: async () =>
    normalizeList((await api.get<Cart[] | { results: Cart[] }>('/carts/')).data),

  cartItems: cartApi.listItems,

  orderItems: async () =>
    normalizeList((await api.get<OrderItem[] | { results: OrderItem[] }>('/order-items/')).data),

  inventoryMovements: inventoryApi.movements,

  createCart: async () => (await api.post<Cart>('/carts/', {})).data,

  removeCart: async (id: number) => (await api.delete(`/carts/${id}/`)).data,

  createCartItem: async (payload: { variant_id: number; quantity: number }) =>
    (await api.post<CartItem>('/cart-items/', payload)).data,

  updateCartItem: async (id: number, payload: { quantity?: number; variant_id?: number }) =>
    (await api.patch<CartItem>(`/cart-items/${id}/`, payload)).data,

  removeCartItem: async (id: number) =>
    (await api.delete(`/cart-items/${id}/`)).data,

  createOrder: async (payload: { slug: string; description: string }) =>
    (await api.post<Order>('/orders/', payload)).data,

  removeOrder: async (slug: string) =>
    (await api.delete(`/orders/${slug}/`)).data,

  createOrderItem: async (payload: { order: number; product: number; quantity: number }) =>
    (await api.post<OrderItem>('/order-items/', payload)).data,

  updateOrderItem: async (id: number, payload: Record<string, unknown>) =>
    (await api.patch<OrderItem>(`/order-items/${id}/`, payload)).data,

  removeOrderItem: async (id: number) =>
    (await api.delete(`/order-items/${id}/`)).data,

  createReview: async (payload: { product: number; rating: number; comment: string }) =>
    (await api.post<Review>('/reviews/', payload)).data,

  updateReview: async (id: number, payload: Record<string, unknown>) =>
    (await api.patch<Review>(`/reviews/${id}/`, payload)).data,

  removeReview: async (id: number) =>
    (await api.delete(`/reviews/${id}/`)).data,

  createWishlist: async () =>
    (await api.post<Wishlist>('/wishlist/', {})).data,

  removeWishlist: async (id: number) =>
    (await api.delete(`/wishlist/${id}/`)).data,

  createWishlistItem: async (payload: { product_id: number }) =>
    (await api.post<WishlistItem>('/wishlist-items/', payload)).data,

  removeWishlistItem: async (id: number) =>
    (await api.delete(`/wishlist-items/${id}/`)).data,

  createAddress: async (payload: AddressPayload) =>
    (await api.post<Address>('/addresses/', payload)).data,

  updateAddress: async (id: number, payload: Record<string, unknown>) =>
    (await api.patch<Address>(`/addresses/${id}/`, payload)).data,

  removeAddress: async (id: number) =>
    (await api.delete(`/addresses/${id}/`)).data,

  createPayment: async (payload: PaymentPayload) =>
    (await api.post<Payment>('/payments/', payload)).data,

  updatePayment: async (id: number, payload: Record<string, unknown>) =>
    (await api.patch<Payment>(`/payments/${id}/`, payload)).data,

  markPaymentPaid: async (
    id: number,
    payload: { transaction_id?: string; provider_response?: Record<string, unknown> }
  ) => (await api.post<Payment>(`/payments/${id}/mark_paid/`, payload)).data,

  markPaymentFailed: async (
    id: number,
    payload: { provider_response?: Record<string, unknown> }
  ) => (await api.post<Payment>(`/payments/${id}/mark_failed/`, payload)).data,

  createShippingMethod: async (payload: ShippingMethodPayload) =>
    (await api.post<ShippingMethod>('/shipping-methods/', payload)).data,

  updateShippingMethod: async (id: number, payload: Record<string, unknown>) =>
    (await api.patch<ShippingMethod>(`/shipping-methods/${id}/`, payload)).data,

  removeShippingMethod: async (id: number) =>
    (await api.delete(`/shipping-methods/${id}/`)).data,

  createShipment: async (payload: ShipmentPayload) =>
    (await api.post<Shipment>('/shipments/', payload)).data,

  updateShipment: async (id: number, payload: Record<string, unknown>) =>
    (await api.patch<Shipment>(`/shipments/${id}/`, payload)).data,

  removeShipment: async (id: number) =>
    (await api.delete(`/shipments/${id}/`)).data,

  markShipmentShipped: async (id: number, payload: { tracking_number?: string }) =>
    (await api.post<Shipment>(`/shipments/${id}/mark_shipped/`, payload)).data,

  markShipmentInTransit: async (id: number) =>
    (await api.post<Shipment>(`/shipments/${id}/mark_in_transit/`)).data,

  markShipmentDelivered: async (id: number) =>
    (await api.post<Shipment>(`/shipments/${id}/mark_delivered/`)).data,

  createNotification: async (payload: Record<string, unknown>) =>
    (await api.post<Notification>('/notifications/', payload)).data,

  updateNotification: async (id: number, payload: Record<string, unknown>) =>
    (await api.patch<Notification>(`/notifications/${id}/`, payload)).data,

  removeNotification: async (id: number) =>
    (await api.delete(`/notifications/${id}/`)).data,

  markNotificationRead: async (id: number) =>
    (await api.post<Notification>(`/notifications/${id}/mark-read/`)).data,

  createInventory: async (payload: Record<string, unknown>) =>
    (await api.post<Inventory>('/inventory/', payload)).data,

  updateInventory: async (id: number, payload: Record<string, unknown>) =>
    (await api.patch<Inventory>(`/inventory/${id}/`, payload)).data,

  removeInventory: async (id: number) =>
    (await api.delete(`/inventory/${id}/`)).data,

  adjustInventory: async (id: number, payload: Record<string, unknown>) =>
    (await api.post(`/inventory/${id}/adjust/`, payload)).data,
};