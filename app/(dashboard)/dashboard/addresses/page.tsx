'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Addresses',
  singular: 'Address',
  idKey: 'id',
  description: 'Create and maintain customer addresses.',
  list: adminApi.addresses,
  create: adminApi.createAddress,
  update: adminApi.updateAddress,
  remove: adminApi.removeAddress,
  actions: undefined,
  readOnly: false,
  fields: [{ name: 'label', label: 'Label', type: 'text' }, { name: 'address_line1', label: 'Address line 1', type: 'text' }, { name: 'address_line2', label: 'Address line 2', type: 'text' }, { name: 'city', label: 'City', type: 'text' }, { name: 'state', label: 'State', type: 'text' }, { name: 'postal_code', label: 'Postal code', type: 'text' }, { name: 'country', label: 'Country', type: 'text' }, { name: 'phone_number', label: 'Phone number', type: 'text' }, { name: 'is_default', label: 'Default address', type: 'checkbox' }],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
