'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Reviews',
  singular: 'Review',
  idKey: 'id',
  description: 'Moderate and update product reviews.',
  list: adminApi.reviews,
  create: adminApi.createReview,
  update: adminApi.updateReview,
  remove: adminApi.removeReview,
  actions: undefined,
  readOnly: false,
  fields: [{ name: 'product', label: 'Product ID', type: 'number' }, { name: 'rating', label: 'Rating', type: 'number' }, { name: 'comment', label: 'Comment', type: 'textarea' }],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
