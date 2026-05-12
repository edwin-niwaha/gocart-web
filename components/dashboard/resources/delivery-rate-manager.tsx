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
  { label: 'Rest of Kampala', value: 'rest_of_kampala' },
  { label: 'Entebbe Area', value: 'entebbe_area' },
  { label: 'Central Region', value: 'central_region' },
  { label: 'Eastern Region', value: 'eastern_region' },
  { label: 'Northern Region', value: 'northern_region' },
  { label: 'Western Region', value: 'western_region' },
];

type DeliveryRateRecord = DeliveryRate & {
  name: string;
  description: string;
  location_summary: string;
  fee_summary: string;
  delivery_summary: string;
};

function formatDeliveryWindow(days: number) {
  if (!Number.isFinite(days) || days < 0) return 'Estimate unavailable';
  if (days === 0) return 'Same day delivery';
  if (days === 1) return 'Delivered in 1 day';
  return `Delivered in ${days} days`;
}

function getRegionLabel(region: CustomerAddressRegion) {
  return REGION_OPTIONS.find((option) => option.value === region)?.label ?? region;
}

function buildLocationLabel(rate: DeliveryRate) {
  const region = rate.region_label || getRegionLabel(rate.region);
  const city = rate.city?.trim() || 'All cities';
  const area = rate.area?.trim() || 'All areas';

  return `${region} / ${city} / ${area}`;
}

function buildRateDescription(rate: DeliveryRate) {
  return `${formatCurrency(rate.fee)} • ${formatDeliveryWindow(
    Number(rate.estimated_days ?? 0),
  )} • ${rate.is_active ? 'Available at checkout' : 'Hidden from checkout'}`;
}

const config = {
  title: 'Delivery Rates',
  singular: 'Delivery Rate',
  idKey: 'id',
  description:
    'Create location-based delivery fees. Checkout uses the most specific active rate for each customer address.',
  list: async () => {
    const rates = await adminApi.deliveryRates();

    return rates.map((rate) => ({
      ...rate,
      name: buildLocationLabel(rate),
      description: buildRateDescription(rate),
      location_summary: buildLocationLabel(rate),
      fee_summary: formatCurrency(rate.fee),
      delivery_summary: formatDeliveryWindow(Number(rate.estimated_days ?? 0)),
    }));
  },
  create: adminApi.createDeliveryRate,
  update: adminApi.updateDeliveryRate,
  remove: adminApi.removeDeliveryRate,
  readOnly: false,
  searchable: true,
  pageSize: 8,
  fields: [
    {
      name: 'location_summary',
      label: 'Location',
      type: 'readonly',
      hideInForm: true,
    },
    {
      name: 'fee_summary',
      label: 'Fee',
      type: 'readonly',
      hideInForm: true,
    },
    {
      name: 'delivery_summary',
      label: 'Delivery time',
      type: 'readonly',
      hideInForm: true,
    },
    {
      name: 'is_active',
      label: 'Available',
      type: 'checkbox',
    },
    {
      name: 'region',
      label: 'Region',
      type: 'select',
      required: true,
      placeholder: 'Select delivery region',
      options: REGION_OPTIONS,
      helpText: 'Required. This is the main delivery zone.',
    },
    {
      name: 'city',
      label: 'City',
      type: 'text',
      placeholder: 'e.g. Kampala',
      preserveEmpty: true,
      helpText:
        'Optional. Leave blank to apply this rate to every city in the selected region.',
    },
    {
      name: 'area',
      label: 'Area / Neighborhood',
      type: 'text',
      placeholder: 'e.g. Ntinda, Kyanja, Muyenga',
      preserveEmpty: true,
      helpText:
        'Optional. Leave blank to create a city-wide or region-wide fallback rate.',
    },
    {
      name: 'fee',
      label: 'Delivery Fee',
      type: 'number',
      required: true,
      placeholder: 'e.g. 5000',
      helpText: 'Amount charged for delivery in UGX.',
    },
    {
      name: 'estimated_days',
      label: 'Estimated Delivery Days',
      type: 'number',
      required: true,
      placeholder: 'e.g. 1',
      helpText: 'Use 0 for same-day delivery, 1 for next-day delivery.',
    },
  ],
};

export default function DeliveryRateManager() {
  return <AdminResourceManager<DeliveryRateRecord> config={config} />;
}