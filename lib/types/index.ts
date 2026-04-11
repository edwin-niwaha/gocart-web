export type Tokens = { access: string; refresh: string };
export type UserType = 'USER' | 'ADMIN';

export type TenantMembershipRole =
  | 'super_admin'
  | 'tenant_owner'
  | 'tenant_admin'
  | 'manager'
  | 'staff';

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

export type AuthResponse = { user: User; tokens: Tokens };

export type Category = {
  id: number;
  tenant?: number | null;
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
  category?: Category | null;
  title: string;
  slug: string;
  description: string;
  hero_image?: string | null;
  image_urls: string[];
  is_active: boolean;
  is_featured?: boolean;
  base_price: string | number;
  is_in_stock: boolean;
  variants: ProductVariant[];
  average_rating?: string | number;
  total_reviews?: number;
  created_at?: string;
  updated_at?: string;
};

export type CartItem = {
  id: number;
  product: Product;
  quantity: number;
  unit_price: string;
  line_total: string;
  created_at: string;
  updated_at: string;
};

export type Cart = {
  id: number;
  user: number;
  items: CartItem[];
  total_items: number;
  total_price: string;
  created_at: string;
  updated_at: string;
};

export type WishlistItem = { id: number; product: Product; created_at: string; updated_at: string };
export type Wishlist = { id: number; user: number; items: WishlistItem[]; total_items: number; created_at: string; updated_at: string };
export type Review = { id: number; user: User; user_id: number; product: number; product_title: string; product_slug: string; rating: number; comment: string; created_at: string; updated_at: string };
export type ProductRating = { id: number; product: number; product_title: string; product_slug: string; average_rating: string; total_reviews: number; created_at: string; updated_at: string };
export type OrderItem = { id: number; product: number; product_title: string; product_slug: string; quantity: number; unit_price: string; line_total: string; created_at: string; updated_at: string };
export type Order = { id: number; slug: string; user: number; user_email: string; status: string; description: string; total_price: string; items: OrderItem[]; created_at: string; updated_at: string };
export type Notification = { id: number; user: number; notification_type: string; title: string; message: string; data: Record<string, unknown>; is_read: boolean; read_at?: string | null; created_at: string; updated_at: string };
export type Coupon = { id: number; code: string; description: string; discount_type: string; value: string; min_order_amount: string; max_discount_amount?: string | null; usage_limit?: number | null; used_count: number; starts_at: string; ends_at: string; is_active: boolean; products: number[]; categories: number[]; is_valid_now: boolean; created_at: string; updated_at: string };
export type CouponValidation = { code: string; discount: string; final_amount: string };
export type Inventory = { id: number; product: number; product_title: string; stock_quantity: number; reserved_quantity: number; available_quantity: number; low_stock_threshold: number; is_in_stock: boolean; created_at: string; updated_at: string };
export type InventoryMovement = { id: number; inventory: number; product_title: string; movement_type: string; quantity: number; note: string; created_at: string; updated_at: string };
export type Address = { id: number; label: string; address_line1: string; address_line2?: string; city: string; state: string; postal_code: string; country: string; phone_number: string; is_default: boolean; created_at: string; updated_at: string };
export type AddressPayload = Omit<Address, 'id' | 'created_at' | 'updated_at'>;
export type Payment = { id: number; user: number; user_email: string; order: number; order_slug: string; provider: string; status: string; currency: string; amount: string; reference: string; transaction_id?: string | null; checkout_url?: string | null; provider_response: Record<string, unknown> | null; paid_at?: string | null; created_at: string; updated_at: string };
export type PaymentPayload = { order: number; provider: string; currency?: string; amount: string | number };
export type ShippingMethod = { id: number; name: string; description: string; fee: string; estimated_days: number; is_active: boolean; created_at: string; updated_at: string };
export type ShippingMethodPayload = { name: string; description: string; fee: string | number; estimated_days: number; is_active: boolean };
export type Shipment = { id: number; order: number; order_slug: string; user_email: string; address: number; shipping_method: number; shipping_method_name: string; status: string; tracking_number?: string | null; shipping_fee: string; dispatched_at?: string | null; delivered_at?: string | null; created_at: string; updated_at: string };
export type ShipmentPayload = { order: number; address: number; shipping_method: number };

export type SupportMessage = {
  id: number;
  name: string;
  email: string;
  message: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED';
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
