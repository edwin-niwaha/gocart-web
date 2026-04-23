'use client';

import { useMemo } from 'react';
import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';
import { useEffect, useState } from 'react';

type Category = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
};

export default function Page() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    adminApi.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const config = useMemo(
    () => ({
      title: 'Products',
      singular: 'Product',
      idKey: 'slug',
      description: 'Create, update, and remove storefront products.',
      list: adminApi.products,
      create: adminApi.createProduct,
      update: adminApi.updateProduct,
      remove: adminApi.removeProduct,
      readOnly: false,
      searchable: true,
      pageSize: 8,
      fields: [
        {
          name: 'title',
          label: 'Title',
          type: 'text' as const,
          required: true,
        },
        {
          name: 'slug',
          label: 'Slug',
          type: 'text' as const,
          required: true,
          autoSlugFrom: 'title',
          helpText: 'Auto-generated from title when creating.',
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea' as const,
        },
        {
          name: 'hero_image',
          label: 'Hero image URL',
          type: 'image' as const,
          preview: true,
          placeholder: 'https://...',
        },
        {
          name: 'image_urls',
          label: 'Image URLs JSON array',
          type: 'json' as const,
          helpText: 'Example: ["https://a.jpg", "https://b.jpg"]',
        },
        {
          name: 'base_price',
          label: 'Base price',
          type: 'number' as const,
          required: true,
        },
        {
          name: 'variants',
          label: 'Variants JSON array',
          type: 'json' as const,
          required: true,
          helpText:
            'Example: [{"name":"Default","sku":"SKU-001","price":10000,"stock_quantity":10,"is_active":true}]',
        },
        {
          name: 'is_featured',
          label: 'Featured product',
          type: 'checkbox' as const,
        },
        {
          name: 'category_id',
          label: 'Category',
          type: 'select' as const,
          required: true,
          options: categories.map((category) => ({
            label: category.name,
            value: category.id,
          })),
        },
        {
          name: 'is_active',
          label: 'Is Active',
          type: 'checkbox' as const,
        },
      ],
    }),
    [categories]
  );

  return <AdminResourceManager config={config} />;
}
