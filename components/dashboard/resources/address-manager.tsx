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
    {
      name: 'street_name',
      label: 'Street / building',
      type: 'text',
      required: true,
    },
    { name: 'city', label: 'City', type: 'text', required: true },
    {
      name: 'phone_number',
      label: 'Phone number',
      type: 'text',
    },
    {
      name: 'additional_telephone',
      label: 'Additional telephone',
      type: 'text',
    },
    {
      name: 'region',
      label: 'Region',
      type: 'select',
      required: true,
      options: [
        { label: 'Kampala Area', value: 'kampala_area' },
        { label: 'Entebbe Area', value: 'entebbe_area' },
        { label: 'Central Region', value: 'central_region' },
        { label: 'Eastern Region', value: 'eastern_region' },
        { label: 'Northern Region', value: 'northern_region' },
        { label: 'Western Region', value: 'western_region' },
        { label: 'Rest of Kampala', value: 'rest_of_kampala' },
      ],
    },
    { name: 'is_default', label: 'Default address', type: 'checkbox' },
  ],
};

export default function AddressManager() {
  return <AdminResourceManager config={config} />;
}
