'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Wishlists',
  singular: 'Wishlist',
  idKey: 'id',
  description: 'Admin access to wishlists.',
  list: adminApi.wishlists,
  create: adminApi.createWishlist,

  remove: adminApi.removeWishlist,
  actions: undefined,
  readOnly: false,
  fields: [],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
