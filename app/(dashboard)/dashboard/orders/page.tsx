'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Orders',
  singular: 'Order',
  idKey: 'slug',
  description: 'View customer orders and move them through fulfillment.',
  list: adminApi.orders,
  create: undefined,
  update: undefined,
  remove: undefined,
  actions: [
    {
      label: 'Process',
      onClick: (order: any) =>
        adminApi.transitionOrder(order.slug, 'PROCESSING'),
    },
    {
      label: 'Mark paid',
      onClick: (order: any) => adminApi.transitionOrder(order.slug, 'PAID'),
    },
    {
      label: 'Ship',
      onClick: (order: any) => adminApi.transitionOrder(order.slug, 'SHIPPED'),
    },
    {
      label: 'Deliver',
      onClick: (order: any) =>
        adminApi.transitionOrder(order.slug, 'DELIVERED'),
    },
    {
      label: 'Cancel',
      tone: 'danger',
      onClick: (order: any) =>
        adminApi.transitionOrder(order.slug, 'CANCELLED'),
    },
  ],
  readOnly: true,
  fields: [
    { name: 'slug', label: 'Slug', type: 'readonly' },
    { name: 'status', label: 'Status', type: 'readonly' },
    { name: 'total_price', label: 'Total', type: 'readonly' },
    { name: 'user_email', label: 'Customer', type: 'readonly' },
  ],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
