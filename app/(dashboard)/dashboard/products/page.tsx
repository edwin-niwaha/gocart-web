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
      description: 'Manage storefront products and product images.',
      list: async () =>
        (await adminApi.products()).map((product: any) => ({
          ...product,
          category_id: product.category?.id ?? '',
        })),
      create: adminApi.createProduct,
      update: adminApi.updateProduct,
      remove: adminApi.removeProduct,
      detailHref: (product: any) => `/products/${product.slug}`,
      showRecordId: false,
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
          name: 'images',
          label: 'Product images',
          type: 'image-list' as const,
          helpText: 'Add, update, remove, reorder, or deactivate product images. The first active image is shown in product cards.',
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
