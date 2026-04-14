'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  addressApi,
  cartApi,
  orderApi,
  paymentApi,
} from '@/lib/api/services';
import type { Address, CartItem } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

type PaymentProvider = 'CASH' | 'MTN' | 'AIRTEL';

type AddressFormValues = {
  label: string;
  city: string;
  street_name: string;
  phone_number: string;
  additional_telephone: string;
  additional_information: string;
  region: string;
  is_default: boolean;
};

const EMPTY_FORM: AddressFormValues = {
  label: '',
  city: '',
  street_name: '',
  phone_number: '',
  additional_telephone: '',
  additional_information: '',
  region: 'kampala_area',
  is_default: false,
};

const REGION_OPTIONS = [
  { label: 'Kampala Area', value: 'kampala_area' },
  { label: 'Entebbe Area', value: 'entebbe_area' },
  { label: 'Central Region', value: 'central_region' },
  { label: 'Eastern Region', value: 'eastern_region' },
  { label: 'Northern Region', value: 'northern_region' },
  { label: 'Western Region', value: 'western_region' },
  { label: 'Rest of Kampala', value: 'rest_of_kampala' },
] as const;

const PAYMENT_OPTIONS: ReadonlyArray<{
  label: string;
  subtitle: string;
  value: PaymentProvider;
  disabled?: boolean;
}> = [
  {
    label: 'Pay on Delivery',
    subtitle: 'Cash or Mobile Money on arrival',
    value: 'CASH',
  },
  {
    label: 'MTN Mobile Money',
    subtitle: 'Pay instantly with MTN MoMo',
    value: 'MTN',
  },
  {
    label: 'Airtel Money',
    subtitle: 'Coming soon',
    value: 'AIRTEL',
    disabled: true,
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeUgPhone = (value: string) => {
  const raw = value.trim().replace(/[^\d+]/g, '');

  if (!raw) return '';
  if (raw.startsWith('+256')) return raw;
  if (raw.startsWith('256')) return `+${raw}`;
  if (raw.startsWith('0')) return `+256${raw.slice(1)}`;

  return raw;
};

const isValidUgPhone = (value: string) => /^\+2567\d{8}$/.test(value);

function AddressModal({
  open,
  loading,
  initialValues,
  onClose,
  onSubmit,
}: {
  open: boolean;
  loading: boolean;
  initialValues: AddressFormValues;
  onClose: () => void;
  onSubmit: (values: AddressFormValues) => void;
}) {
  const [form, setForm] = useState<AddressFormValues>(initialValues);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  if (!open) return null;

  const setField = <K extends keyof AddressFormValues>(
    key: K,
    value: AddressFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = () => {
    if (!form.street_name.trim()) return;
    if (!form.city.trim()) return;

    if (
      form.phone_number.trim() &&
      form.additional_telephone.trim() &&
      form.phone_number.trim() === form.additional_telephone.trim()
    ) {
      return;
    }

    onSubmit({
      ...form,
      label: form.label.trim(),
      city: form.city.trim(),
      street_name: form.street_name.trim(),
      phone_number: form.phone_number.trim(),
      additional_telephone: form.additional_telephone.trim(),
      additional_information: form.additional_information.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-[1.5rem] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-black">Add delivery address</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border px-3 py-1 text-sm font-bold"
            disabled={loading}
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="input"
            placeholder="Label e.g. Home / Office"
            value={form.label}
            onChange={(e) => setField('label', e.target.value)}
          />
          <input
            className="input"
            placeholder="City"
            value={form.city}
            onChange={(e) => setField('city', e.target.value)}
          />
          <input
            className="input md:col-span-2"
            placeholder="Street Name / Building Number / Apartment"
            value={form.street_name}
            onChange={(e) => setField('street_name', e.target.value)}
          />
          <input
            className="input"
            placeholder="Phone number"
            value={form.phone_number}
            onChange={(e) => setField('phone_number', e.target.value)}
          />
          <input
            className="input"
            placeholder="Additional telephone"
            value={form.additional_telephone}
            onChange={(e) => setField('additional_telephone', e.target.value)}
          />
          <textarea
            className="input min-h-[110px] md:col-span-2"
            placeholder="Additional information"
            value={form.additional_information}
            onChange={(e) => setField('additional_information', e.target.value)}
          />
          <select
            className="select md:col-span-2"
            value={form.region}
            onChange={(e) => setField('region', e.target.value)}
          >
            {REGION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-3 md:col-span-2">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setField('is_default', e.target.checked)}
            />
            <span className="text-sm font-semibold">Set as default</span>
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-2xl border px-4 py-3 font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="flex-1 rounded-2xl bg-[var(--brand-green)] px-4 py-3 font-bold text-white disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save address'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CheckoutPanel() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [expandedAddressId, setExpandedAddressId] = useState<number | null>(null);

  const [paymentProvider, setPaymentProvider] =
    useState<PaymentProvider>('CASH');
  const [mtnPhone, setMtnPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [pollingPayment, setPollingPayment] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error' | 'info'>(
    'info'
  );

  const setFeedback = (
    text: string,
    tone: 'success' | 'error' | 'info' = 'info'
  ) => {
    setMessage(text);
    setMessageTone(tone);
  };

  const loadCheckoutData = useCallback(async () => {
    try {
      const [cartData, addressData] = await Promise.all([
        cartApi.listItems().catch(() => []),
        addressApi.list().catch(() => []),
      ]);

      setItems(cartData);
      setAddresses(addressData);

      if (addressData.length) {
        const defaultAddress =
          addressData.find((item: any) => item.is_default) ?? addressData[0];
        setSelectedAddressId(defaultAddress?.id ?? null);
        setExpandedAddressId(defaultAddress?.id ?? null);
      } else {
        setSelectedAddressId(null);
        setExpandedAddressId(null);
      }
    } catch {
      setItems([]);
      setAddresses([]);
    }
  }, []);

  useEffect(() => {
    loadCheckoutData().catch(() => undefined);
  }, [loadCheckoutData]);

  useEffect(() => {
    if (paymentProvider !== 'MTN' && mtnPhone) {
      setMtnPhone('');
    }
  }, [paymentProvider, mtnPhone]);

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const lineTotal =
        item.line_total != null
          ? Number(item.line_total)
          : Number(item.variant?.price || 0) * item.quantity;
      return sum + lineTotal;
    }, 0);
  }, [items]);

  const selectedAddress = useMemo(() => {
    return addresses.find((item) => item.id === selectedAddressId) ?? null;
  }, [addresses, selectedAddressId]);

  const isBusy = loading || pollingPayment;
  const isPlaceOrderDisabled = !items.length || !selectedAddressId || isBusy;

  const getMtnFailureMessage = (statusRes: any): string => {
    const reason =
      statusRes?.provider_response?.status_check?.reason ||
      statusRes?.reason ||
      '';

    const normalized = String(reason).toUpperCase();

    switch (normalized) {
      case 'LOW_BALANCE_OR_PAYEE_LIMIT_REACHED_OR_NOT_ALLOWED':
        return 'Payment failed. Your MTN line may not have enough balance, transaction limits may be reached, or the account is not allowed for this payment.';
      case 'REJECTED':
        return 'Payment was declined on your phone. Please try again.';
      case 'EXPIRED':
        return 'Payment request expired. Please try again.';
      case 'NOT_ALLOWED':
        return 'This MTN number is not allowed to make this payment.';
      default:
        return 'Payment failed. Please try again or use a different payment method.';
    }
  };

  const pollPaymentStatus = useCallback(async (reference: string) => {
    const maxAttempts = 15;
    const intervalMs = 4000;

    setPollingPayment(true);

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        await delay(intervalMs);

        const statusRes = await paymentApi.checkStatus(reference);
        const paymentStatus = String(statusRes?.status || '').toUpperCase();

        if (paymentStatus === 'PAID') {
          setFeedback('Payment successful.', 'success');
          return true;
        }

        if (paymentStatus === 'FAILED') {
          setFeedback(getMtnFailureMessage(statusRes), 'error');
          return false;
        }

        if (paymentStatus === 'CANCELLED') {
          setFeedback('You cancelled the payment on your phone.', 'error');
          return false;
        }

        if (attempt === 5 || attempt === 10) {
          setFeedback('Still waiting for MTN payment approval...', 'info');
        }
      }

      setFeedback(
        'Payment is still processing. Please confirm later from your payment status or orders.',
        'info'
      );
      return false;
    } catch (error: any) {
      setFeedback(
        error?.response?.data?.detail ||
          error?.message ||
          'Could not confirm payment status right now.',
        'error'
      );
      return false;
    } finally {
      setPollingPayment(false);
    }
  }, []);

  const submitNewAddress = async (values: AddressFormValues) => {
    try {
      setSavingAddress(true);

      const payload = {
        label: values.label || values.city,
        city: values.city,
        street_name: values.street_name,
        phone_number: values.phone_number,
        additional_telephone: values.additional_telephone,
        additional_information: values.additional_information,
        region: values.region,
        is_default: values.is_default,
      };

      const created = await addressApi.create(payload as any);

      if (created?.id) {
        setSelectedAddressId(Number(created.id));
        setExpandedAddressId(Number(created.id));
      }

      setAddressModalVisible(false);
      setFeedback('Address saved successfully.', 'success');
      await loadCheckoutData();
    } catch (error: any) {
      setFeedback(
        error?.response?.data?.detail ||
          error?.message ||
          'Failed to save address. Please try again.',
        'error'
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const makeDefaultAddress = async () => {
    if (!selectedAddress) return;

    try {
      await addressApi.update(selectedAddress.id, { is_default: true } as any);
      setFeedback('Default address updated successfully.', 'success');
      await loadCheckoutData();
    } catch (error: any) {
      setFeedback(
        error?.response?.data?.detail ||
          error?.message ||
          'Failed to update address. Please try again.',
        'error'
      );
    }
  };

  const handleCashCheckout = useCallback(async () => {
    if (!selectedAddressId) {
      setFeedback('Please select a delivery address.', 'info');
      return;
    }

    const order = await orderApi.checkout({
      address_id: selectedAddressId,
    });

    try {
      await paymentApi.create({
        order: order.id,
        provider: 'CASH',
        amount: total,
        currency: 'UGX',
      } as any);
    } catch (paymentError: any) {
      setFeedback(
        paymentError?.response?.data?.detail ||
          paymentError?.message ||
          'Order placed but payment record could not be saved.',
        'error'
      );
    }

    setFeedback(`Order ${order.slug} placed successfully.`, 'success');
    await loadCheckoutData();
    router.push('/orders');
  }, [loadCheckoutData, router, selectedAddressId, total]);

  const handleMTNCheckout = useCallback(async () => {
    if (!selectedAddressId) {
      setFeedback('Please select a delivery address.', 'info');
      return;
    }

    const normalizedPhone = normalizeUgPhone(mtnPhone);

    if (!normalizedPhone) {
      setFeedback('Enter your MTN phone number.', 'info');
      return;
    }

    if (!isValidUgPhone(normalizedPhone)) {
      setFeedback(
        'Enter a valid Uganda number like 078XXXXXXX or +25678XXXXXXX.',
        'error'
      );
      return;
    }

    const payment = await paymentApi.initiateMTN({
      address_id: selectedAddressId,
      phone_number: normalizedPhone,
    });

    setFeedback('Approve the MTN Mobile Money prompt on your phone.', 'info');

    const paid = await pollPaymentStatus(payment.reference);
    if (!paid) return;

    const result = await paymentApi.finalizeOrder(payment.reference);

    setFeedback(`Order ${result.order.slug} placed successfully.`, 'success');
    await loadCheckoutData();
    router.push('/orders');
  }, [loadCheckoutData, mtnPhone, pollPaymentStatus, router, selectedAddressId]);

  const onPlaceOrder = async () => {
    if (isBusy) return;

    if (!items.length) {
      setFeedback('Add items before checking out.', 'info');
      return;
    }

    if (!selectedAddressId) {
      setFeedback(
        'Please select or add a delivery address before placing your order.',
        'info'
      );
      return;
    }

    if (paymentProvider === 'AIRTEL') {
      setFeedback('Airtel Money is not enabled yet.', 'info');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      if (paymentProvider === 'CASH') {
        await handleCashCheckout();
        return;
      }

      if (paymentProvider === 'MTN') {
        await handleMTNCheckout();
        return;
      }

      setFeedback('Unsupported payment method.', 'error');
    } catch (error: any) {
      setFeedback(
        error?.response?.data?.detail ||
          error?.message ||
          'Checkout failed. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-5">
        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="badge">Delivery address</p>
              <h2 className="mt-2 text-2xl font-black">Choose address</h2>
            </div>

            <button
              type="button"
              onClick={() => setAddressModalVisible(true)}
              className="rounded-2xl border px-4 py-2 text-sm font-bold"
            >
              + Add new
            </button>
          </div>

          {!addresses.length ? (
            <div className="rounded-2xl border border-dashed p-5 text-sm text-slate-500">
              No address yet. Add a delivery address to continue with checkout.
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((item: any) => {
                const selected = item.id === selectedAddressId;
                const expanded = item.id === expandedAddressId;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 ${
                      selected
                        ? 'border-[var(--brand-green)] bg-emerald-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedAddressId(item.id)}
                        className="flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-extrabold text-slate-900">
                            {item.label || item.city}
                          </p>
                          {item.is_default ? (
                            <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-[var(--brand-green)]">
                              Default
                            </span>
                          ) : null}
                          {selected ? (
                            <span className="rounded-full bg-[var(--brand-green)] px-2 py-1 text-[11px] font-bold text-white">
                              Selected
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.city}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedAddressId((prev) =>
                            prev === item.id ? null : item.id
                          )
                        }
                        className="rounded-full border px-3 py-1 text-sm font-bold"
                      >
                        {expanded ? '-' : '+'}
                      </button>
                    </div>

                    {expanded ? (
                      <div className="mt-3 space-y-1 text-sm text-slate-600">
                        {item.street_name ? <p>{item.street_name}</p> : null}
                        {item.region ? <p>{item.region}</p> : null}
                        {item.phone_number ? <p>Phone: {item.phone_number}</p> : null}
                        {item.additional_telephone ? (
                          <p>Alt: {item.additional_telephone}</p>
                        ) : null}
                        {item.additional_information ? (
                          <p>{item.additional_information}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {!!selectedAddress && !selectedAddress.is_default && (
                <button
                  type="button"
                  onClick={makeDefaultAddress}
                  className="rounded-2xl border px-4 py-3 text-sm font-bold"
                >
                  Make selected address default
                </button>
              )}
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <div>
            <p className="badge">Payment method</p>
            <h2 className="mt-2 text-2xl font-black">Choose how to pay</h2>
          </div>

          <div className="space-y-3">
            {PAYMENT_OPTIONS.map((option) => {
              const selected = paymentProvider === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    if (option.disabled) {
                      setFeedback('Airtel Money is coming soon.', 'info');
                      return;
                    }
                    setPaymentProvider(option.value);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left ${
                    selected
                      ? 'border-[var(--brand-green)] bg-emerald-50'
                      : 'border-slate-200 bg-white'
                  } ${option.disabled ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className={`font-extrabold ${
                          selected ? 'text-[var(--brand-green)]' : 'text-slate-900'
                        }`}
                      >
                        {option.label}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {option.subtitle}
                      </p>
                    </div>
                    <div
                      className={`mt-1 h-5 w-5 rounded-full border-2 ${
                        selected
                          ? 'border-[var(--brand-green)] bg-[var(--brand-green)]'
                          : 'border-slate-300'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {paymentProvider === 'MTN' ? (
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800">
                MTN phone number
              </label>
              <input
                className="input"
                placeholder="078XXXXXXX or +25678XXXXXXX"
                value={mtnPhone}
                onChange={(e) => setMtnPhone(e.target.value)}
                disabled={isBusy}
              />
              <p className="text-xs text-slate-500">
                Use the number that will receive and approve the MTN prompt.
              </p>
            </div>
          ) : null}
        </div>

        <div className="card space-y-4">
          <div>
            <p className="badge">Order summary</p>
            <h2 className="mt-2 text-2xl font-black">Review items</h2>
          </div>

          <div className="space-y-3 text-sm">
            {items.map((item) => {
              const itemTotal =
                item.line_total ?? Number(item.variant?.price || 0) * item.quantity;

              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-100 p-3"
                >
                  <div>
                    <p className="font-bold">{item.product.title}</p>
                    <p className="subtle">
                      Qty {item.quantity}
                      {item.variant?.name ? ` • ${item.variant.name}` : ''}
                    </p>
                  </div>
                  <p className="font-bold">{formatCurrency(itemTotal)}</p>
                </div>
              );
            })}

            {!items.length ? (
              <p className="subtle">Your cart is empty.</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
            <span className="font-semibold">Total</span>
            <span className="text-2xl font-black">{formatCurrency(total)}</span>
          </div>

          {message ? (
            <p
              className={`text-sm font-medium ${
                messageTone === 'success'
                  ? 'text-emerald-700'
                  : messageTone === 'error'
                  ? 'text-red-600'
                  : 'text-slate-600'
              }`}
            >
              {message}
            </p>
          ) : null}

          <button
            onClick={onPlaceOrder}
            disabled={isPlaceOrderDisabled}
            className="btn btn-accent w-full disabled:opacity-60"
          >
            {loading
              ? paymentProvider === 'MTN'
                ? 'Starting payment...'
                : 'Placing order...'
              : pollingPayment
              ? 'Waiting for payment approval...'
              : 'Place order'}
          </button>
        </div>
      </div>

      <AddressModal
        open={addressModalVisible}
        loading={savingAddress}
        initialValues={EMPTY_FORM}
        onClose={() => setAddressModalVisible(false)}
        onSubmit={submitNewAddress}
      />
    </>
  );
}