import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Wallet,
  Headphones,
  Tag,
  Package,
  Heart,
} from 'lucide-react';

import { catalogApi } from '@/lib/api/services';
import { ProductCard } from '@/components/products/product-card';

function ShoppingCartHeroSvg() {
  return (
    <div className="relative mx-auto flex w-full max-w-[520px] items-center justify-center">

      {/* Soft background glow */}
      <div className="absolute h-[260px] w-[260px] rounded-full bg-green-200 opacity-30 blur-3xl"></div>

      {/* Cart image */}
      <Image
        src="/images/cart.png"
        alt="Shopping cart"
        width={320}
        height={260}
        className="relative object-contain opacity-90 drop-shadow-2xl"
        priority
      />

    </div>
  );
}

function formatRating(value: number) {
  if (!Number.isFinite(value)) return '0.0';
  return value.toFixed(1);
}

export default async function HomePage() {
  const [products, categories, reviews, ratings] = await Promise.all([
    catalogApi.products().catch(() => []),
    catalogApi.categories().catch(() => []),
    catalogApi.reviews().catch(() => []),
    catalogApi.ratings().catch(() => []),
  ]);

  const sortedProducts = [...products].sort((a: any, b: any) => {
    const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });

  const featured = sortedProducts.slice(0, 8);
  const newArrivals = sortedProducts.slice(0, 4);
  const popularCategories = categories.slice(0, 6);

  const activeProducts = products.filter((item: any) => item?.is_active !== false);
  const inStockProducts = products.filter((item: any) => {
    if (typeof item?.is_in_stock === 'boolean') return item.is_in_stock;
    return Number(item?.stock_quantity || 0) > 0;
  });

  const totalReviews = reviews.length;
  const ratingValues = ratings
    .map((item: any) => Number(item?.rating))
    .filter((value: number) => Number.isFinite(value) && value > 0);

  const averageRating =
    ratingValues.length > 0
      ? ratingValues.reduce((sum: number, value: number) => sum + value, 0) / ratingValues.length
      : 0;

  const topStockProducts = [...products]
    .sort((a: any, b: any) => Number(b?.stock_quantity || 0) - Number(a?.stock_quantity || 0))
    .slice(0, 3);

  const heroTags = popularCategories.slice(0, 3).map((item: any) => item.name);

  return (
    <div className="space-y-16 py-6 md:space-y-20">
      {/* 1. Hero / Banner */}
      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-[#127D61] via-[#16916f] to-[#F79420] text-white shadow-sm">
        <div className="absolute left-0 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

        <div className="relative grid gap-10 px-6 py-10 md:grid-cols-[1.05fr_.95fr] md:px-10 md:py-14 xl:px-14">
          <div className="flex flex-col justify-center space-y-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              <ShoppingBag size={16} />
              Discover {activeProducts.length} products across {categories.length} categories
            </div>

            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-black leading-tight md:text-5xl">
                Shop smarter with curated products and fast delivery.
              </h2>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <ShoppingCartHeroSvg />
          </div>
        </div>
      </section>

      {/* 2. Store highlights */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#127D61]/10 text-[#127D61]">
            <Truck size={22} />
          </div>
          <h3 className="mt-5 text-xl font-black text-slate-900">Fast delivery</h3>
          <p className="mt-2 text-slate-600">
            Shop products ready for a smoother delivery experience from browse to doorstep.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F79420]/10 text-[#F79420]">
            <ShieldCheck size={22} />
          </div>
          <h3 className="mt-5 text-xl font-black text-slate-900">Secure payments</h3>
          <p className="mt-2 text-slate-600">
            Enjoy safer checkout with a shopping flow built around trust and convenience.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
            <Wallet size={22} />
          </div>
          <h3 className="mt-5 text-xl font-black text-slate-900">Great selection</h3>
          <p className="mt-2 text-slate-600">
            Browse {categories.length} categories and {activeProducts.length} active products in one place.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <Headphones size={22} />
          </div>
          <h3 className="mt-5 text-xl font-black text-slate-900">Customer confidence</h3>
          <p className="mt-2 text-slate-600">
            Built to help shoppers explore, compare, and buy with greater ease.
          </p>
        </div>
      </section>

      {/* 3. Featured categories */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex rounded-full bg-[#127D61]/10 px-3 py-1 text-sm font-bold text-[#127D61]">
              Featured categories
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">
              Shop by category
            </h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Explore the most visible categories in the store and jump straight into products you care about.
            </p>
          </div>

          <Link
            href="/categories"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 font-bold text-slate-800 transition hover:bg-slate-50"
          >
            All categories
            <ChevronRight size={18} />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {popularCategories.length ? (
            popularCategories.map((category: any) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#127D61]/30 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#127D61]/10 text-[#127D61]">
                  <Package size={22} />
                </div>
                <h3 className="mt-5 text-2xl font-black text-slate-900">{category.name}</h3>
                <p className="mt-2 text-slate-600">
                  Browse products in {category.name} and discover items worth adding to cart.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 font-bold text-[#F79420]">
                  Browse category
                  <ArrowRight size={16} />
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-slate-500">
              Categories will appear here once they are available.
            </div>
          )}
        </div>
      </section>

      {/* 4. Featured / trending products */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex rounded-full bg-[#F79420]/10 px-3 py-1 text-sm font-bold text-[#F79420]">
              Featured products
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">
              Fresh picks from the catalog
            </h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Recently available products from your live catalog, ready for browsing and checkout.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#127D61] px-4 py-3 font-bold text-white transition hover:opacity-95"
          >
            Shop all
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featured.length ? (
            featured.map((product: any) => <ProductCard key={product.id} product={product} />)
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-slate-500">
              No featured products available yet.
            </div>
          )}
        </div>
      </section>

      {/* 5. Promotional banner */}
      <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-r from-[#127D61] to-[#16916f] px-6 py-8 text-white shadow-sm md:px-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
              <Tag size={16} />
              Live store promo
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">
              Explore {inStockProducts.length} in-stock products available to shop right now
            </h2>
            <p className="mt-2 text-white/90">
              Browse the latest available products, compare options, and find something worth adding to your cart today.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-[#127D61]"
            >
              Explore products
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Social proof / reviews */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
              Social proof
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">
              Trusted by active shoppers
            </h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Live store activity from reviews, ratings, and product variety helps shoppers buy with confidence.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-1 text-[#F79420]">
              <Star size={18} fill="currentColor" />
              <Star size={18} fill="currentColor" />
              <Star size={18} fill="currentColor" />
              <Star size={18} fill="currentColor" />
              <Star size={18} fill="currentColor" />
            </div>
            <p className="mt-4 text-slate-600">
              Shoppers can explore products backed by visible store activity and review data.
            </p>
            <p className="mt-5 text-2xl font-black text-slate-900">{formatRating(averageRating)}</p>
            <p className="text-sm text-slate-500">Average rating</p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-1 text-[#F79420]">
              <Star size={18} />
            </div>
            <p className="mt-4 text-slate-600">
              Real customer interaction helps build trust in the storefront and product selection.
            </p>
            <p className="mt-5 text-2xl font-black text-slate-900">{totalReviews}</p>
            <p className="text-sm text-slate-500">Review records</p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-1 text-[#127D61]">
              <ShoppingBag size={18} />
            </div>
            <p className="mt-4 text-slate-600">
              A wider catalog makes it easier for shoppers to find the right fit faster.
            </p>
            <p className="mt-5 text-2xl font-black text-slate-900">{categories.length}</p>
            <p className="text-sm text-slate-500">Browseable categories</p>
          </div>
        </div>
      </section>

      {/* 7. New arrivals */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex rounded-full bg-[#127D61]/10 px-3 py-1 text-sm font-bold text-[#127D61]">
              New arrivals
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">
              Latest additions to the store
            </h2>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 font-bold text-slate-800 transition hover:bg-slate-50"
          >
            View more
            <ChevronRight size={18} />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {newArrivals.length ? (
            newArrivals.map((product: any) => (
              <ProductCard key={`new-${product.id}`} product={product} />
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-slate-500">
              New arrivals will appear here soon.
            </div>
          )}
        </div>
      </section>

      {/* 8. Final CTA */}
      <section className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 shadow-sm md:p-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#127D61]/10 px-3 py-1 text-sm font-bold text-[#127D61]">
              <Heart size={16} />
              Ready to shop?
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">
              Discover products that match your lifestyle
            </h2>
            <p className="mt-2 text-slate-600">
              Browse {activeProducts.length} products, explore {categories.length} categories, and shop with more confidence.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#127D61] px-5 py-3 font-bold text-white"
            >
              Start shopping
              <ArrowRight size={18} />
            </Link>

            <Link
              href="/categories"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-800"
            >
              Browse categories
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}