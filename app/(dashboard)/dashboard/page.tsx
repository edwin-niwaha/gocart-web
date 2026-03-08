'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Boxes,
  CreditCard,
  Package,
  Receipt,
  ShoppingCart,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react';

import { adminApi } from '@/lib/api/services';
import { formatCurrency } from '@/lib/utils';

const modules = [
  { label: 'Users', href: '/dashboard/users' },
  { label: 'Categories', href: '/dashboard/categories' },
  { label: 'Products', href: '/dashboard/products' },
  { label: 'Carts', href: '/dashboard/carts' },
  { label: 'Cart Items', href: '/dashboard/cart-items' },
  { label: 'Orders', href: '/dashboard/orders' },
  { label: 'Order Items', href: '/dashboard/order-items' },
  { label: 'Reviews', href: '/dashboard/reviews' },
  { label: 'Ratings', href: '/dashboard/ratings' },
  { label: 'Wishlists', href: '/dashboard/wishlists' },
  { label: 'Wishlist Items', href: '/dashboard/wishlist-items' },
  { label: 'Addresses', href: '/dashboard/addresses' },
  { label: 'Payments', href: '/dashboard/payments' },
  { label: 'Shipping Methods', href: '/dashboard/shipping-methods' },
  { label: 'Shipments', href: '/dashboard/shipments' },
  { label: 'Coupons', href: '/dashboard/coupons' },
  { label: 'Notifications', href: '/dashboard/notifications' },
  { label: 'Inventory', href: '/dashboard/inventory' },
  { label: 'Inventory Movements', href: '/dashboard/inventory-movements' },
];

type DashboardState = {
  users: any[];
  categories: any[];
  products: any[];
  orders: any[];
  payments: any[];
  inventory: any[];
  coupons: any[];
  carts: any[];
  reviews: any[];
  notifications: any[];
};

