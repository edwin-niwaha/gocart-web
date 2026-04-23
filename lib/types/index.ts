export type Tokens = {
  access: string;
  refresh: string;
};

export type UserType = 'USER' | 'CUSTOMER' | 'ADMIN' | 'PLATFORM_ADMIN';

export type TenantMembershipRole =
  | 'platform_admin'
  | 'super_admin'
  | 'tenant_owner'
  | 'tenant_admin'
  | 'manager'
  | 'tenant_staff'
  | 'staff'
  | 'customer';

export type TenantMembership = {
  id: number;
  tenant: number;
  tenant_name?: string;
  tenant_slug?: string;
  role: TenantMembershipRole;
  is_active: boolean;
};

export type User = {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string | null;
  user_type: UserType;
  is_active: boolean;
  created_at: string;
  memberships?: TenantMembership[];
  active_tenant_slug?: string | null;
};

export type Tenant = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  branding?: TenantBranding | null;
  settings?: TenantSettings | null;
  created_at?: string;
  updated_at?: string;
};

export type AuthResponse = {
  user: User;
  tokens: Tokens;
};

export type Category = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  name: string;
  slug: string;
  image_url?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ProductVariant = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  name: string;
  sku: string;
  price: string | number;
  stock_quantity: number;
  max_quantity_per_order?: number | null;
  is_active: boolean;
  sort_order: number;
  is_in_stock?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Product = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  category?: Category | null;
  title: string;
  slug: string;
  description: string;
  hero_image?: string | null;
  image_urls: string[];
  is_active: boolean;
  is_featured?: boolean;
  base_price: string | number;
  price?: string | number;
  is_in_stock: boolean;
  variants: ProductVariant[];
  average_rating?: string | number;
  total_reviews?: number;
  created_at?: string;
  updated_at?: string;
};

export type CartItem = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  product: Product;
  quantity: number;
  unit_price: string;
  line_total: string;
  created_at: string;
  updated_at: string;
};

export type Cart = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  user: number;
  items: CartItem[];
  total_items: number;
  total_price: string;
  created_at: string;
  updated_at: string;
};

export type WishlistItem = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  product: Product;
  created_at: string;
  updated_at: string;
};

export type Wishlist = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  user: number;
  items: WishlistItem[];
  total_items: number;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  user: User;
  user_id: number;
  product: number;
  product_title: string;
  product_slug: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
};

export type ProductRating = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  product: number;
  product_title: string;
  product_slug: string;
  average_rating: string;
  total_reviews: number;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  product: number;
  product_title: string;
  product_slug: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  created_at: string;
  updated_at: string;
};

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | string;

export type Order = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  slug: string;
  user: number;
  user_email: string;
  status: OrderStatus;
  description: string;
  total_price: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  user: number;
  notification_type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type Coupon = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  code: string;
  description: string;
  discount_type: string;
  value: string;
  min_order_amount: string;
  max_discount_amount?: string | null;
  usage_limit?: number | null;
  used_count: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  products: number[];
  categories: number[];
  is_valid_now: boolean;
  created_at: string;
  updated_at: string;
};

export type CouponValidation = {
  code: string;
  discount: string;
  final_amount: string;
};

export type Inventory = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  product: number;
  product_title: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  low_stock_threshold: number;
  is_in_stock: boolean;
  created_at: string;
  updated_at: string;
};

export type InventoryMovement = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  inventory: number;
  product_title: string;
  movement_type: string;
  quantity: number;
  note: string;
  created_at: string;
  updated_at: string;
};

export type Address = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  label: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone_number: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type AddressPayload = Omit<Address, 'id' | 'created_at' | 'updated_at'>;

/* ============================================================================
 * Payments
 * ========================================================================== */

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

export type PaymentProvider =
  | 'CASH'
  | 'STRIPE'
  | 'PAYSTACK'
  | 'FLUTTERWAVE'
  | 'MTN'
  | 'AIRTEL';

export type Payment = {
  id: number;

  user?: number;
  user_email?: string;
  username?: string;

  tenant?: number | null;
  tenant_slug?: string | null;

  order?: number | null;
  order_slug?: string | null;
  order_status?: string | null;

  provider: PaymentProvider | string;
  status: PaymentStatus;

  amount: number | string;
  currency: string;
  phone_number?: string;

  reference: string;
  external_id?: string | null;
  transaction_id?: string | null;
  checkout_url?: string | null;

  provider_response?: Record<string, unknown> | null;
  address_id?: number | null;

  created_at?: string | null;
  updated_at?: string | null;
  paid_at?: string | null;
};

export type PaymentPayload = {
  order: number;
  provider: PaymentProvider | string;
  currency?: string;
  amount: string | number;
  phone_number?: string;
};

export type AdminPaymentUpdatePayload = {
  provider?: PaymentProvider | string;
  status?: PaymentStatus;
  transaction_id?: string;
  provider_response?: Record<string, unknown>;
};

export type ShippingMethod = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  name: string;
  description: string;
  fee: string;
  estimated_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ShippingMethodPayload = {
  name: string;
  description: string;
  fee: string | number;
  estimated_days: number;
  is_active: boolean;
};

export type ShipmentStatus =
  | 'PENDING'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | string;

export type Shipment = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  order: number;
  order_slug: string;
  user_email: string;
  address: number;
  shipping_method: number;
  shipping_method_name: string;
  status: ShipmentStatus;
  tracking_number?: string | null;
  shipping_fee: string;
  dispatched_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type ShipmentPayload = {
  order: number;
  address: number;
  shipping_method: number;
};

export type SupportMessageStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED';

export type SupportMessage = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  name: string;
  email: string;
  message: string;
  status: SupportMessageStatus;
  created_at: string;
  updated_at: string;
};

export type TenantBranding = {
  app_name?: string;
  hero_title?: string;
  hero_subtitle?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  logo?: string | null;
};

export type TenantSettings = {
  store_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  currency?: string;
  locale?: string;
  timezone?: string;
  tax_inclusive_prices?: boolean;
  default_tax_rate?: string | number | null;
  shipping_settings?: Record<string, unknown>;
  payment_settings?: Record<string, unknown>;
  support_chat_url?: string;
  website_url?: string;
  terms_url?: string;
  privacy_url?: string;
  maintenance_mode?: boolean;
};

export type TenantFeatureFlag = {
  id: number;
  key: string;
  enabled: boolean;
  description?: string;
};

export type CustomerAddressRegion =
  | 'kampala_area'
  | 'entebbe_area'
  | 'central_region'
  | 'eastern_region'
  | 'northern_region'
  | 'western_region'
  | 'rest_of_kampala';

export type CustomerAddress = {
  id: number;
  tenant?: number | null;
  tenant_slug?: string | null;
  street_name: string;
  city: string;
  phone_number: string;
  additional_telephone?: string;
  additional_information?: string;
  region: CustomerAddressRegion;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CustomerAddressPayload = {
  street_name: string;
  city: string;
  phone_number?: string;
  additional_telephone?: string;
  additional_information?: string;
  region: CustomerAddressRegion;
  is_default?: boolean;
};
