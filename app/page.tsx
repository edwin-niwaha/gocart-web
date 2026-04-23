import Link from 'next/link';
import {
  ChevronRight,
  Truck,
  ShieldCheck,
} from 'lucide-react';

import { catalogApi } from '@/lib/api/services';
import { ProductCard } from '@/components/products/product-card';

const FALLBACK_CATEGORY = '/images/cart.png';

function getProductImage(product: any) {
  return product?.hero_image || product?.image_urls?.[0] || '/images/cart.png';
}

function formatPrice(value: any) {
  const amount = Number(value || 0);
  return `UGX ${amount.toLocaleString()}`;
}

function getCategoryName(category: any) {
  return typeof category === 'object' ? category?.name || '' : '';
}

function getCategorySlug(category: any) {
  return typeof category === 'object' ? category?.slug || '' : '';
}

function getProductSubtitle(product: any) {
  const categoryName = getCategoryName(product?.category);
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const activeVariants = variants.filter((variant: any) => variant?.is_active);

  if (!activeVariants.length) return categoryName || 'Available now';
  if (activeVariants.length === 1) {
    return categoryName || activeVariants[0]?.name || 'Available now';
  }

  return categoryName
    ? `${categoryName} • ${activeVariants.length} options`
    : `${activeVariants.length} options`;
}

function isProductInStock(product: any) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const activeVariants = variants.filter((variant: any) => variant?.is_active);

  if (activeVariants.length > 0) {
    return activeVariants.some((variant: any) => variant?.is_in_stock);
  }

  if (typeof product?.is_in_stock === 'boolean') return product.is_in_stock;
  return Number(product?.stock_quantity || 0) > 0;
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    catalogApi.products().catch(() => []),
    catalogApi.categories().catch(() => []),
  ]);

  const activeProducts = products.filter((item: any) => item?.is_active !== false);

  const sortedProducts = [...activeProducts].sort((a: any, b: any) => {
    const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });

  const featuredProducts = sortedProducts.filter((item: any) => item?.is_featured).slice(0, 8);
  const newArrivals = sortedProducts.slice(0, 8);
  const popularCategories = categories.slice(0, 6);
  const heroSlides = (featuredProducts.length ? featuredProducts : newArrivals).slice(0, 5);
  const heroTrack = heroSlides.length ? [...heroSlides, ...heroSlides] : [];

  return (
    <div className="min-h-screen bg-[#EAEDED] text-[#0F1111]">
      <main className="mx-auto max-w-[1500px] px-3 py-4 sm:px-4 lg:px-5">
        <section className="overflow-hidden rounded-lg bg-gradient-to-r from-[#dfefff] via-[#eef6fb] to-[#f8f8f8] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(620px,760px)] xl:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2162A1] sm:text-sm">
                Featured collection
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Shop smarter, every day!
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#37475A] sm:text-base">
                Explore popular products, new arrivals, and trusted essentials in one clean,
                responsive shopping experience.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="rounded-md bg-[#FFD814] px-5 py-2.5 text-sm font-semibold text-[#0F1111] transition hover:bg-[#F7CA00]"
                >
                  Shop now
                </Link>
                <Link
                  href="/categories"
                  className="rounded-md border border-[#D5D9D9] bg-white px-5 py-2.5 text-sm font-semibold text-[#0F1111] transition hover:bg-[#F7FAFA]"
                >
                  Browse categories
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg bg-white p-3 shadow-sm">
              {heroTrack.length ? (
                <div className="hero-carousel-track flex w-max gap-3">
                  {heroTrack.map((product: any, index: number) => (
                    <Link
                      key={`${product.id}-${index}`}
                      href={`/products/${product.slug}`}
                      className="hero-carousel-card block w-[220px] shrink-0 rounded-md border border-[#E7E7E7] bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-sm sm:w-[240px] lg:w-[250px]"
                    >
                      <div className="flex h-40 items-center justify-center rounded-md bg-[#F7F8F8] p-3 sm:h-44 lg:h-48">
                        <img
                          src={getProductImage(product)}
                          alt={product.title}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm font-medium">{product.title}</p>
                      <p className="mt-1 text-xs text-[#565959]">{getProductSubtitle(product)}</p>
                      <p className="mt-2 text-base font-bold">
                        {formatPrice(product.base_price ?? product.price ?? 0)}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-sm text-[#565959]">
                  Featured products will appear here once available.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="-mt-4 grid gap-4 lg:-mt-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-[21px] font-bold">Shop by category</h2>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {popularCategories.length ? (
                popularCategories.map((category: any) => (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.id}`}
                    className="flex items-center gap-3 rounded-md border border-[#E7E7E7] p-3 transition hover:bg-[#F7FAFA]"
                  >
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[#E7E7E7] bg-[#F7F8F8]">
                      <img
                        src={category.image_url || FALLBACK_CATEGORY}
                        alt={category.name || 'Category'}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{category.name}</p>
                      <p className="text-xs text-[#565959]">Browse essentials</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-[#565959]">Categories will appear here once available.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-[21px] font-bold">Featured products</h2>
              <Link href="/products" className="text-sm text-[#007185] hover:underline">
                See more
              </Link>
            </div>

            {featuredProducts.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {featuredProducts.map((product: any) => (
                  <div key={product.id} className="rounded-md border border-[#E7E7E7] p-3 transition hover:shadow-sm">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#565959]">No featured products available yet.</p>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-lg bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[21px] font-bold">New arrivals</h2>
            <Link href="/products" className="text-sm text-[#007185] hover:underline">
              View all
            </Link>
          </div>

          {newArrivals.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {newArrivals.map((product: any) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="rounded-md border border-[#E7E7E7] p-3 transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="flex h-44 items-center justify-center rounded-md bg-[#F7F8F8] p-3 sm:h-48">
                    <img
                      src={getProductImage(product)}
                      alt={product.title}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm font-medium">{product.title}</p>
                  <p className="mt-1 text-xs text-[#565959]">{getProductSubtitle(product)}</p>
                  <p className="mt-2 text-lg font-bold">
                    {formatPrice(product.base_price ?? product.price ?? 0)}
                  </p>
                  <p className={`mt-1 text-xs ${isProductInStock(product) ? 'text-[#067D62]' : 'text-[#B12704]'}`}>
                    {isProductInStock(product) ? 'In stock' : 'Out of stock'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#565959]">Products will appear here once available.</p>
          )}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-lg bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Truck size={18} /> Fast delivery
            </div>
            <p className="text-sm text-[#565959]">Reliable delivery from order to doorstep.</p>
          </div>

          <div className="rounded-lg bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck size={18} /> Secure checkout
            </div>
            <p className="text-sm text-[#565959]">A simple and safe purchase flow for every order.</p>
          </div>

          <div className="rounded-lg bg-white p-5 shadow-sm md:col-span-2 xl:col-span-1">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[21px] font-bold">Need more?</h2>
              <ChevronRight size={18} />
            </div>
            <p className="text-sm text-[#565959]">
              Browse the full catalog and discover more products for your store.
            </p>
            <Link
              href="/products"
              className="mt-4 inline-flex rounded-md bg-[#FFD814] px-5 py-2.5 text-sm font-semibold text-[#0F1111] transition hover:bg-[#F7CA00]"
            >
              Explore products
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
