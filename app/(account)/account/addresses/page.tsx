'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';

import { addressApi, getApiErrorMessage } from '@/lib/api/services';
import type { CustomerAddress, CustomerAddressPayload } from '@/lib/types';
import { showError, showInfo, showSuccess } from '@/lib/toast';

type CustomerAddressRegion =
  | 'kampala_area'
  | 'entebbe_area'
  | 'central_region'
  | 'eastern_region'
  | 'northern_region'
  | 'western_region'
  | 'rest_of_kampala';

const REGION_OPTIONS: ReadonlyArray<{
  label: string;
  value: CustomerAddressRegion;
}> = [
  { label: 'Kampala Area', value: 'kampala_area' },
  { label: 'Entebbe Area', value: 'entebbe_area' },
  { label: 'Central Region', value: 'central_region' },
  { label: 'Eastern Region', value: 'eastern_region' },
  { label: 'Northern Region', value: 'northern_region' },
  { label: 'Western Region', value: 'western_region' },
  { label: 'Rest of Kampala', value: 'rest_of_kampala' },
];

type AddressFormValues = {
  street_name: string;
  city: string;
  phone_number: string;
  additional_telephone: string;
  additional_information: string;
  region: CustomerAddressRegion;
  is_default: boolean;
};

const EMPTY_FORM: AddressFormValues = {
  street_name: '',
  city: '',
  phone_number: '',
  additional_telephone: '',
  additional_information: '',
  region: 'kampala_area',
  is_default: false,
};

