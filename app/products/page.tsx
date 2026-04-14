import Link from 'next/link';
import { catalogApi } from '@/lib/api/services';
import { ProductCard } from '@/components/products/product-card';

type ProductsPageProps = {
  searchParams: Promise<{
    category?: string;
    search?: string;
  }>;
};

function getCategoryName(category: any) {
  return typeof category === 'object' ? category?.name || '' : '';
}

function getCategorySlug(category: any) {
  return typeof category === 'object' ? category?.slug || '' : '';
}

function getVariantsSearchText(product: any) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];

  return variants
    .map((variant: any) => [variant?.name || '', variant?.sku || ''].join(' '))
    .join(' ');
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const rawCategory = (params.category || '').trim().toLowerCase();
  const rawSearch = (params.search || '').trim().toLowerCase();

  const [products, categories] = await Promise.all([
    catalogApi.products(),
    catalogApi.categories(),
  ]);

  const filteredProducts = products.filter((product: any) => {
    const categoryName = getCategoryName(product.category).toLowerCase();
    const categorySlug = getCategorySlug(product.category).toLowerCase();
    const categoryId = String(product?.category?.id || '').toLowerCase();

    const matchesCategory = rawCategory
      ? categorySlug === rawCategory ||
        categoryName === rawCategory ||
        categoryId === rawCategory
      : true;

    if (!matchesCategory) return false;
    if (!rawSearch) return true;

    const searchableText = [
      product?.title || '',
      product?.slug || '',
      product?.description || '',
      getCategoryName(product.category),
      getCategorySlug(product.category),
      getVariantsSearchText(product),
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(rawSearch);
  });

  const activeCategory = categories.find((category: any) => {
    const id = String(category.id).toLowerCase();
    const name = String(category.name || '').toLowerCase();
    const slug = String(category.slug || '').toLowerCase();

    return rawCategory
      ? id === rawCategory || name === rawCategory || slug === rawCategory
      : false;
  });

  return (
    <div className="space-y-6 py-6">
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#2162A1]">
              Store
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {activeCategory
                ? `${activeCategory.name} products`
                : rawSearch
                  ? `Search results for "${params.search}"`
                  : 'Browse products'}
            </h1>

            <p className="mt-2 text-sm text-[#565959]">
              {activeCategory && rawSearch
                ? `Showing ${filteredProducts.length} result(s) in ${activeCategory.name} for "${params.search}".`
                : activeCategory
                  ? `Showing ${filteredProducts.length} product(s) under ${activeCategory.name}.`
                  : rawSearch
                    ? `Showing ${filteredProducts.length} result(s) for "${params.search}".`
                    : 'Browse all available products in the store.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/products"
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                !rawCategory
                  ? 'border-[#131921] bg-[#131921] text-white'
                  : 'border-[#D5D9D9] bg-white text-[#0F1111]'
              }`}
            >
              All
            </Link>

            {categories.slice(0, 8).map((category: any) => {
              const active =
                String(category.id).toLowerCase() === rawCategory ||
                String(category.name || '').toLowerCase() === rawCategory ||
                String(category.slug || '').toLowerCase() === rawCategory;

              return (
                <Link
                  key={category.id}
                  href={`/products?category=${encodeURIComponent(category.slug || category.name)}`}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                    active
                      ? 'border-[#131921] bg-[#131921] text-white'
                      : 'border-[#D5D9D9] bg-white text-[#0F1111]'
                  }`}
                >
                  {category.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {filteredProducts.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product: any) => (
            <div
              key={product.id}
              className="rounded-md border border-[#E7E7E7] bg-white p-3 transition hover:shadow-sm"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-bold">No products found</h2>
          <p className="mt-2 text-sm text-[#565959]">
            Try another product name, category, or clear your search.
          </p>
          <Link
            href="/products"
            className="mt-4 inline-flex rounded-md bg-[#FFD814] px-5 py-2.5 text-sm font-semibold text-[#0F1111] hover:bg-[#F7CA00]"
          >
            View all products
          </Link>
        </div>
      )}
    </div>
  );
}