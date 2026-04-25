'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';
import type { CustomerAddressRegion, DeliveryRate } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

const REGION_OPTIONS: Array<{
  label: string;
  value: CustomerAddressRegion;
}> = [
  { label: 'Kampala Area', value: 'kampala_area' },
  { label: 'Entebbe Area', value: 'entebbe_area' },
  { label: 'Central Region', value: 'central_region' },
  { label: 'Eastern Region', value: 'eastern_region' },
  { label: 'Northern Region', value: 'northern_region' },
  { label: 'Western Region', value: 'western_region' },
  { label: 'Rest of Kampala', value: 'rest_of_kampala' },
];

type DeliveryRateRecord = DeliveryRate & {
  description: string;
  name: string;
};

function formatDeliveryWindow(days: number) {
  if (!Number.isFinite(days) || days < 0) {
    return 'Delivery estimate unavailable';
  }

  if (days === 0) {
    return 'Same day';
  }

  if (days === 1) {
    return '1 day';
  }

  return `${days} days`;
}

function getRegionLabel(region: CustomerAddressRegion) {
  return (
    REGION_OPTIONS.find((option) => option.value === region)?.label ?? region
  );
}

function buildLocationLabel(rate: DeliveryRate) {
  return [
    rate.region_label || getRegionLabel(rate.region),
    rate.city || 'All cities',
    rate.area || 'All areas',
  ].join(' / ');
}

function buildRateDescription(rate: DeliveryRate) {
  return [
    formatCurrency(rate.fee),
    formatDeliveryWindow(Number(rate.estimated_days ?? 0)),
    rate.is_active ? 'Active at checkout' : 'Hidden from checkout',
  ].join(' / ');
}

const config = {
  title: 'Delivery Rates',
  singular: 'Delivery Rate',
  idKey: 'id',
  description:
    'Define where home delivery is available and how much to charge. Checkout automatically picks the most specific active rate for each saved address.',
  list: async () => {
    const rates = await adminApi.deliveryRates();
    return rates.map((rate) => ({
      ...rate,
      name: buildLocationLabel(rate),
      description: buildRateDescription(rate),
    }));
  },
  create: adminApi.createDeliveryRate,
  update: adminApi.updateDeliveryRate,
  remove: adminApi.removeDeliveryRate,
  readOnly: false,
  fields: [
    {
      name: 'region',
      label: 'Region',
      type: 'select',
      required: true,
      options: REGION_OPTIONS,
      helpText: 'Every delivery rate starts with a required region match.',
    },
    {
      name: 'city',
      label: 'City',
      type: 'text',
      placeholder: 'Kampala',
      preserveEmpty: true,
      helpText:
        'Optional. Leave blank to apply this rate to every city in the selected region.',
    },
    {
      name: 'area',
      label: 'Area / neighborhood',
      type: 'text',
      placeholder: 'Ntinda',
      preserveEmpty: true,
      helpText:
        'Optional. Leave blank to create a city-wide or region-wide fallback rate.',
    },
    {
      name: 'fee',
      label: 'Delivery fee (UGX)',
      type: 'number',
      required: true,
      placeholder: '5000',
    },
    {
      name: 'estimated_days',
      label: 'Estimated delivery days',
      type: 'number',
      required: true,
      placeholder: '1',
    },
    {
      name: 'is_active',
      label: 'Available at checkout',
      type: 'checkbox',
    },
  ],
};

export default function DeliveryRateManager() {
  return <AdminResourceManager<DeliveryRateRecord> config={config} />;
}
