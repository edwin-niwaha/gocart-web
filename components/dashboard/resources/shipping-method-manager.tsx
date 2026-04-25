'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { adminApi, getApiErrorMessage } from '@/lib/api/services';
import type { ShippingMethod, ShippingMethodPayload } from '@/lib/types';
import { showError, showInfo, showSuccess } from '@/lib/toast';
import { cn, formatCurrency } from '@/lib/utils';

type ShippingMethodFormValues = {
  name: string;
  description: string;
  fee: string;
  estimated_days: string;
  is_active: boolean;
};

type ShippingMethodFormErrors = Partial<
  Record<keyof ShippingMethodFormValues, string>
>;

const EMPTY_FORM: ShippingMethodFormValues = {
  name: '',
  description: '',
  fee: '',
  estimated_days: '',
  is_active: true,
};

type FilterValue = 'all' | 'active' | 'inactive';

function formatUpdatedAt(value?: string | null) {
  if (!value) return 'Recently updated';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently updated';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDeliveryWindow(days: number) {
  if (!Number.isFinite(days) || days < 0) {
    return 'Delivery estimate unavailable';
  }

  if (days === 0) {
    return 'Same day delivery';
  }

  if (days === 1) {
    return '1 business day';
  }

  return `${days} business days`;
}

function sortShippingMethods(methods: ShippingMethod[]) {
  return [...methods].sort((left, right) => {
    if (left.is_active !== right.is_active) {
      return Number(right.is_active) - Number(left.is_active);
    }

    const leftDays = Number(left.estimated_days ?? 0);
    const rightDays = Number(right.estimated_days ?? 0);
    if (leftDays !== rightDays) {
      return leftDays - rightDays;
    }

    const leftFee = Number(left.fee ?? 0);
    const rightFee = Number(right.fee ?? 0);
    if (leftFee !== rightFee) {
      return leftFee - rightFee;
    }

    return left.name.localeCompare(right.name);
  });
}

function validateForm(
  values: ShippingMethodFormValues
): ShippingMethodFormErrors {
  const errors: ShippingMethodFormErrors = {};
  const fee = Number(values.fee);
  const estimatedDays = Number(values.estimated_days);

  if (!values.name.trim()) {
    errors.name = 'A shipping method name is required.';
  } else if (values.name.trim().length < 2) {
    errors.name = 'Use at least 2 characters for the name.';
  }

  if (values.fee.trim() === '') {
    errors.fee = 'Enter the delivery fee.';
  } else if (!Number.isFinite(fee) || fee < 0) {
    errors.fee = 'Fee must be a valid number greater than or equal to 0.';
  }

  if (values.estimated_days.trim() === '') {
    errors.estimated_days = 'Enter the estimated delivery days.';
  } else if (!Number.isInteger(estimatedDays) || estimatedDays < 0) {
    errors.estimated_days =
      'Estimated days must be a whole number greater than or equal to 0.';
  }

  return errors;
}

function createPayload(values: ShippingMethodFormValues): ShippingMethodPayload {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    fee: Number(values.fee),
    estimated_days: Number(values.estimated_days),
    is_active: values.is_active,
  };
}

