'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Order Items',
  singular: 'Order Item',
  idKey: 'id',
  description: 'Attach products to existing orders.',
  list: adminApi.orderItems,
  create: adminApi.createOrderItem,
  update: adminApi.updateOrderItem,
  remove: adminApi.removeOrderItem,
  actions: undefined,
  readOnly: false,
  fields: [{ name: 'order', label: 'Order ID', type: 'number' }, { name: 'product', label: 'Product ID', type: 'number' }, { name: 'quantity', label: 'Quantity', type: 'number' }],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
