'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Pickup Stations',
  singular: 'Pickup Station',
  idKey: 'id',
  description:
    'Manage the locations customers can choose when collcting orders.',
  list: adminApi.pickupStations,
  create: adminApi.createPickupStation,
  update: adminApi.updatePickupStation,
  remove: adminApi.removePickupStation,
  readOnly: false,
  fields: [
    {
      name: 'name',
      label: 'Station name',
      type: 'text',
      required: true,
      placeholder: 'Wandegeya Pickup Hub',
    },
    {
      name: 'city',
      label: 'City',
      type: 'text',
      required: true,
      placeholder: 'Kampala',
    },
    {
      name: 'area',
      label: 'Area',
      type: 'text',
      required: true,
      placeholder: 'Wandegeya',
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea',
      required: true,
      placeholder: 'Plot, street, building, and landmark details.',
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'text',
      placeholder: '+256 700 000000',
    },
    {
      name: 'opening_hours',
      label: 'Opening hours',
      type: 'text',
      placeholder: 'Mon-Sat, 8:00 AM - 8:00 PM',
    },
    {
      name: 'is_active',
      label: 'Available for checkout',
      type: 'checkbox',
    },
  ],
};

export default function PickupStationManager() {
  return <AdminResourceManager config={config} />;
}
