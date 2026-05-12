'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

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
      description:
        'Manage storefront products, descriptions, variants, categories, and product images.',
      list: async () =>
        (await adminApi.products()).map((product: any) => ({
          ...product,
          category_id: product.category?.id ?? '',
          variants: Array.isArray(product.variants) ? product.variants : [],
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
          label: 'Product Title',
          type: 'text' as const,
          required: true,
          placeholder: 'e.g. Fresh Matooke Bundle',
          helpText: 'This is the main product name shown to customers.',
        },
        {
          name: 'description',
          label: 'Product Description',
          type: 'textarea' as const,
          required: true,
          placeholder:
            'Describe the product, benefits, size, quality, and usage...',
          helpText: 'This appears on the product detail page.',
        },
        {
          name: 'category_id',
          label: 'Category',
          type: 'select' as const,
          required: true,
          placeholder: 'Select product category',
          options: categories.map((category) => ({
            label: category.name,
            value: category.id,
          })),
        },
        {
          name: 'variants',
          label: 'Product Variants',
          type: 'variant-list' as const,
          required: true,
          helpText:
            'Add at least one variant. Example: Default, 1kg, Small, Large, Black, Red, etc.',
        },
        {
          name: 'images',
          label: 'Product Images',
          type: 'image-list' as const,
          helpText:
            'Add, update, remove, reorder, or deactivate product images. The first active image is shown in product cards.',
        },
        {
          name: 'is_featured',
          label: 'Featured Product',
          type: 'checkbox' as const,
          helpText: 'Featured products can be highlighted on the homepage.',
        },
        {
          name: 'is_active',
          label: 'Is Active',
          type: 'checkbox' as const,
          helpText: 'Only active products should be visible to customers.',
        },
      ],
    }),
    [categories],
  );

  return <AdminResourceManager config={config} />;
}