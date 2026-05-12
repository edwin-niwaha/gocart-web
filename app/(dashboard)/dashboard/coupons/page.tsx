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
  fields: [
    {
      name: 'code',
      label: 'Coupon Code',
      type: 'text',
      required: true,
      placeholder: 'e.g. WELCOME10',
      helpText: 'Unique code customers will enter at checkout.',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'e.g. 10% off for first-time customers',
      helpText: 'Optional short explanation for admins.',
    },
    {
      name: 'discount_type',
      label: 'Discount Type',
      type: 'select',
      required: true,
      placeholder: 'Select discount type',
      options: [
        { label: 'Percentage', value: 'PERCENTAGE' },
        { label: 'Fixed Amount', value: 'FIXED' },
      ],
    },
    {
      name: 'value',
      label: 'Discount Value',
      type: 'number',
      required: true,
      placeholder: 'e.g. 10 or 5000',
      helpText: 'Use 10 for 10%, or 5000 for fixed UGX 5,000.',
    },
    {
      name: 'min_order_amount',
      label: 'Minimum Order Amount',
      type: 'number',
      placeholder: 'e.g. 20000',
      helpText: 'Set 0 if there is no minimum order amount.',
    },
    {
      name: 'max_discount_amount',
      label: 'Maximum Discount Amount',
      type: 'number',
      placeholder: 'e.g. 10000',
      helpText: 'Optional. Useful for percentage discounts.',
    },
    {
      name: 'usage_limit',
      label: 'Usage Limit',
      type: 'number',
      placeholder: 'e.g. 100',
      helpText: 'Use 0 for unlimited usage.',
    },
    {
      name: 'starts_at',
      label: 'Starts At',
      type: 'date',
      required: true,
      placeholder: 'Select start date and time',
    },
    {
      name: 'ends_at',
      label: 'Ends At',
      type: 'date',
      required: true,
      placeholder: 'Select end date and time',
      helpText: 'End date must be after start date.',
    },
    {
      name: 'is_active',
      label: 'Is Active',
      type: 'checkbox',
    },
    {
      name: 'products',
      label: 'Product IDs',
      type: 'json',
      hideInList: true,
      placeholder: '[1, 2, 3]',
      helpText: 'Optional. Enter product IDs only. Leave empty for all products.',
    },
    {
      name: 'categories',
      label: 'Category IDs',
      type: 'json',
      hideInList: true,
      placeholder: '[1, 2, 3]',
      helpText: 'Optional. Enter category IDs only. Leave empty for all categories.',
    },
  ],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}