import Link from 'next/link';
import { catalogApi } from '@/lib/api/services';
import { ProductCard } from '@/components/products/product-card';

type CategoriesPageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

const FALLBACK_CATEGORY = '/images/cart.png';

function getCategoryName(category: any) {
  return typeof category === 'object' ? category?.name || '' : '';
}

function getCategorySlug(category: any) {
  return typeof category === 'object' ? category?.slug || '' : '';
}

function getCategoryImage(category: any) {
  return category?.image_url || FALLBACK_CATEGORY;
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const params = await searchParams;
  const rawCategory = (params.category || '').trim().toLowerCase();

  const [products, categories] = await Promise.all([
    catalogApi.products().catch(() => []),
    catalogApi.categories().catch(() => []),
  ]);

  const selectedCategory =
    categories.find((category: any) => {
      const id = String(category?.id || '').toLowerCase();
      const name = String(category?.name || '').toLowerCase();
      const slug = String(category?.slug || '').toLowerCase();

      if (!rawCategory) return false;

      return (
        id === rawCategory ||
        name === rawCategory ||
        slug === rawCategory
      );
    }) ||
    categories[0] ||
    null;

  const categoryProducts = selectedCategory
    ? products.filter((product: any) => {
        const categoryName = getCategoryName(product.category).toLowerCase();
        const categorySlug = getCategorySlug(product.category).toLowerCase();
        const categoryId = String(product?.category?.id || '').toLowerCase();

        return (
          categorySlug ===
            String(selectedCategory.slug || '').toLowerCase() ||
          categoryName ===
            String(selectedCategory.name || '').toLowerCase() ||
          categoryId ===
            String(selectedCategory.id || '').toLowerCase()
        );
      })
    : [];

  const getCategoryCount = (slug: string) =>
    products.filter(
      (product: any) =>
        getCategorySlug(product.category).toLowerCase() ===
        String(slug).toLowerCase()
    ).length;

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2162A1]">
          Categories
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          {selectedCategory
            ? selectedCategory.name
            : 'Shop by category'}
        </h1>

        <p className="mt-1 text-sm text-[#565959]">
          {selectedCategory
            ? `${categoryProducts.length} product${
                categoryProducts.length === 1 ? '' : 's'
              } in this category.`
            : 'Browse products by category.'}
        </p>
      </div>

      {!categories.length ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-bold">No categories yet</h2>

          <p className="mt-2 text-sm text-[#565959]">
            Categories will appear here once they are created.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Categories */}
          <section className="rounded-2xl border border-[#E7E7E7] bg-white p-3 shadow-sm md:p-4">
            <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
              {categories.map((category: any) => {
                const active =
                  selectedCategory &&
                  String(category?.slug || '').toLowerCase() ===
                    String(selectedCategory?.slug || '').toLowerCase();

                return (
                  <Link
                    key={category.id}
                    href={`/categories?category=${encodeURIComponent(
                      category.slug || category.name
                    )}`}
                    className={`group min-w-[90px] flex-shrink-0 rounded-xl border bg-white p-2 text-center transition hover:-translate-y-0.5 hover:shadow-sm ${
                      active
                        ? 'border-[#2162A1] ring-2 ring-[#2162A1]/10'
                        : 'border-transparent hover:border-[#D5D9D9] hover:bg-[#F7FAFA]'
                    }`}
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#F3F4F6]">
                      <img
                        src={getCategoryImage(category)}
                        alt={category.name || 'Category'}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>

                    <div className="mt-2">
                      <p
                        className={`line-clamp-1 text-xs font-bold ${
                          active
                            ? 'text-[#2162A1]'
                            : 'text-[#0F1111]'
                        }`}
                      >
                        {category.name}
                      </p>

                      <p className="mt-0.5 text-[11px] font-semibold text-[#565959]">
                        {getCategoryCount(category.slug)} items
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Products */}
          <div className="space-y-4">
            {selectedCategory ? (
              categoryProducts.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {categoryProducts.map((product: any) => (
                    <div
                      key={product.id}
                      className="rounded-xl border border-[#E7E7E7] bg-white p-2 transition hover:shadow-sm"
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                  <h2 className="text-xl font-bold">
                    No products found
                  </h2>

                  <p className="mt-2 text-sm text-[#565959]">
                    There are no products in this category yet.
                  </p>
                </div>
              )
            ) : (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <h2 className="text-xl font-bold">
                  No category selected
                </h2>

                <p className="mt-2 text-sm text-[#565959]">
                  Choose a category to view products.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}