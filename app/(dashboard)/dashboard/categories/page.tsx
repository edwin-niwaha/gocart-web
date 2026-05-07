'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Categories',
  singular: 'Category',
  idKey: 'slug',
  description: 'Manage catalog categories and their storefront icons.',
  list: adminApi.categories,
  create: adminApi.createCategory,
  update: adminApi.updateCategory,
  remove: adminApi.removeCategory,
  showRecordId: false,
  readOnly: false,
  searchable: true,
  pageSize: 8,
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    {
      name: 'image',
      label: 'Category icon',
      type: 'image',
      preview: true,
      hideInList: true,
      helpText: 'Upload a small square image for category cards and shortcuts.',
    },
    { name: 'is_active', label: 'Is Active', type: 'checkbox' },
  ],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
