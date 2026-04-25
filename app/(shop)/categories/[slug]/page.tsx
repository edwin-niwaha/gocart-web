'use client';

import { useEffect, useState } from 'react';
import { catalogApi } from '@/lib/api/services';
import type { Category, Product } from '@/lib/types';
import { ProductCard } from '@/components/products/product-card';

export default function CategoryDetailPage({ params }: { params: { slug: string } }) {
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    (async () => {
      const categoryData = await catalogApi.category(params.slug);
      const allProducts = await catalogApi.products();
      setCategory(categoryData);
      setProducts(allProducts.filter((item) => item.category?.id === categoryData.id));
    })();
  }, [params.slug]);

  if (!category) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold">{category.name}</h1>
        <p className="text-gray-600">Products in this category.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}
