'use client';


import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Coupons',
  singular: 'Coupon',
  idKey: 'id',
  description: 'Create and update promotional offers.',
  list: adminApi.coupons,
  create: adminApi.createCoupon,
  update: adminApi.updateCoupon,
  remove: adminApi.removeCoupon,
  actions: undefined,
  readOnly: false,
  fields: [{ name: 'code', label: 'Code', type: 'text' }, { name: 'description', label: 'Description', type: 'textarea' }, { name: 'discount_type', label: 'Discount type', type: 'text' }, { name: 'value', label: 'Value', type: 'number' }, { name: 'min_order_amount', label: 'Minimum order amount', type: 'number' }, { name: 'max_discount_amount', label: 'Maximum discount amount', type: 'number' }, { name: 'usage_limit', label: 'Usage limit', type: 'number' }, { name: 'starts_at', label: 'Starts at', type: 'date' }, { name: 'ends_at', label: 'Ends at', type: 'date' }, { name: 'is_active', label: 'Is Active', type: 'checkbox' }, { name: 'products', label: 'Products JSON array', type: 'json' }, { name: 'categories', label: 'Categories JSON array', type: 'json' }],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
