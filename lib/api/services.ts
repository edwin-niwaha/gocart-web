import { api, clearTokens, getRefreshToken, getAccessToken, normalizeList, setTokens } from './client';
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
  User,
  Wishlist,
  WishlistItem,
} from '@/lib/types';

/* =========================
   Auth
========================= */

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
    const { data } = await api.post<AuthResponse>(
      '/auth/social/google/',
      { access_token }
    );

    setTokens(data.tokens.access, data.tokens.refresh);

    return data;
  },

  me: async () => {
    const token = getAccessToken();

    if (!token) {
      throw new Error('No access token found');
    }

    const { data } = await api.get<User>('/auth/me/');
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

/* =========================
   Catalog
========================= */

export const catalogApi = {
  products: async () => {
    const { data } = await api.get<Product[] | { results: Product[] }>('/products/');
    return normalizeList(data);
  },

  product: async (slug: string) => {
    const { data } = await api.get<Product>(`/products/${slug}/`);
    return data;
  },

  categories: async () => {
    const { data } = await api.get<Category[] | { results: Category[] }>('/categories/');
    return normalizeList(data);
  },

  category: async (slug: string) => {
    const { data } = await api.get<Category>(`/categories/${slug}/`);
    return data;
  },

  reviews: async (product?: number) => {
    const { data } = await api.get<Review[] | { results: Review[] }>('/reviews/', {
      params: product ? { product } : {},
    });
    return normalizeList(data);
  },

  ratings: async (product?: number) => {
    const { data } = await api.get<ProductRating[] | { results: ProductRating[] }>('/ratings/', {
      params: product ? { product } : {},
    });
    return normalizeList(data);
  },

  createReview: async (payload: { product: number; rating: number; comment: string }) => {
    const { data } = await api.post<Review>('/reviews/', payload);
    return data;
  },
};

/* =========================
   Cart
========================= */

export const cartApi = {
  getOrCreate: async () => {
    const { data } = await api.post<Cart>('/carts/', {});
    return data;
  },

  listItems: async () => {
    const { data } = await api.get<CartItem[] | { results: CartItem[] }>('/cart-items/');
    return normalizeList(data);
  },

  addItem: async (payload: { product_id: number; quantity: number }) => {
    const { data } = await api.post<CartItem>('/cart-items/', payload);
    return data;
  },

  updateItem: async (id: number, payload: { quantity: number }) => {
    const { data } = await api.patch<CartItem>(`/cart-items/${id}/`, payload);
    return data;
  },

  removeItem: async (id: number) => {
    const { data } = await api.delete(`/cart-items/${id}/`);
    return data;
  },
};

/* =========================
   Wishlist
========================= */

export const wishlistApi = {
  getOrCreate: async () => {
    const { data } = await api.post<Wishlist>('/wishlist/', {});
    return data;
  },

  listItems: async () => {
    const { data } = await api.get<WishlistItem[] | { results: WishlistItem[] }>('/wishlist-items/');
    return normalizeList(data);
  },

  addItem: async (payload: { product_id: number }) => {
    const { data } = await api.post<WishlistItem>('/wishlist-items/', payload);
    return data;
  },

  removeItem: async (id: number) => {
    const { data } = await api.delete(`/wishlist-items/${id}/`);
    return data;
  },
};

/* =========================
   Orders
========================= */

export const orderApi = {
  list: async () => {
    const { data } = await api.get<Order[] | { results: Order[] }>('/orders/');
    return normalizeList(data);
  },

  detail: async (slug: string) => {
    const { data } = await api.get<Order>(`/orders/${slug}/`);
    return data;
  },

  create: async (payload: { slug: string; description: string }) => {
    const { data } = await api.post<Order>('/orders/', payload);
    return data;
  },

  update: async (slug: string, payload: Partial<{ slug: string; description: string }>) => {
    const { data } = await api.patch<Order>(`/orders/${slug}/`, payload);
    return data;
  },

  addItem: async (payload: { order: number; product: number; quantity: number }) => {
    const { data } = await api.post<OrderItem>('/order-items/', payload);
    return data;
  },

  updateItem: async (
    id: number,
    payload: Partial<{ order: number; product: number; quantity: number }>
  ) => {
    const { data } = await api.patch<OrderItem>(`/order-items/${id}/`, payload);
    return data;
  },

  removeItem: async (id: number) => {
    const { data } = await api.delete(`/order-items/${id}/`);
    return data;
  },
};

/* =========================
   Notifications
========================= */

export const notificationApi = {
  list: async () => {
    const { data } = await api.get<Notification[] | { results: Notification[] }>('/notifications/');
    return normalizeList(data);
  },

  markRead: async (id: number) => {
    const { data } = await api.post<Notification>(`/notifications/${id}/mark_read/`);
    return data;
  },

  markAllRead: async () => {
    const { data } = await api.post('/notifications/mark_all_read/');
    return data;
  },
};

/* =========================
   Coupons
========================= */

export const couponApi = {
  list: async () => {
    const { data } = await api.get<Coupon[] | { results: Coupon[] }>('/coupons/');
    return normalizeList(data);
  },

  validate: async (payload: { code: string; amount: string | number }) => {
    const { data } = await api.post<CouponValidation>('/coupons/validate/', payload);
    return data;
  },
};

/* =========================
   Inventory
========================= */

export const inventoryApi = {
  list: async () => {
    const { data } = await api.get<Inventory[] | { results: Inventory[] }>('/inventory/');
    return normalizeList(data);
  },

  movements: async () => {
    const { data } = await api.get<InventoryMovement[] | { results: InventoryMovement[] }>(
      '/inventory-movements/'
    );
    return normalizeList(data);
  },
};

/* =========================
   Addresses
========================= */

export const addressApi = {
  list: async () => {
    const { data } = await api.get<Address[] | { results: Address[] }>('/addresses/');
    return normalizeList(data);
  },

  create: async (payload: AddressPayload) => {
    const { data } = await api.post<Address>('/addresses/', payload);
    return data;
  },

  update: async (id: number, payload: Partial<AddressPayload>) => {
    const { data } = await api.patch<Address>(`/addresses/${id}/`, payload);
    return data;
  },

  remove: async (id: number) => {
    const { data } = await api.delete(`/addresses/${id}/`);
    return data;
  },
};

/* =========================
   Payments
========================= */

export const paymentApi = {
  list: async () => {
    const { data } = await api.get<Payment[] | { results: Payment[] }>('/payments/');
    return normalizeList(data);
  },

  create: async (payload: PaymentPayload) => {
    const { data } = await api.post<Payment>('/payments/', payload);
    return data;
  },
};

/* =========================
   Shipping
========================= */

export const shippingApi = {
  methods: async () => {
    const { data } = await api.get<ShippingMethod[] | { results: ShippingMethod[] }>(
      '/shipping-methods/'
    );
    return normalizeList(data);
  },

  shipments: async () => {
    const { data } = await api.get<Shipment[] | { results: Shipment[] }>('/shipments/');
    return normalizeList(data);
  },

  createShipment: async (payload: ShipmentPayload) => {
    const { data } = await api.post<Shipment>('/shipments/', payload);
    return data;
  },
};

/* =========================
   Admin
========================= */

export const adminApi = {
  /* Users */
  users: async () => {
    const { data } = await api.get<User[] | { results: User[] }>('/users/');
    return normalizeList(data);
  },

  /* Categories */
  categories: async () => {
    const { data } = await api.get<Category[] | { results: Category[] }>('/categories/');
    return normalizeList(data);
  },

  activeCategories: async () => {
    const { data } = await api.get<Category[] | { results: Category[] }>('/categories/', {
      params: { is_active: true },
    });
    return normalizeList(data);
  },

  category: async (slug: string) => {
    const { data } = await api.get<Category>(`/categories/${slug}/`);
    return data;
  },

  createCategory: async (payload: Partial<Category> & { name: string; slug: string }) => {
    const { data } = await api.post<Category>('/categories/', payload);
    return data;
  },

  updateCategory: async (slug: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch<Category>(`/categories/${slug}/`, payload);
    return data;
  },

  removeCategory: async (slug: string) => {
    const { data } = await api.delete(`/categories/${slug}/`);
    return data;
  },

  /* Products */
  products: async () => {
    const { data } = await api.get<Product[] | { results: Product[] }>('/products/');
    return normalizeList(data);
  },

  activeProducts: async () => {
    const { data } = await api.get<Product[] | { results: Product[] }>('/products/', {
      params: { is_active: true },
    });
    return normalizeList(data);
  },

  product: async (slug: string) => {
    const { data } = await api.get<Product>(`/products/${slug}/`);
    return data;
  },

  createProduct: async (payload: Record<string, unknown>) => {
    const { data } = await api.post<Product>('/products/', payload);
    return data;
  },

  updateProduct: async (slug: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch<Product>(`/products/${slug}/`, payload);
    return data;
  },

  removeProduct: async (slug: string) => {
    const { data } = await api.delete(`/products/${slug}/`);
    return data;
  },

  /* Carts */
  carts: async () => {
    const { data } = await api.get<Cart[] | { results: Cart[] }>('/carts/');
    return normalizeList(data);
  },

  createCart: async () => {
    const { data } = await api.post<Cart>('/carts/', {});
    return data;
  },

  removeCart: async (id: number) => {
    const { data } = await api.delete(`/carts/${id}/`);
    return data;
  },

  /* Cart Items */
  cartItems: async () => {
    const { data } = await api.get<CartItem[] | { results: CartItem[] }>('/cart-items/');
    return normalizeList(data);
  },

  createCartItem: async (payload: { product_id: number; quantity: number }) => {
    const { data } = await api.post<CartItem>('/cart-items/', payload);
    return data;
  },

  updateCartItem: async (
    id: number,
    payload: { quantity?: number; product_id?: number }
  ) => {
    const { data } = await api.patch<CartItem>(`/cart-items/${id}/`, payload);
    return data;
  },

  removeCartItem: async (id: number) => {
    const { data } = await api.delete(`/cart-items/${id}/`);
    return data;
  },

  /* Orders */
  orders: async () => {
    const { data } = await api.get<Order[] | { results: Order[] }>('/orders/');
    return normalizeList(data);
  },

  createOrder: async (payload: { slug: string; description: string }) => {
    const { data } = await api.post<Order>('/orders/', payload);
    return data;
  },

  updateOrder: async (slug: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch<Order>(`/orders/${slug}/`, payload);
    return data;
  },

  removeOrder: async (slug: string) => {
    const { data } = await api.delete(`/orders/${slug}/`);
    return data;
  },

  /* Order Items */
  orderItems: async () => {
    const { data } = await api.get<OrderItem[] | { results: OrderItem[] }>('/order-items/');
    return normalizeList(data);
  },

  createOrderItem: async (payload: { order: number; product: number; quantity: number }) => {
    const { data } = await api.post<OrderItem>('/order-items/', payload);
    return data;
  },

  updateOrderItem: async (id: number, payload: Record<string, unknown>) => {
    const { data } = await api.patch<OrderItem>(`/order-items/${id}/`, payload);
    return data;
  },

  removeOrderItem: async (id: number) => {
    const { data } = await api.delete(`/order-items/${id}/`);
    return data;
  },

  /* Reviews */
  reviews: async () => {
    const { data } = await api.get<Review[] | { results: Review[] }>('/reviews/');
    return normalizeList(data);
  },

  createReview: async (payload: { product: number; rating: number; comment: string }) => {
    const { data } = await api.post<Review>('/reviews/', payload);
    return data;
  },

  updateReview: async (id: number, payload: Record<string, unknown>) => {
    const { data } = await api.patch<Review>(`/reviews/${id}/`, payload);
    return data;
  },

  removeReview: async (id: number) => {
    const { data } = await api.delete(`/reviews/${id}/`);
    return data;
  },

  /* Ratings */
  ratings: async () => {
    const { data } = await api.get<ProductRating[] | { results: ProductRating[] }>('/ratings/');
    return normalizeList(data);
  },

  /* Wishlists */
  wishlists: async () => {
    const { data } = await api.get<Wishlist[] | { results: Wishlist[] }>('/wishlist/');
    return normalizeList(data);
  },

  createWishlist: async () => {
    const { data } = await api.post<Wishlist>('/wishlist/', {});
    return data;
  },

  removeWishlist: async (id: number) => {
    const { data } = await api.delete(`/wishlist/${id}/`);
    return data;
  },

  /* Wishlist Items */
  wishlistItems: async () => {
    const { data } = await api.get<WishlistItem[] | { results: WishlistItem[] }>('/wishlist-items/');
    return normalizeList(data);
  },

  createWishlistItem: async (payload: { product_id: number }) => {
    const { data } = await api.post<WishlistItem>('/wishlist-items/', payload);
    return data;
  },

  removeWishlistItem: async (id: number) => {
    const { data } = await api.delete(`/wishlist-items/${id}/`);
    return data;
  },

  /* Addresses */
  addresses: async () => {
    const { data } = await api.get<Address[] | { results: Address[] }>('/addresses/');
    return normalizeList(data);
  },

  createAddress: async (payload: AddressPayload) => {
    const { data } = await api.post<Address>('/addresses/', payload);
    return data;
  },

  updateAddress: async (id: number, payload: Record<string, unknown>) => {
    const { data } = await api.patch<Address>(`/addresses/${id}/`, payload);
    return data;
  },

  removeAddress: async (id: number) => {
    const { data } = await api.delete(`/addresses/${id}/`);
    return data;
  },

  /* Payments */
  payments: async () => {
    const { data } = await api.get<Payment[] | { results: Payment[] }>('/payments/');
    return normalizeList(data);
  },

  createPayment: async (payload: PaymentPayload) => {
    const { data } = await api.post<Payment>('/payments/', payload);
    return data;
  },

  updatePayment: async (id: number, payload: Record<string, unknown>) => {
    const { data } = await api.patch<Payment>(`/payments/${id}/`, payload);
    return data;
  },

  markPaymentPaid: async (
    id: number,
    payload: { transaction_id?: string; provider_response?: Record<string, unknown> }
  ) => {
    const { data } = await api.post<Payment>(`/payments/${id}/mark_paid/`, payload);
    return data;
  },

  markPaymentFailed: async (
    id: number,
    payload: { provider_response?: Record<string, unknown> }
  ) => {
    const { data } = await api.post<Payment>(`/payments/${id}/mark_failed/`, payload);
    return data;
  },

  /* Shipping Methods */
  shippingMethods: async () => {
    const { data } = await api.get<ShippingMethod[] | { results: ShippingMethod[] }>(
      '/shipping-methods/'
    );
    return normalizeList(data);
  },

  createShippingMethod: async (payload: ShippingMethodPayload) => {
    const { data } = await api.post<ShippingMethod>('/shipping-methods/', payload);
    return data;
  },

  updateShippingMethod: async (id: number, payload: Record<string, unknown>) => {
    const { data } = await api.patch<ShippingMethod>(`/shipping-methods/${id}/`, payload);
    return data;
  },

  removeShippingMethod: async (id: number) => {
    const { data } = await api.delete(`/shipping-methods/${id}/`);
    return data;
  },

  /* Shipments */
  shipments: async () => {
    const { data } = await api.get<Shipment[] | { results: Shipment[] }>('/shipments/');
    return normalizeList(data);
  },

  createShipment: async (payload: ShipmentPayload) => {
    const { data } = await api.post<Shipment>('/shipments/', payload);
    return data;
  },

  updateShipment: async (id: number, payload: Record<string, unknown>) => {
    const { data } = await api.patch<Shipment>(`/shipments/${id}/`, payload);
    return data;
  },

  removeShipment: async (id: number) => {
    const { data } = await api.delete(`/shipments/${id}/`);
    return data;
  },

  markShipmentShipped: async (id: number, payload: { tracking_number?: string }) => {
    const { data } = await api.post<Shipment>(`/shipments/${id}/mark_shipped/`, payload);
    return data;
  },

  markShipmentInTransit: async (id: number) => {
    const { data } = await api.post<Shipment>(`/shipments/${id}/mark_in_transit/`);
    return data;
  },

  markShipmentDelivered: async (id: number) => {
    const { data } = await api.post<Shipment>(`/shipments/${id}/mark_delivered/`);
    return data;
  },

  /* Coupons */
  coupons: async () => {
    const { data } = await api.get<Coupon[] | { results: Coupon[] }>('/coupons/');
    return normalizeList(data);
  },

  createCoupon: async (payload: Record<string, unknown>) => {
    const { data } = await api.post<Coupon>('/coupons/', payload);
    return data;
  },

  updateCoupon: async (id: number, payload: Record<string, unknown>) => {
    const { data } = await api.patch<Coupon>(`/coupons/${id}/`, payload);
    return data;
  },

  removeCoupon: async (id: number) => {
    const { data } = await api.delete(`/coupons/${id}/`);
    return data;
  },

  /* Notifications */
  notifications: async () => {
    const { data } = await api.get<Notification[] | { results: Notification[] }>('/notifications/');
    return normalizeList(data);
  },

  createNotification: async (payload: Record<string, unknown>) => {
    const { data } = await api.post<Notification>('/notifications/', payload);
    return data;
  },

  updateNotification: async (id: number, payload: Record<string, unknown>) => {
    const { data } = await api.patch<Notification>(`/notifications/${id}/`, payload);
    return data;
  },

  removeNotification: async (id: number) => {
    const { data } = await api.delete(`/notifications/${id}/`);
    return data;
  },

  markNotificationRead: async (id: number) => {
    const { data } = await api.post<Notification>(`/notifications/${id}/mark_read/`);
    return data;
  },

  markNotificationsRead: async () => {
    const { data } = await api.post('/notifications/mark_all_read/');
    return data;
  },

  /* Inventory */
  inventory: async () => {
    const { data } = await api.get<Inventory[] | { results: Inventory[] }>('/inventory/');
    return normalizeList(data);
  },

  createInventory: async (payload: Record<string, unknown>) => {
    const { data } = await api.post<Inventory>('/inventory/', payload);
    return data;
  },

  updateInventory: async (id: number, payload: Record<string, unknown>) => {
    const { data } = await api.patch<Inventory>(`/inventory/${id}/`, payload);
    return data;
  },

  removeInventory: async (id: number) => {
    const { data } = await api.delete(`/inventory/${id}/`);
    return data;
  },

  adjustInventory: async (
    id: number,
    payload: { movement_type: string; quantity: number; note?: string }
  ) => {
    const { data } = await api.post<InventoryMovement>(`/inventory/${id}/adjust/`, payload);
    return data;
  },

  inventoryMovements: async () => {
    const { data } = await api.get<InventoryMovement[] | { results: InventoryMovement[] }>(
      '/inventory-movements/'
    );
    return normalizeList(data);
  },
};