function getRegionLabel(region?: string) {
  return (
    REGION_OPTIONS.find((option) => option.value === region)?.label ||
    region ||
    'Region'
  );
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [defaultingId, setDefaultingId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [form, setForm] = useState<AddressFormValues>(EMPTY_FORM);

  useEffect(() => {
    loadAddresses();
  }, []);

  async function loadAddresses() {
    try {
      setLoading(true);
      const data = await addressApi.list();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setAddresses([]);
      showError(getApiErrorMessage(error, 'Failed to load addresses.'));
    } finally {
      setLoading(false);
    }
  }

  const sortedAddresses = useMemo(() => {
    return [...addresses].sort((a, b) => Number(b.is_default) - Number(a.is_default));
  }, [addresses]);

  function setField<K extends keyof AddressFormValues>(
    key: K,
    value: AddressFormValues[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(address: CustomerAddress) {
    setEditing(address);
    setForm({
      street_name: address.street_name ?? '',
      city: address.city ?? '',
      phone_number: address.phone_number ?? '',
      additional_telephone: address.additional_telephone ?? '',
      additional_information: address.additional_information ?? '',
      region: (address.region ?? 'kampala_area') as CustomerAddressRegion,
      is_default: Boolean(address.is_default),
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function toggleExpand(id: number) {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const streetName = form.street_name.trim();
    const city = form.city.trim();
    const phoneNumber = form.phone_number.trim();
    const additionalTelephone = form.additional_telephone.trim();
    const additionalInformation = form.additional_information.trim();

    if (!streetName) {
      showInfo('Street name / building / apartment is required.');
      return;
    }

    if (!city) {
      showInfo('City is required.');
      return;
    }

    if (phoneNumber && additionalTelephone && phoneNumber === additionalTelephone) {
      showInfo('Additional telephone must be different from phone number.');
      return;
    }

    const payload: CustomerAddressPayload = {
      street_name: streetName,
      city,
      phone_number: phoneNumber,
      additional_telephone: additionalTelephone,
      additional_information: additionalInformation,
      region: form.region,
      is_default: form.is_default,
    };

    try {
      setSaving(true);

      if (editing) {
        const updated = await addressApi.update(editing.id, payload);

        setAddresses((prev) =>
          prev.map((item) => (item.id === editing.id ? updated : item))
        );

        showSuccess('Address updated successfully.');
      } else {
        const created = await addressApi.create(payload);

        setAddresses((prev) => [created, ...prev]);
        showSuccess('Address added successfully.');
      }

      if (payload.is_default) {
        await loadAddresses();
      }

      closeModal();
    } catch (error: any) {
      showError(getApiErrorMessage(error, 'Failed to save address.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(address: CustomerAddress) {
    const confirmed = window.confirm(
      `Delete address in ${address.city || 'this location'}?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(address.id);
      await addressApi.remove(address.id);
      setAddresses((prev) => prev.filter((item) => item.id !== address.id));
      showSuccess('Address deleted successfully.');
    } catch (error: any) {
      showError(getApiErrorMessage(error, 'Failed to delete address.'));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleMakeDefault(address: CustomerAddress) {
    try {
      setDefaultingId(address.id);
      await addressApi.update(address.id, { is_default: true } as CustomerAddressPayload);
      await loadAddresses();
      showSuccess('Default address updated.');
    } catch (error: any) {
      showError(getApiErrorMessage(error, 'Failed to set default address.'));
    } finally {
      setDefaultingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-[#127D61]/10 px-3 py-1 text-sm font-bold text-[#127D61]">
              Address Book
            </p>

            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              My Addresses
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Save and manage delivery locations for faster checkout.
            </p>
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#127D61] px-5 text-sm font-bold text-white transition hover:opacity-95"
          >
            <Plus size={18} />
            Add Address
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-[24px] border border-slate-200 bg-slate-50 p-5"
              >
                <div className="h-5 w-40 rounded-full bg-slate-200" />
                <div className="mt-3 h-4 w-64 rounded-full bg-slate-200" />
                <div className="mt-2 h-4 w-32 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!loading && !sortedAddresses.length ? (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <MapPin size={28} className="text-slate-400" />
          </div>

          <h2 className="mt-4 text-xl font-black text-slate-900">
            No addresses yet
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Add a delivery address to make checkout faster.
          </p>

          <button
            type="button"
            onClick={openAdd}
            className="mt-5 inline-flex rounded-2xl bg-[#127D61] px-5 py-3 text-sm font-bold text-white transition hover:opacity-95"
          >
            Add Address
          </button>
        </div>
      ) : null}

      {!loading && !!sortedAddresses.length ? (
        <div className="space-y-4">
          {sortedAddresses.map((address) => {
            const expanded = expandedIds.includes(address.id);
            const previewLine = [address.street_name, address.city]
              .filter(Boolean)
              .join(', ');

            return (
              <div
                key={address.id}
                className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900">
                        {address.city || 'Address'}
                      </h2>

                      {address.is_default ? (
                        <span className="inline-flex rounded-full bg-[#127D61]/10 px-3 py-1 text-xs font-extrabold text-[#127D61]">
                          Default
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      {previewLine || 'No address summary'}
                    </p>

                    {!expanded ? (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {getRegionLabel(address.region)}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpand(address.id)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
                  >
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {expanded ? (
                  <>
                    <div className="my-4 h-px bg-slate-200" />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                          Street
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {address.street_name || '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                          City
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {address.city || '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                          Region
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {getRegionLabel(address.region)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                          Phone
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                          <Phone size={14} />
                          {address.phone_number || '-'}
                        </p>
                      </div>

                      {!!address.additional_telephone && (
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                            Alternative phone
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {address.additional_telephone}
                          </p>
                        </div>
                      )}

                      {!!address.additional_information && (
                        <div className="sm:col-span-2">
                          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                            Additional info
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-700">
                            {address.additional_information}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {!address.is_default ? (
                        <button
                          type="button"
                          onClick={() => handleMakeDefault(address)}
                          disabled={defaultingId === address.id}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          {defaultingId === address.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Star size={16} />
                          )}
                          Make default
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => openEdit(address)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
                      >
                        <Pencil size={16} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(address)}
                        disabled={deletingId === address.id}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
                      >
                        {deletingId === address.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                        Delete
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:max-w-3xl sm:rounded-[28px] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {editing ? 'Update Address' : 'Add Address'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Save delivery details for faster checkout.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  value={form.street_name}
                  onChange={(e) => setField('street_name', e.target.value)}
                  placeholder="Street Name / Building Number / Apartment"
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:col-span-2"
                />

                <input
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  placeholder="City"
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />

                <input
                  value={form.phone_number}
                  onChange={(e) => setField('phone_number', e.target.value)}
                  placeholder="Phone number"
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />

                <input
                  value={form.additional_telephone}
                  onChange={(e) => setField('additional_telephone', e.target.value)}
                  placeholder="Additional telephone"
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:col-span-2"
                />
              </div>

              <div>
                <p className="mb-3 text-sm font-bold text-slate-900">Region</p>
                <div className="flex flex-wrap gap-2">
                  {REGION_OPTIONS.map((option) => {
                    const selected = form.region === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setField('region', option.value)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          selected
                            ? 'border-[#127D61] bg-[#127D61]/10 text-[#127D61]'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <textarea
                value={form.additional_information}
                onChange={(e) => setField('additional_information', e.target.value)}
                placeholder="Additional information"
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />

              <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-sm font-semibold text-slate-800">
                  Set as default
                </span>
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setField('is_default', e.target.checked)}
                  className="h-4 w-4"
                />
              </label>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#127D61] px-4 text-sm font-bold text-white transition hover:opacity-95 disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {saving ? 'Saving...' : editing ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
