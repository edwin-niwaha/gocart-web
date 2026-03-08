'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Ratings',
  singular: 'Rating',
  idKey: 'id',
  description: 'Read-only aggregated product rating data.',
  list: adminApi.ratings,



  actions: undefined,
  readOnly: true,
  fields: [],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
