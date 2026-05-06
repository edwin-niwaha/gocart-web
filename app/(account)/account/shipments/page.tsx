'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  MapPin,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
} from 'lucide-react';
import { getApiErrorMessage, shippingApi } from '@/lib/api/services';
import type { Shipment } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-UG', { dateStyle: 'medium' }).format(date);
}

function statusClasses(status?: string) {
  switch (String(status || '').toUpperCase()) {
    case 'DELIVERED':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
    case 'SHIPPED':
    case 'IN_TRANSIT':
      return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
    case 'CANCELLED':
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200';
    default:
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
  }
}

function ShipmentCard({ shipment }: { shipment: Shipment }) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black text-slate-900">
              {shipment.order_slug ? `Order ${shipment.order_slug}` : `Shipment #${shipment.id}`}
            </h2>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClasses(shipment.status)}`}>
              {shipment.status || 'PENDING'}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            {shipment.shipping_method_name || 'Shipping method pending'}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xl font-black text-slate-900">
            {formatCurrency(Number(shipment.shipping_fee || 0))}
          </p>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Shipping fee
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            Tracking number
          </p>
          <p className="mt-1 break-all font-semibold text-slate-900">
            {shipment.tracking_number || 'Not assigned yet'}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            Address
          </p>
          <p className="mt-1 font-semibold text-slate-900">
            {shipment.address ? `Address #${shipment.address}` : 'No address attached'}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            Created
          </p>
          <p className="mt-1 font-semibold text-slate-900">{formatDate(shipment.created_at)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            Updated
          </p>
          <p className="mt-1 font-semibold text-slate-900">{formatDate(shipment.updated_at)}</p>
        </div>
      </div>
    </article>
  );
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function loadShipments(isRefresh = false) {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      const data = await shippingApi.shipments();
      setShipments(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setShipments([]);
      setError(getApiErrorMessage(err, 'Failed to load shipments.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadShipments();
  }, []);

  const statuses = useMemo(
    () => Array.from(new Set(shipments.map((item) => item.status).filter(Boolean))),
    [shipments]
  );

  const filteredShipments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return shipments.filter((shipment) => {
      const matchesStatus = !statusFilter || shipment.status === statusFilter;
      const matchesSearch =
        !term ||
        [
          shipment.order_slug,
          shipment.status,
          shipment.tracking_number,
          shipment.shipping_method_name,
          shipment.address,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [shipments, search, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-[#127D61]/10 px-3 py-1 text-sm font-bold text-[#127D61]">
              Delivery
            </p>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Shipments
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Follow shipping status, tracking numbers, delivery method, and fees.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadShipments(true)}
            disabled={refreshing}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-900 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <Truck className="h-5 w-5 text-[#127D61]" />
          <p className="mt-3 text-2xl font-black text-slate-900">{shipments.length}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <PackageCheck className="h-5 w-5 text-[#127D61]" />
          <p className="mt-3 text-2xl font-black text-slate-900">
            {shipments.filter((item) => String(item.status).toUpperCase() === 'DELIVERED').length}
          </p>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Delivered</p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <MapPin className="h-5 w-5 text-[#127D61]" />
          <p className="mt-3 text-2xl font-black text-slate-900">
            {shipments.filter((item) => item.tracking_number).length}
          </p>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">With tracking</p>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <Search size={17} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order, tracking, method..."
              className="h-full w-full bg-transparent text-sm font-medium text-slate-900 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none"
          >
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-[#127D61]" />
          Loading shipments...
        </div>
      ) : error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
          <AlertCircle className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      ) : !filteredShipments.length ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <Truck className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-4 text-xl font-black text-slate-900">No shipments found</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Shipment records appear here after an order is prepared for delivery.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredShipments.map((shipment) => (
            <ShipmentCard key={shipment.id} shipment={shipment} />
          ))}
        </div>
      )}
    </div>
  );
}
