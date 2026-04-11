'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Inventory',
  singular: 'Inventory Record',
  idKey: 'id',
  description: 'Manage stock records and inventory counts.',
  list: adminApi.inventory,
  create: adminApi.createInventory,
  update: adminApi.updateInventory,
  remove: adminApi.removeInventory,
  actions: [{ label: 'Quick restock +1', tone: 'secondary', onClick: (item: any) => adminApi.adjustInventory(item.id, { movement_type: 'IN', quantity: 1, note: 'Quick restock from web admin dashboard' }) }],
  readOnly: false,
  fields: [{ name: 'product', label: 'Product ID', type: 'number' }, { name: 'stock_quantity', label: 'Stock quantity', type: 'number' }, { name: 'reserved_quantity', label: 'Reserved quantity', type: 'number' }, { name: 'low_stock_threshold', label: 'Low stock threshold', type: 'number' }],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
