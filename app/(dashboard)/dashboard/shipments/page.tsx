'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Shipments',
  singular: 'Shipment',
  idKey: 'id',
  description: 'Manage shipments and fulfillment actions.',
  list: adminApi.shipments,
  create: adminApi.createShipment,
  update: adminApi.updateShipment,
  remove: adminApi.removeShipment,
  actions: [{ label: 'Mark shipped', tone: 'primary', onClick: (item) => adminApi.markShipmentShipped(item.id, { tracking_number: `TRACK-${item.id}` }) }, { label: 'Mark in transit', tone: 'secondary', onClick: (item) => adminApi.markShipmentInTransit(item.id) }, { label: 'Mark delivered', tone: 'primary', onClick: (item) => adminApi.markShipmentDelivered(item.id) }],
  readOnly: false,
  fields: [{ name: 'order', label: 'Order ID', type: 'number' }, { name: 'address', label: 'Address ID', type: 'number' }, { name: 'shipping_method', label: 'Shipping method ID', type: 'number' }],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
