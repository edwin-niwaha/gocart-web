import { catalogApi } from '@/lib/api/services';
import { ProductCard } from '@/components/products/product-card';

type ProductsPageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const categoryId = params.category;

  const [products, categories] = await Promise.all([
    catalogApi.products(categoryId ? { category: categoryId } : undefined),
    catalogApi.categories(),
  ]);

  const activeCategory = categories.find(
    (category) => String(category.id) === String(categoryId)
  );

  return (
    <div className="space-y-6 py-6">
      <div className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="badge">Store</p>
          <h1 className="mt-2 text-4xl font-black">
            {activeCategory
              ? `${activeCategory.name} products`
              : 'Browse products'}
          </h1>
          <p className="mt-2 subtle">
            {activeCategory
              ? `Showing products under ${activeCategory.name}.`
              : 'Every product card supports cart and wishlist actions.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 8).map((category) => (
            <span
              key={category.id}
              className={`badge ${
                String(category.id) === String(categoryId)
                  ? 'bg-[var(--brand-green)] text-white'
                  : ''
              }`}
            >
              {category.name}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}