'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Inventory Movements',
  singular: 'Inventory Movement',
  idKey: 'id',
  description: 'Read-only stock movement log.',
  list: adminApi.inventoryMovements,



  actions: undefined,
  readOnly: true,
  fields: [],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
