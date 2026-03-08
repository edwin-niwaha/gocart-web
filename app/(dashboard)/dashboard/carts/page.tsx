'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Carts',
  singular: 'Cart',
  idKey: 'id',
  description: 'Admin access to user carts.',
  list: adminApi.carts,
  create: adminApi.createCart,

  remove: adminApi.removeCart,
  actions: undefined,
  readOnly: false,
  fields: [],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
