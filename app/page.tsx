import Link from 'next/link';
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
  Heart,
  Package,
  Smartphone,
  Shirt,
  Home,
  Gift,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

import { catalogApi } from '@/lib/api/services';
import { ProductCard } from '@/components/products/product-card';

function getProductImage(product: any) {
  return product?.hero_image || product?.image_urls?.[0] || '/images/cart.png';
}

function HeroProductMarquee({ products }: { products: any[] }) {
  const slides = products
    .map((product) => ({
      id: product.id,
      title: product.title,
      image: getProductImage(product),
      price: product.base_price ?? product.price ?? 0,
      slug: product.slug,
    }))
    .filter((item) => item.image)
    .slice(0, 8);

  const fallbackSlides = slides.length
    ? slides
    : [
        {
          id: 'fallback-1',
          title: 'GoCart Picks',
          image: '/images/cart.png',
          price: 0,
          slug: '/products',
        },
      ];

  const loopSlides = [...fallbackSlides, ...fallbackSlides];

  return (
    <div className="hero-marquee-wrap">
      <div className="hero-marquee-glow" />

      <div className="hero-marquee-row">
        <div className="hero-marquee-track">
          {loopSlides.map((item: any, index: number) => (
            <Link
              key={`${item.id}-${index}`}
              href={
                typeof item.slug === 'string' && item.slug.startsWith('/')
                  ? item.slug
                  : `/products/${item.slug}`
              }
              className="hero-product-card"
            >
              <img
                src={item.image}
                alt={item.title}
                className="hero-product-image"
              />
              <div className="hero-product-meta">
                <p className="hero-product-title">{item.title}</p>
                {Number(item.price) > 0 ? (
                  <p className="hero-product-price">
                    UGX {Number(item.price).toLocaleString()}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatRating(value: number) {
  if (!Number.isFinite(value)) return '0.0';
  return value.toFixed(1);
}

function getCategoryIcon(name: string) {
  const key = name.toLowerCase();

  if (key.includes('elect')) return Smartphone;
  if (key.includes('fashion') || key.includes('cloth')) return Shirt;
  if (key.includes('home') || key.includes('furniture')) return Home;
  if (key.includes('gift')) return Gift;
  if (key.includes('beauty') || key.includes('cosmetic')) return Sparkles;

  return Package;
}

function getCategoryBlurb(name: string) {
  return `Browse top picks in ${name}.`;
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

  const featuredProducts = sortedProducts.slice(0, 10);
  const popularCategories = categories.slice(0, 10);

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
      ? ratingValues.reduce((sum: number, value: number) => sum + value, 0) /
        ratingValues.length
      : 0;

  return (
    <div className="space-y-16 py-8 md:space-y-24">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#127D61] via-[#16916f] to-[#F79420] text-white shadow-[0_20px_60px_rgba(18,125,97,0.18)]">
        <div className="absolute left-0 top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

        <div className="relative grid gap-10 px-6 py-10 md:grid-cols-[1.05fr_.95fr] md:px-10 md:py-14 xl:px-14">
          <div className="flex flex-col justify-center space-y-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              <ShoppingBag size={16} />
              {activeProducts.length} products · {categories.length} categories
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-5xl xl:text-6xl">
                Shop smarter, every day.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/90 md:text-lg">
                Discover quality products, trusted prices, and a smoother shopping
                experience from browse to checkout.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-[#127D61] shadow-sm"
              >
                Shop now
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/categories"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/30 px-5 py-3 font-semibold text-white"
              >
                Browse categories
                <ChevronRight size={18} />
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 pt-2 text-sm text-white/90">
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} />
                Secure checkout
              </div>
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} />
                Fast delivery
              </div>
              <div className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} />
                Trusted shopping
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <HeroProductMarquee
              products={featuredProducts.length ? featuredProducts : products.slice(0, 8)}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#127D61]/10 text-[#127D61]">
            <Truck size={22} />
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-900">Fast delivery</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Get products delivered with a faster and smoother shopping experience.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F79420]/10 text-[#F79420]">
            <ShieldCheck size={22} />
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-900">Secure checkout</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Pay with confidence through a safer and simpler checkout flow.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
            <Wallet size={22} />
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-900">Great selection</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Explore {categories.length} categories and {activeProducts.length} live products.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <Headphones size={22} />
          </div>
          <h3 className="mt-4 text-lg font-black text-slate-900">Customer support</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Shop with confidence and a more helpful experience every step of the way.
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex rounded-full bg-[#127D61]/10 px-3 py-1 text-sm font-bold text-[#127D61]">
              Categories
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              Shop by category
            </h2>
            <p className="mt-2 max-w-xl text-slate-600">
              Jump into the collections shoppers explore most.
            </p>
          </div>

          <Link
            href="/categories"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            View all
            <ChevronRight size={18} />
          </Link>
        </div>

        {popularCategories.length ? (
          <div className="carousel-shell">
            <div className="carousel-track">
              {popularCategories.map((category: any) => {
                const Icon = getCategoryIcon(category.name);

                return (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.id}`}
                    className="category-slide group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#127D61]/10 text-[#127D61]">
                      <Icon size={22} />
                    </div>

                    <h3 className="mt-4 text-base font-bold text-slate-900">
                      {category.name}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                      {getCategoryBlurb(category.name)}
                    </p>

                    <div className="mt-4 inline-flex items-center gap-2 font-semibold text-[#F79420]">
                      Explore
                      <ArrowRight size={16} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-slate-500">
            Categories will appear here once they are available.
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex rounded-full bg-[#F79420]/10 px-3 py-1 text-sm font-bold text-[#F79420]">
              Featured products
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              Fresh picks from the catalog
            </h2>
            <p className="mt-2 max-w-xl text-slate-600">
              Recently added products ready for browsing and checkout.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#127D61] px-4 py-3 font-semibold text-white transition hover:opacity-95"
          >
            Shop all
            <ArrowRight size={18} />
          </Link>
        </div>

        {featuredProducts.length ? (
          <div className="carousel-shell">
            <div className="carousel-track products-track">
              {featuredProducts.map((product: any) => (
                <div key={product.id} className="product-slide flex">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-slate-500">
            No featured products available yet.
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50 p-6">
            <div className="flex items-center gap-1 text-[#F79420]">
              <Star size={18} fill="currentColor" />
              <Star size={18} fill="currentColor" />
              <Star size={18} fill="currentColor" />
              <Star size={18} fill="currentColor" />
              <Star size={18} fill="currentColor" />
            </div>
            <p className="mt-4 text-sm text-slate-600">Average product rating</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-slate-900">
              {formatRating(averageRating)}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F79420]/10 text-[#F79420]">
              <Star size={18} />
            </div>
            <p className="mt-4 text-sm text-slate-600">Customer review records</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-slate-900">
              {totalReviews}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#127D61]/10 text-[#127D61]">
              <ShoppingBag size={18} />
            </div>
            <p className="mt-4 text-sm text-slate-600">Products in stock now</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-slate-900">
              {inStockProducts.length}
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#127D61] to-[#16916f] px-6 py-8 text-white shadow-sm md:px-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
              <Tag size={16} />
              Live store
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">
              {inStockProducts.length} products currently in stock
            </h2>
            <p className="mt-2 text-white/90">
              Explore available products and discover something worth adding to your cart today.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-[#127D61]"
          >
            Explore products
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 shadow-sm md:p-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#127D61]/10 px-3 py-1 text-sm font-bold text-[#127D61]">
              <Heart size={16} />
              Ready to shop?
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              Discover products that match your lifestyle
            </h2>
            <p className="mt-2 text-slate-600">
              Browse {activeProducts.length} products, explore {categories.length} categories,
              and shop with confidence.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#127D61] px-5 py-3 font-semibold text-white"
            >
              Start shopping
              <ArrowRight size={18} />
            </Link>

            <Link
              href="/categories"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-800"
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