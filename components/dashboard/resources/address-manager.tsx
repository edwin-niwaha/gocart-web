'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Addresses',
  singular: 'Address',
  idKey: 'id',
  description: 'Manage user addresses.',
  list: adminApi.addresses,
  create: adminApi.createAddress,
  update: adminApi.updateAddress,
  remove: adminApi.removeAddress,
  readOnly: false,
  fields: [
    { name: 'street', label: 'Street', type: 'text' },
    { name: 'city', label: 'City', type: 'text' },
    { name: 'country', label: 'Country', type: 'text' },
  ],
};

export default function AddressManager() {
  return <AdminResourceManager config={config} />;
}