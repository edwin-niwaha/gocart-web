'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const orderActions = [
  ['Process', 'PROCESSING'],
  ['Mark paid', 'PAID'],
  ['Ship', 'SHIPPED'],
  ['Deliver', 'DELIVERED'],
] as const;

const config = {
  title: 'Orders',
  singular: 'Order',
  idKey: 'slug',
  description: 'Track orders, payments, shipping, and delivery status.',
  list: adminApi.orders,
  create: undefined,
  update: undefined,
  remove: undefined,
  readOnly: true,

  actions: [
    ...orderActions.map(([label, status]) => ({
      label,
      onClick: (order: any) => adminApi.transitionOrder(order.slug, status),
    })),
    {
      label: 'Cancel',
      tone: 'danger',
      onClick: (order: any) => adminApi.transitionOrder(order.slug, 'CANCELLED'),
    },
  ],

  fields: [
    { name: 'slug', label: 'Order', type: 'readonly' },
    { name: 'status', label: 'Status', type: 'readonly' },
    { name: 'total_price', label: 'Total', type: 'readonly' },
    { name: 'user_email', label: 'Customer', type: 'readonly' },
    { name: 'created_at', label: 'Created', type: 'readonly' },
    { name: 'payment_method', label: 'Payment', type: 'readonly' },
    { name: 'delivery_option', label: 'Delivery', type: 'readonly' },
  ],
};

export default function OrdersPage() {
  return <AdminResourceManager config={config} />;
}