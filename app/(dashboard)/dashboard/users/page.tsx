'use client';


import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Users',
  singular: 'User',
  idKey: 'id',
  description: 'Read-only admin view of registered users.',
  list: adminApi.users,



  actions: undefined,
  readOnly: true,
  fields: [],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
