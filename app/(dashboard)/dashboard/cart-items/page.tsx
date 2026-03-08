'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Cart Items',
  singular: 'Cart Item',
  idKey: 'id',
  description: 'Manage cart line items.',
  list: adminApi.cartItems,
  create: adminApi.createCartItem,
  update: adminApi.updateCartItem,
  remove: adminApi.removeCartItem,
  actions: undefined,
  readOnly: false,
  fields: [{ name: 'product_id', label: 'Product ID', type: 'number' }, { name: 'quantity', label: 'Quantity', type: 'number' }],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
