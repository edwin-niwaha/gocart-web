'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Shipping Methods',
  singular: 'Shipping Method',
  idKey: 'id',
  description: 'Manage delivery methods offered at checkout.',
  list: adminApi.shippingMethods,
  create: adminApi.createShippingMethod,
  update: adminApi.updateShippingMethod,
  remove: adminApi.removeShippingMethod,
  actions: undefined,
  readOnly: false,
  fields: [{ name: 'name', label: 'Name', type: 'text' }, { name: 'description', label: 'Description', type: 'textarea' }, { name: 'fee', label: 'Fee', type: 'number' }, { name: 'estimated_days', label: 'Estimated days', type: 'number' }, { name: 'is_active', label: 'Is Active', type: 'checkbox' }],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
