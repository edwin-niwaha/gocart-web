'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Orders',
  singular: 'Order',
  idKey: 'slug',
  description: 'Create and manage order records.',
  list: adminApi.orders,
  create: adminApi.createOrder,
  update: adminApi.updateOrder,
  remove: adminApi.removeOrder,
  actions: undefined,
  readOnly: false,
  fields: [
    { name: 'slug', label: 'Slug', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}