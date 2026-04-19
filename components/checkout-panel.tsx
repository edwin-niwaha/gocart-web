'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  CreditCard,
  Landmark,
  ShieldCheck,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  addressApi,
  cartApi,
  orderApi,
  paymentApi,
} from '@/lib/api/services';
import { notifyCartUpdated } from '@/lib/cart-events';
import type { Address, CartItem } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

type PaymentProvider =
  | 'CASH'
  | 'STRIPE'
  | 'PAYSTACK'
  | 'FLUTTERWAVE'
  | 'MTN'
  | 'AIRTEL';

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
    label: 'Cash on Delivery',
    subtitle: 'Pay when your order arrives',
    value: 'CASH',
  },
  {
    label: 'MTN Mobile Money',
    subtitle: 'Pay instantly with MTN MoMo',
    value: 'MTN',
  },
  {
    label: 'Airtel Money',
    subtitle: 'Pay instantly with Airtel Money',
    value: 'AIRTEL',
    disabled: true,
  },
  {
    label: 'Stripe',
    subtitle: 'Cards and international payments',
    value: 'STRIPE',
    disabled: true,
  },
  {
    label: 'Paystack',
    subtitle: 'Cards, bank and wallet payments',
    value: 'PAYSTACK',
    disabled: true,
  },
  {
    label: 'Flutterwave',
    subtitle: 'Cards, bank transfer and more',
    value: 'FLUTTERWAVE',
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

const isValidUgPhone = (value: string) => /^\+256\d{9}$/.test(value);

const isValidMtnUgPhone = (value: string) =>
  /^\+256(76|77|78|79)\d{7}$/.test(value);

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
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-black text-gray-900">Add delivery address</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 px-3 py-1 text-sm font-bold text-gray-700"
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
            <span className="text-sm font-semibold text-gray-700">Set as default</span>
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 font-bold text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 font-bold text-white disabled:opacity-60"
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
  const [paymentMenuOpen, setPaymentMenuOpen] = useState(false);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-payment-dropdown]')) {
        setPaymentMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      const lineTotal =
        item.line_total != null
          ? Number(item.line_total)
          : Number((item as any).variant?.price || 0) * item.quantity;
      return sum + lineTotal;
    }, 0);
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
  }, [items]);

  const selectedAddress = useMemo(() => {
    return addresses.find((item) => item.id === selectedAddressId) ?? null;
  }, [addresses, selectedAddressId]);

  const selectedPaymentOption =
    PAYMENT_OPTIONS.find((option) => option.value === paymentProvider) ??
    PAYMENT_OPTIONS[0];

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

    const response = await orderApi.checkout({
      address_id: selectedAddressId,
      payment_method: 'CASH',
    });

    const order = response?.order ?? response;

    notifyCartUpdated();
    await loadCheckoutData();

    setFeedback(`Order ${order.slug} placed successfully.`, 'success');
    router.push('/account/orders');
  }, [loadCheckoutData, router, selectedAddressId]);

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

    if (!isValidMtnUgPhone(normalizedPhone)) {
      setFeedback('Please enter a valid MTN Mobile Money number.', 'error');
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

    notifyCartUpdated();
    await loadCheckoutData();

    setFeedback(`Order ${result.order.slug} placed successfully.`, 'success');
    router.push('/account/orders');
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

    if (
      paymentProvider === 'STRIPE' ||
      paymentProvider === 'PAYSTACK' ||
      paymentProvider === 'FLUTTERWAVE'
    ) {
      setFeedback(`${paymentProvider} is not enabled yet.`, 'info');
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

  const getItemTitle = (item: CartItem) => {
    return (
      (item as any).product?.title ??
      (item as any).product_variant?.product?.title ??
      (item as any).variant?.product?.title ??
      'Cart item'
    );
  };

  const getVariantLabel = (item: CartItem) => {
    return (
      (item as any).product_variant?.name ??
      (item as any).variant?.name ??
      (item as any).product_variant?.sku ??
      (item as any).variant?.sku ??
      ''
    );
  };

  const getPaymentLabel = (provider: PaymentProvider) => {
    switch (provider) {
      case 'CASH':
        return 'Cash on Delivery';
      case 'MTN':
        return 'MTN Mobile Money';
      case 'AIRTEL':
        return 'Airtel Money';
      case 'STRIPE':
        return 'Stripe';
      case 'PAYSTACK':
        return 'Paystack';
      case 'FLUTTERWAVE':
        return 'Flutterwave';
      default:
        return provider;
    }
  };

  const getPaymentIcon = (provider: PaymentProvider) => {
    switch (provider) {
      case 'CASH':
        return <Wallet className="h-5 w-5" />;
      case 'MTN':
        return <Smartphone className="h-5 w-5" />;
      case 'AIRTEL':
        return <Smartphone className="h-5 w-5" />;
      case 'STRIPE':
        return <CreditCard className="h-5 w-5" />;
      case 'PAYSTACK':
        return <Landmark className="h-5 w-5" />;
      case 'FLUTTERWAVE':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  return (
    <>
      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
                      <ShieldCheck className="h-6 w-6 text-emerald-600" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Checkout
                      </p>
                      <h1 className="mt-1 text-2xl font-extrabold text-gray-900">
                        Complete your order
                      </h1>
                      <p className="mt-2 max-w-2xl text-sm text-gray-500">
                        Select your delivery details, choose a payment method, and
                        review your order before placing it.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAddressModalVisible(true)}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                  >
                    + Add new address
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Delivery
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold text-gray-900">
                    Choose address
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Pick where your order should be delivered.
                  </p>
                </div>

                {!addresses.length ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
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
                          className={`rounded-3xl border p-4 transition ${
                            selected
                              ? 'border-emerald-600 bg-emerald-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedAddressId(item.id)}
                              className="flex-1 text-left"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-extrabold text-gray-900">
                                  {item.label || item.city}
                                </p>

                                {item.is_default ? (
                                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                    Default
                                  </span>
                                ) : null}

                                {selected ? (
                                  <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white">
                                    Selected
                                  </span>
                                ) : null}
                              </div>

                              <p className="mt-1 text-sm text-gray-500">{item.city}</p>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedAddressId((prev) =>
                                  prev === item.id ? null : item.id
                                )
                              }
                              className="rounded-full border border-gray-200 px-3 py-1 text-sm font-bold text-gray-700"
                            >
                              {expanded ? 'Hide' : 'View'}
                            </button>
                          </div>

                          {expanded ? (
                            <div className="mt-3 space-y-1 border-t border-gray-200 pt-3 text-sm text-gray-600">
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
                        className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                      >
                        Make selected address default
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Payment method
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-gray-900">
                    Choose how you want to pay
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Select your preferred payment option to complete this order.
                  </p>
                </div>

                <div className="relative" data-payment-dropdown>
                  <button
                    type="button"
                    onClick={() => setPaymentMenuOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-3xl border border-gray-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-gray-300"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                        {getPaymentIcon(paymentProvider)}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Selected payment
                        </p>
                        <p className="truncate text-sm font-extrabold text-gray-900">
                          {selectedPaymentOption.label}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {selectedPaymentOption.subtitle}
                        </p>
                      </div>
                    </div>

                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-gray-500 transition ${
                        paymentMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {paymentMenuOpen ? (
                    <div className="absolute z-20 mt-3 w-full rounded-3xl border border-gray-200 bg-white p-3 shadow-2xl">
                      <div className="space-y-2">
                        {PAYMENT_OPTIONS.map((option) => {
                          const selected = paymentProvider === option.value;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                if (option.disabled) {
                                  setFeedback(`${option.label} is coming soon.`, 'info');
                                  return;
                                }

                                setPaymentProvider(option.value);
                                setPaymentMenuOpen(false);
                              }}
                              className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                                selected
                                  ? 'border-emerald-600 bg-emerald-50'
                                  : 'border-gray-200 bg-white hover:bg-gray-50'
                              } ${option.disabled ? 'opacity-60' : ''}`}
                            >
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                                  selected
                                    ? 'bg-white text-emerald-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {getPaymentIcon(option.value)}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p
                                    className={`text-sm font-extrabold ${
                                      selected ? 'text-emerald-700' : 'text-gray-900'
                                    }`}
                                  >
                                    {option.label}
                                  </p>

                                  {option.disabled ? (
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                      Coming soon
                                    </span>
                                  ) : null}

                                  {selected ? (
                                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                      Selected
                                    </span>
                                  ) : null}
                                </div>

                                <p className="mt-1 text-xs text-gray-500">
                                  {option.subtitle}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                {paymentProvider === 'MTN' ? (
                  <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                    <label className="text-sm font-bold text-gray-800">
                      MTN Mobile Money number
                    </label>
                    <input
                      className="input mt-2"
                      placeholder="e.g. 0772123456 or +256772123456"
                      value={mtnPhone}
                      onChange={(e) => setMtnPhone(e.target.value)}
                      disabled={isBusy}
                    />
                    <p className="mt-2 text-xs text-amber-700">
                      This must be an MTN number that can receive and approve the payment prompt.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Review
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-gray-900">
                  Order summary
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Confirm your items and total before placing the order.
                </p>

                <div className="mt-5 space-y-4">
                  {items.map((item) => {
                    const itemTotal =
                      item.line_total ?? Number((item as any).variant?.price || 0) * item.quantity;

                    const title = getItemTitle(item);
                    const variantLabel = getVariantLabel(item);

                    return (
                      <div
                        key={item.id}
                        className="rounded-3xl border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-extrabold text-gray-900">
                              {title}
                            </p>

                            {variantLabel ? (
                              <p className="mt-1 text-xs text-gray-500">
                                {variantLabel}
                              </p>
                            ) : null}

                            <p className="mt-1 text-xs font-medium text-gray-500">
                              Qty {item.quantity}
                            </p>
                          </div>

                          <p className="whitespace-nowrap text-sm font-bold text-gray-900">
                            {formatCurrency(itemTotal)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {!items.length ? (
                    <p className="text-sm text-gray-500">Your cart is empty.</p>
                  ) : null}
                </div>

                <div className="mt-5 space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Items</span>
                    <span className="font-bold text-gray-900">{itemCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Delivery address</span>
                    <span className="max-w-[180px] truncate text-right font-bold text-gray-900">
                      {selectedAddress?.label || selectedAddress?.city || 'Not selected'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Payment</span>
                    <span className="font-bold text-gray-900">
                      {getPaymentLabel(paymentProvider)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-500">Total</span>
                    <span className="text-2xl font-extrabold text-gray-900">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {message ? (
                  <div
                    className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${
                      messageTone === 'success'
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                        : messageTone === 'error'
                        ? 'border border-red-200 bg-red-50 text-red-600'
                        : 'border border-gray-200 bg-gray-50 text-gray-600'
                    }`}
                  >
                    {message}
                  </div>
                ) : null}

                <button
                  onClick={onPlaceOrder}
                  disabled={isPlaceOrderDisabled}
                  className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {(loading || pollingPayment) && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}

                  <span>
                    {loading
                      ? paymentProvider === 'MTN'
                        ? 'Starting payment...'
                        : 'Placing order...'
                      : pollingPayment
                      ? 'Waiting for payment approval...'
                      : 'Place order'}
                  </span>
                </button>
              </div>
            </aside>
          </div>
        </section>
      </main>

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