'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Wishlist Items',
  singular: 'Wishlist Item',
  idKey: 'id',
  description: 'Manage wishlist entries.',
  list: adminApi.wishlistItems,
  create: adminApi.createWishlistItem,

  remove: adminApi.removeWishlistItem,
  actions: undefined,
  readOnly: false,
  fields: [{ name: 'product_id', label: 'Product ID', type: 'number' }],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
