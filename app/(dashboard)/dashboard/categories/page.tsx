'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Categories',
  singular: 'Category',
  idKey: 'slug',
  description: 'Manage catalog categories.',
  list: adminApi.categories,
  create: adminApi.createCategory,
  update: adminApi.updateCategory,
  remove: adminApi.removeCategory,
  readOnly: false,
  searchable: true,
  pageSize: 8,
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      required: true,
      autoSlugFrom: 'name',
      helpText: 'Auto-generated from name when creating.',
    },
    {
      name: 'image_url',
      label: 'Image URL',
      type: 'image',
      preview: true,
      placeholder: 'https://...',
    },
    { name: 'is_active', label: 'Is Active', type: 'checkbox' },
  ],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}