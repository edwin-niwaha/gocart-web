'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Order Items',
  singular: 'Order Item',
  idKey: 'id',
  description: 'View order line items captured at checkout.',
  list: adminApi.orderItems,
  create: undefined,
  update: undefined,
  remove: undefined,
  actions: undefined,
  readOnly: true,
  fields: [
    { name: 'order', label: 'Order ID', type: 'readonly' },
    { name: 'product_title', label: 'Product', type: 'readonly' },
    { name: 'quantity', label: 'Quantity', type: 'readonly' },
    { name: 'line_total', label: 'Line total', type: 'readonly' },
  ],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