function sortByNewest(items: any[]) {
  return [...items].sort((a, b) => {
    const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<DashboardState>({
    users: [],
    categories: [],
    products: [],
    orders: [],
    payments: [],
    inventory: [],
    coupons: [],
    carts: [],
    reviews: [],
    notifications: [],
  });

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        users,
        categories,
        products,
        orders,
        payments,
        inventory,
        coupons,
        carts,
        reviews,
        notifications,
      ] = await Promise.all([
        adminApi.users().catch(() => []),
        adminApi.categories().catch(() => []),
        adminApi.products().catch(() => []),
        adminApi.orders().catch(() => []),
        adminApi.payments().catch(() => []),
        adminApi.inventory().catch(() => []),
        adminApi.coupons().catch(() => []),
        adminApi.carts().catch(() => []),
        adminApi.reviews().catch(() => []),
        adminApi.notifications().catch(() => []),
      ]);

      setData({
        users,
        categories,
        products,
        orders,
        payments,
        inventory,
        coupons,
        carts,
        reviews,
        notifications,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const analytics = useMemo(() => {
    const revenue = data.payments.reduce(
      (sum, item) => sum + Number(item?.amount || 0),
      0
    );

    const paidPayments = data.payments.filter((item) => {
      const status = String(item?.status || '').toLowerCase();
      return status.includes('paid') || status.includes('success') || status.includes('completed');
    }).length;

    const activeProducts = data.products.filter((item) => item?.is_active).length;
    const inactiveProducts = data.products.filter((item) => item?.is_active === false).length;
    const activeCategories = data.categories.filter((item) => item?.is_active).length;

    const outOfStockProducts = data.products.filter(
      (item) => Number(item?.stock_quantity || 0) <= 0
    ).length;

    const lowStockProducts = data.products.filter((item) => {
      const qty = Number(item?.stock_quantity || 0);
      return qty > 0 && qty <= 5;
    }).length;

    const totalUnitsInStock = data.products.reduce(
      (sum, item) => sum + Number(item?.stock_quantity || 0),
      0
    );

    const averageOrderValue =
      data.orders.length > 0 ? revenue / data.orders.length : 0;

    const averagePaymentValue =
      data.payments.length > 0 ? revenue / data.payments.length : 0;

    const recentProducts = sortByNewest(data.products).slice(0, 5);
    const recentOrders = sortByNewest(data.orders).slice(0, 5);
    const recentUsers = sortByNewest(data.users).slice(0, 5);

    const topStockProducts = [...data.products]
      .sort((a, b) => Number(b?.stock_quantity || 0) - Number(a?.stock_quantity || 0))
      .slice(0, 5);

    return {
      revenue,
      paidPayments,
      activeProducts,
      inactiveProducts,
      activeCategories,
      outOfStockProducts,
      lowStockProducts,
      totalUnitsInStock,
      averageOrderValue,
      averagePaymentValue,
      recentProducts,
      recentOrders,
      recentUsers,
      topStockProducts,
    };
  }, [data]);

  return (
    <div className="space-y-6 py-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-orange-50 p-6 shadow-sm md:p-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-100/50 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-orange-100/60 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#F79420] shadow-sm">
              <Sparkles size={14} />
              GoCart premium admin
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              Smart store operations dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 md:text-base">
              Monitor growth, revenue, product health, stock pressure, and operational
              activity from one polished control center.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/dashboard/products"
              className="rounded-2xl bg-[#127D61] px-5 py-3 text-center text-sm font-bold text-white transition hover:opacity-90"
            >
              Manage products
            </Link>
            <Link
              href="/dashboard/orders"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              View orders
            </Link>
            <Link
              href="/dashboard/categories"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Add categories
            </Link>
            <button
              type="button"
              onClick={loadDashboard}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Refresh data
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        <PremiumStatCard
          label="Tracked revenue"
          value={formatCurrency(analytics.revenue)}
          helper={`Avg payment ${formatCurrency(analytics.averagePaymentValue)}`}
          icon={BadgeDollarSign}
        />
        <PremiumStatCard
          label="Orders"
          value={data.orders.length}
          helper={`Avg order ${formatCurrency(analytics.averageOrderValue)}`}
          icon={Receipt}
        />
        <PremiumStatCard
          label="Products"
          value={data.products.length}
          helper={`${analytics.activeProducts} active`}
          icon={Package}
        />
        <PremiumStatCard
          label="Customers"
          value={data.users.length}
          helper="Registered accounts"
          icon={Users}
        />
        <PremiumStatCard
          label="Units in stock"
          value={analytics.totalUnitsInStock}
          helper={`${analytics.lowStockProducts} low stock`}
          icon={Boxes}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">Performance snapshot</h2>
              <p className="text-sm text-slate-500">
                High-value business and catalog metrics
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-3 py-1 text-xs font-bold text-[#127D61]">
              Live overview
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <MetricTile
              title="Payments captured"
              value={analytics.paidPayments}
              subtitle={`${data.payments.length} total payment records`}
            />
            <MetricTile
              title="Active categories"
              value={analytics.activeCategories}
              subtitle={`${data.categories.length} total categories`}
            />
            <MetricTile
              title="Inactive products"
              value={analytics.inactiveProducts}
              subtitle="Products not visible to shoppers"
            />
            <MetricTile
              title="Open carts"
              value={data.carts.length}
              subtitle="Shopping activity currently tracked"
            />
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Revenue intensity
              </h3>
              <span className="text-xs text-slate-400">
                Based on payment records
              </span>
            </div>

            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Total tracked revenue</p>
                  <p className="mt-1 text-3xl font-black text-slate-900">
                    {formatCurrency(analytics.revenue)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Per order</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatCurrency(analytics.averageOrderValue)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid h-28 grid-cols-8 items-end gap-2">
                {Array.from({ length: 8 }).map((_, index) => {
                  const heights = ['35%', '50%', '42%', '68%', '56%', '82%', '61%', '92%'];
                  return (
                    <div
                      key={index}
                      className="rounded-t-2xl bg-gradient-to-t from-[#127D61] to-emerald-300"
                      style={{ height: heights[index] }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">Operational alerts</h2>
              <p className="text-sm text-slate-500">Items needing attention</p>
            </div>
            <AlertTriangle className="text-amber-500" size={20} />
          </div>

          <div className="space-y-3">
            <AlertRow
              title="Out-of-stock products"
              value={analytics.outOfStockProducts}
              tone={
                analytics.outOfStockProducts > 0
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }
            />
            <AlertRow
              title="Low-stock products"
              value={analytics.lowStockProducts}
              tone={
                analytics.lowStockProducts > 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }
            />
            <AlertRow
              title="Unread notifications"
              value={data.notifications.length}
              tone="bg-blue-50 text-blue-700 border-blue-200"
            />
            <AlertRow
              title="Pending reviews"
              value={data.reviews.length}
              tone="bg-purple-50 text-purple-700 border-purple-200"
            />
          </div>

          <div className="mt-6 space-y-3">
            <Link
              href="/dashboard/inventory"
              className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
            >
              Open inventory tools
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/dashboard/notifications"
              className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
            >
              Review notifications
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">Recent orders</h2>
              <p className="text-sm text-slate-500">Most recent transaction activity</p>
            </div>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#127D61]"
            >
              View all <ArrowRight size={16} />
            </Link>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-slate-100">
            <div className="hidden grid-cols-[1.2fr_1fr_0.8fr] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
              <span>Order</span>
              <span>Created</span>
              <span className="text-right">Status</span>
            </div>

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="px-4 py-4 text-sm text-slate-500">Loading orders...</div>
              ) : analytics.recentOrders.length === 0 ? (
                <div className="px-4 py-4 text-sm text-slate-500">No orders found.</div>
              ) : (
                analytics.recentOrders.map((order) => (
                  <div
                    key={String(order?.slug ?? order?.id)}
                    className="grid gap-2 px-4 py-4 md:grid-cols-[1.2fr_1fr_0.8fr] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900">
                        {order?.slug ?? `Order #${order?.id ?? '—'}`}
                      </p>
                      {order?.total_amount != null ? (
                        <p className="text-sm text-slate-500">
                          {formatCurrency(Number(order.total_amount))}
                        </p>
                      ) : null}
                    </div>

                    <p className="text-sm text-slate-500">
                      {formatDate(order?.created_at)}
                    </p>

                    <div className="md:text-right">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {String(order?.status || 'Unknown')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">Recent users</h2>
              <p className="text-sm text-slate-500">Newest account activity</p>
            </div>
            <Link
              href="/dashboard/users"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#127D61]"
            >
              View all <ArrowRight size={16} />
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading users...</p>
            ) : analytics.recentUsers.length === 0 ? (
              <p className="text-sm text-slate-500">No users found.</p>
            ) : (
              analytics.recentUsers.map((user) => (
                <div
                  key={String(user?.id ?? user?.email)}
                  className="rounded-2xl border border-slate-100 p-3"
                >
                  <p className="truncate font-bold text-slate-900">
                    {user?.email ?? user?.username ?? 'Unknown user'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {String(user?.user_type || 'USER')}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {formatDate(user?.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">Recent products</h2>
              <p className="text-sm text-slate-500">Latest catalog additions</p>
            </div>
            <Link
              href="/dashboard/products"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#127D61]"
            >
              View all <ArrowRight size={16} />
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading products...</p>
            ) : analytics.recentProducts.length === 0 ? (
              <p className="text-sm text-slate-500">No products found.</p>
            ) : (
              analytics.recentProducts.map((product) => (
                <div
                  key={String(product?.slug ?? product?.id)}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900">
                      {product?.title ?? product?.name ?? 'Untitled'}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {product?.slug ?? '—'}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      {product?.price != null ? formatCurrency(Number(product.price)) : '—'}
                    </p>
                    <p className="text-xs text-slate-400">
                      Stock: {Number(product?.stock_quantity || 0)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">Top stocked products</h2>
              <p className="text-sm text-slate-500">Highest inventory levels</p>
            </div>
            <Package className="text-slate-400" size={18} />
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">Loading inventory view...</p>
            ) : analytics.topStockProducts.length === 0 ? (
              <p className="text-sm text-slate-500">No product stock data found.</p>
            ) : (
              analytics.topStockProducts.map((product, index) => {
                const qty = Number(product?.stock_quantity || 0);
                const width = Math.max(10, Math.min(100, qty));
                return (
                  <div key={String(product?.slug ?? product?.id)}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {index + 1}. {product?.title ?? product?.name ?? 'Untitled'}
                      </p>
                      <span className="text-xs font-semibold text-slate-500">
                        {qty} units
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#127D61] to-emerald-300"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Modules</h2>
            <p className="text-sm text-slate-500">
              Quick access to every admin area.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-slate-800">{module.label}</span>
                <ArrowRight
                  size={16}
                  className="text-slate-400 transition group-hover:text-[#127D61]"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function PremiumStatCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  helper?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 break-words text-3xl font-black tracking-tight text-slate-900">
            {value}
          </p>
          {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-orange-50 p-3">
          <Icon size={20} className="text-[#127D61]" />
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#127D61] to-emerald-300" />
      </div>
    </div>
  );
}

function MetricTile({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}

function AlertRow({
  title,
  value,
  tone,
}: {
  title: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-lg font-black">{value}</span>
      </div>
    </div>
  );
}