function ShippingMethodSkeleton() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="space-y-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-[24px] border border-slate-200 bg-slate-50 p-5"
          >
            <div className="h-5 w-44 rounded-full bg-slate-200" />
            <div className="mt-3 h-4 w-64 rounded-full bg-slate-200" />
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="h-10 rounded-2xl bg-slate-200" />
              <div className="h-10 rounded-2xl bg-slate-200" />
              <div className="h-10 rounded-2xl bg-slate-200" />
              <div className="h-10 rounded-2xl bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShippingMethodModal({
  open,
  editingMethod,
  form,
  errors,
  saving,
  submitError,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean;
  editingMethod: ShippingMethod | null;
  form: ShippingMethodFormValues;
  errors: ShippingMethodFormErrors;
  saving: boolean;
  submitError: string;
  onClose: () => void;
  onChange: <K extends keyof ShippingMethodFormValues>(
    key: K,
    value: ShippingMethodFormValues[K]
  ) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const titleId = editingMethod
    ? 'edit-shipping-method-title'
    : 'create-shipping-method-title';
  const descriptionId = editingMethod
    ? 'edit-shipping-method-description'
    : 'create-shipping-method-description';
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      nameRef.current?.focus();
    });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, saving]);

  if (!open) return null;

  const title = editingMethod
    ? 'Edit Shipping Method'
    : 'Create Shipping Method';
  const submitLabel = editingMethod
    ? 'Save changes'
    : 'Create shipping method';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[30px] bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-[30px] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-2xl font-black text-slate-900">
              {title}
            </h2>
            <p
              id={descriptionId}
              className="mt-2 max-w-xl text-sm leading-6 text-slate-500"
            >
              Configure how this delivery option appears to customers at checkout.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close shipping method form"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-bold text-slate-900">
                Shipping method name
              </span>
              <input
                ref={nameRef}
                value={form.name}
                onChange={(event) => onChange('name', event.target.value)}
                placeholder="Express delivery"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'shipping-method-name-error' : undefined}
                className={cn(
                  'h-12 w-full rounded-2xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#127D61]',
                  errors.name ? 'border-rose-300 bg-rose-50/60' : 'border-slate-200'
                )}
              />
              {errors.name ? (
                <p
                  id="shipping-method-name-error"
                  className="text-sm font-medium text-rose-600"
                >
                  {errors.name}
                </p>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-900">Fee (UGX)</span>
              <input
                value={form.fee}
                onChange={(event) => onChange('fee', event.target.value)}
                placeholder="5000"
                inputMode="decimal"
                aria-invalid={Boolean(errors.fee)}
                aria-describedby={errors.fee ? 'shipping-method-fee-error' : undefined}
                className={cn(
                  'h-12 w-full rounded-2xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#127D61]',
                  errors.fee ? 'border-rose-300 bg-rose-50/60' : 'border-slate-200'
                )}
              />
              {errors.fee ? (
                <p
                  id="shipping-method-fee-error"
                  className="text-sm font-medium text-rose-600"
                >
                  {errors.fee}
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Example: `5000` for a flat UGX 5,000 delivery fee.
                </p>
              )}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-900">
                Estimated delivery days
              </span>
              <input
                value={form.estimated_days}
                onChange={(event) =>
                  onChange('estimated_days', event.target.value)
                }
                placeholder="2"
                inputMode="numeric"
                aria-invalid={Boolean(errors.estimated_days)}
                aria-describedby={
                  errors.estimated_days ? 'shipping-method-days-error' : undefined
                }
                className={cn(
                  'h-12 w-full rounded-2xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#127D61]',
                  errors.estimated_days
                    ? 'border-rose-300 bg-rose-50/60'
                    : 'border-slate-200'
                )}
              />
              {errors.estimated_days ? (
                <p
                  id="shipping-method-days-error"
                  className="text-sm font-medium text-rose-600"
                >
                  {errors.estimated_days}
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Use `0` for same-day delivery or a whole number of business days.
                </p>
              )}
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-bold text-slate-900">
                Customer-facing description
              </span>
              <textarea
                value={form.description}
                onChange={(event) => onChange('description', event.target.value)}
                placeholder="Fast doorstep delivery in Kampala and nearby areas."
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#127D61]"
              />
              <p className="text-xs text-slate-500">
                Optional. Add helpful guidance customers should see before choosing
                this method.
              </p>
            </label>
          </div>

          <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Available at checkout
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Disable this to hide the method from new customer orders.
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => onChange('is_active', event.target.checked)}
              className="h-4 w-4"
            />
          </label>

          {submitError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {submitError}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#127D61] px-5 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {saving ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ShippingMethodManager() {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterValue>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [form, setForm] = useState<ShippingMethodFormValues>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<ShippingMethodFormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadShippingMethods = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setLoadError('');

    try {
      const data = await adminApi.shippingMethods();
      setShippingMethods(sortShippingMethods(Array.isArray(data) ? data : []));
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        'Failed to load shipping methods.'
      );
      setLoadError(message);

      if (!silent) {
        setShippingMethods([]);
      }
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadShippingMethods();
  }, [loadShippingMethods]);

  const stats = useMemo(() => {
    const activeCount = shippingMethods.filter((item) => item.is_active).length;
    const inactiveCount = shippingMethods.length - activeCount;
    const fastestDays = shippingMethods.length
      ? Math.min(...shippingMethods.map((item) => Number(item.estimated_days ?? 0)))
      : null;
    const averageFee = shippingMethods.length
      ? shippingMethods.reduce((total, item) => total + Number(item.fee ?? 0), 0) /
        shippingMethods.length
      : 0;

    return {
      totalCount: shippingMethods.length,
      activeCount,
      inactiveCount,
      fastestDays,
      averageFee,
    };
  }, [shippingMethods]);

  const filteredShippingMethods = useMemo(() => {
    const query = search.trim().toLowerCase();

    return shippingMethods.filter((item) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && item.is_active) ||
        (filter === 'inactive' && !item.is_active);

      if (!matchesFilter) return false;
      if (!query) return true;

      const haystack = [
        item.name,
        item.description,
        String(item.fee),
        String(item.estimated_days),
        item.is_active ? 'active' : 'inactive',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [filter, search, shippingMethods]);

  function setField<K extends keyof ShippingMethodFormValues>(
    key: K,
    value: ShippingMethodFormValues[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFormErrors((current) => {
      if (!current[key]) return current;

      const next = { ...current };
      delete next[key];
      return next;
    });
    setSubmitError('');
  }

  function openCreateModal() {
    setEditingMethod(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSubmitError('');
    setModalOpen(true);
  }

  function openEditModal(method: ShippingMethod) {
    setEditingMethod(method);
    setForm({
      name: method.name ?? '',
      description: method.description ?? '',
      fee: String(method.fee ?? ''),
      estimated_days: String(method.estimated_days ?? ''),
      is_active: Boolean(method.is_active),
    });
    setFormErrors({});
    setSubmitError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingMethod(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSubmitError('');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateForm(form);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      showInfo('Please fix the highlighted shipping method fields.');
      return;
    }

    const payload = createPayload(form);

    try {
      setSaving(true);
      setSubmitError('');

      if (editingMethod) {
        await adminApi.updateShippingMethod(editingMethod.id, payload);
        showSuccess('Shipping method updated successfully.');
      } else {
        await adminApi.createShippingMethod(payload);
        showSuccess('Shipping method created successfully.');
      }

      await loadShippingMethods({ silent: true });
      closeModal();
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        'Failed to save shipping method.'
      );
      setSubmitError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(
    method: ShippingMethod,
    nextIsActive: boolean
  ) {
    try {
      setTogglingId(method.id);
      await adminApi.updateShippingMethod(method.id, { is_active: nextIsActive });
      await loadShippingMethods({ silent: true });
      showSuccess(
        nextIsActive
          ? 'Shipping method activated.'
          : 'Shipping method hidden from checkout.'
      );
    } catch (error: unknown) {
      showError(
        getApiErrorMessage(error, 'Failed to update shipping method status.')
      );
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(method: ShippingMethod) {
    const confirmed = window.confirm(`Delete "${method.name}"?`);
    if (!confirmed) return;

    try {
      setDeletingId(method.id);
      await adminApi.removeShippingMethod(method.id);
      await loadShippingMethods({ silent: true });
      showSuccess('Shipping method deleted.');
    } catch (error: unknown) {
      showError(
        getApiErrorMessage(error, 'Failed to delete shipping method.')
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleRecordKeyDown(
    event: React.KeyboardEvent<HTMLElement>,
    method: ShippingMethod
  ) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEditModal(method);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[30px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-orange-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-bold text-[#F79420] shadow-sm">
              Checkout Delivery
            </p>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Shipping Methods
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Create and manage the delivery options shoppers can choose during
              checkout.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadShippingMethods({ silent: true })}
              disabled={loading || refreshing}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#127D61] px-5 text-sm font-bold text-white transition hover:opacity-95"
            >
              <Plus size={18} />
              Create Shipping Method
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Total methods</p>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {stats.totalCount}
          </p>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Active at checkout</p>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {stats.activeCount}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
            {stats.inactiveCount} inactive
          </p>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Fastest delivery</p>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {stats.fastestDays == null ? '--' : stats.fastestDays}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {stats.fastestDays == null
              ? 'No shipping methods yet'
              : formatDeliveryWindow(stats.fastestDays)}
          </p>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Average fee</p>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {stats.totalCount ? formatCurrency(stats.averageFee) : '--'}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Across all delivery options
          </p>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search shipping methods..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#127D61]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value as FilterValue)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  filter === option.value
                    ? 'bg-[#127D61] text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loadError ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => loadShippingMethods()}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
            >
              Try again
            </button>
          </div>
        </div>
      ) : null}

      {loading ? <ShippingMethodSkeleton /> : null}

      {!loading && filteredShippingMethods.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Truck size={28} className="text-slate-400" />
          </div>

          <h2 className="mt-4 text-xl font-black text-slate-900">
            {shippingMethods.length
              ? 'No matching shipping methods'
              : 'No shipping methods yet'}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {shippingMethods.length
              ? 'Try a different search term or filter to find the method you want.'
              : 'Create your first delivery option to start offering shipping choices at checkout.'}
          </p>

          {!shippingMethods.length ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 inline-flex rounded-2xl bg-[#127D61] px-5 py-3 text-sm font-bold text-white transition hover:opacity-95"
            >
              Create Shipping Method
            </button>
          ) : null}
        </div>
      ) : null}

      {!loading && filteredShippingMethods.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm lg:block">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Delivery</th>
                  <th className="px-6 py-4">Fee</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Updated</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredShippingMethods.map((method) => {
                  const statusBusy = togglingId === method.id;
                  const deleteBusy = deletingId === method.id;

                  return (
                    <tr
                      key={method.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openEditModal(method)}
                      onKeyDown={(event) => handleRecordKeyDown(event, method)}
                      className="cursor-pointer bg-white transition hover:bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-[#127D61]/30"
                    >
                      <td className="px-6 py-5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#127D61]/10 text-[#127D61]">
                              <Truck size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-900">
                                {method.name}
                              </p>
                              <p className="mt-1 truncate text-sm text-slate-500">
                                {method.description || 'No checkout note added yet.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                        {formatDeliveryWindow(Number(method.estimated_days ?? 0))}
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-slate-900">
                        {formatCurrency(method.fee)}
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide',
                            method.is_active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {method.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500">
                        {formatUpdatedAt(method.updated_at)}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditModal(method);
                            }}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
                          >
                            <Pencil size={15} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleToggleActive(method, !method.is_active);
                            }}
                            disabled={statusBusy}
                            className={cn(
                              'inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60',
                              method.is_active
                                ? 'bg-[#F79420] hover:brightness-95'
                                : 'bg-[#127D61] hover:opacity-95'
                            )}
                          >
                            {statusBusy ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : method.is_active ? (
                              <ShieldCheck size={15} />
                            ) : (
                              <CheckCircle2 size={15} />
                            )}
                            {method.is_active ? 'Hide' : 'Activate'}
                          </button>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(method);
                            }}
                            disabled={deleteBusy}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deleteBusy ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 lg:hidden">
            {filteredShippingMethods.map((method) => {
              const statusBusy = togglingId === method.id;
              const deleteBusy = deletingId === method.id;

              return (
                <div
                  key={method.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openEditModal(method)}
                  onKeyDown={(event) => handleRecordKeyDown(event, method)}
                  className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#127D61]/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#127D61]/10 text-[#127D61]">
                          <Truck size={18} />
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-black text-slate-900">
                            {method.name}
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            {method.description || 'No checkout note added yet.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <span
                      className={cn(
                        'inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide',
                        method.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {method.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Delivery
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {formatDeliveryWindow(Number(method.estimated_days ?? 0))}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Fee
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {formatCurrency(method.fee)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Updated
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {formatUpdatedAt(method.updated_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditModal(method);
                      }}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggleActive(method, !method.is_active);
                      }}
                      disabled={statusBusy}
                      className={cn(
                        'inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60',
                        method.is_active
                          ? 'bg-[#F79420] hover:brightness-95'
                          : 'bg-[#127D61] hover:opacity-95'
                      )}
                    >
                      {statusBusy ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : method.is_active ? (
                        <ShieldCheck size={16} />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      {method.is_active ? 'Hide' : 'Activate'}
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(method);
                      }}
                      disabled={deleteBusy}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deleteBusy ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      <ShippingMethodModal
        open={modalOpen}
        editingMethod={editingMethod}
        form={form}
        errors={formErrors}
        saving={saving}
        submitError={submitError}
        onClose={closeModal}
        onChange={setField}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
