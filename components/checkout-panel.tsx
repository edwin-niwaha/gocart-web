'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Landmark,
  MapPin,
  Package2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
  Wallet,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  addressApi,
  cartApi,
  checkoutApi,
  getApiErrorMessage,
  orderApi,
  paymentApi,
  shippingApi,
} from '@/lib/api/services';
import type { CheckoutSummary } from '@/lib/api/services';
import { notifyCartUpdated } from '@/lib/cart-events';
import { createIdempotencyKey } from '@/lib/security/idempotency';
import type {
  CartItem,
  CustomerAddress,
  CustomerAddressPayload,
  CustomerAddressRegion,
  DeliveryOption,
  PickupStation,
} from '@/lib/types';
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
  area: string;
  street_name: string;
  phone_number: string;
  additional_telephone: string;
  additional_information: string;
  region: CustomerAddressRegion;
  is_default: boolean;
};

type CheckoutAddress = CustomerAddress & {
  label?: string | null;
};

const EMPTY_FORM: AddressFormValues = {
  label: '',
  city: '',
  area: '',
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

const REGION_LABELS = Object.fromEntries(
  REGION_OPTIONS.map((option) => [option.value, option.label])
) as Record<CustomerAddressRegion, string>;

const DELIVERY_UNAVAILABLE_ERROR = 'delivery is not available for this location';

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

const DELIVERY_OPTIONS: ReadonlyArray<{
  label: string;
  subtitle: string;
  value: DeliveryOption;
}> = [
  {
    label: 'Home Delivery',
    subtitle: 'Send your order to your saved address',
    value: 'HOME_DELIVERY',
  },
  {
    label: 'Pickup Station',
    subtitle: 'Collect your order from a nearby pickup point',
    value: 'PICKUP_STATION',
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getRegionLabel = (region?: CustomerAddressRegion | null) => {
  if (!region) return '';
  return REGION_LABELS[region] ?? region;
};

const getAddressSummary = (address?: CheckoutAddress | null) => {
  return [address?.area, address?.city, getRegionLabel(address?.region ?? null)]
    .filter(Boolean)
    .join(' / ');
};

const getFriendlySummaryError = ({
  message,
  deliveryOption,
  hasPickupStations,
}: {
  message: string;
  deliveryOption: DeliveryOption;
  hasPickupStations: boolean;
}) => {
  if (!message.trim()) {
    return '';
  }

  if (
    deliveryOption === 'HOME_DELIVERY' &&
    message.toLowerCase().includes(DELIVERY_UNAVAILABLE_ERROR)
  ) {
    return hasPickupStations
      ? 'Home delivery is not available for this address yet. Switch to pickup or choose another saved address.'
      : 'Home delivery is not available for this address yet. Choose another saved address to continue.';
  }

  return message;
};

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

const formatDeliveryWindow = (days?: number | null) => {
  if (days == null || Number.isNaN(days)) return '';
  if (days <= 0) return 'Same day';
  if (days === 1) return '1 day';
  return `${days} days`;
};

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
      area: form.area.trim(),
      street_name: form.street_name.trim(),
      phone_number: form.phone_number.trim(),
      additional_telephone: form.additional_telephone.trim(),
      additional_information: form.additional_information.trim(),
    });
  };

return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm">
    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div>
          <h3 className="text-base font-black text-gray-900">
            Add delivery address
          </h3>
          <p className="mt-0.5 text-xs font-medium text-gray-500">
            Fill in your delivery details
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-lg font-bold text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="max-h-[72vh] overflow-y-auto px-5 py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="input h-11 rounded-xl text-sm"
            placeholder="Label e.g. Home / Office"
            value={form.label}
            onChange={(e) => setField("label", e.target.value)}
          />

          <input
            className="input h-11 rounded-xl text-sm"
            placeholder="City"
            value={form.city}
            onChange={(e) => setField("city", e.target.value)}
          />

          <input
            className="input h-11 rounded-xl text-sm"
            placeholder="Area / Neighborhood"
            value={form.area}
            onChange={(e) => setField("area", e.target.value)}
          />

          <input
            className="input h-11 rounded-xl text-sm"
            placeholder="Phone number"
            value={form.phone_number}
            onChange={(e) => setField("phone_number", e.target.value)}
          />

          <input
            className="input h-11 rounded-xl text-sm sm:col-span-2"
            placeholder="Street / Building / Apartment"
            value={form.street_name}
            onChange={(e) => setField("street_name", e.target.value)}
          />

          <input
            className="input h-11 rounded-xl text-sm sm:col-span-2"
            placeholder="Additional telephone"
            value={form.additional_telephone}
            onChange={(e) => setField("additional_telephone", e.target.value)}
          />

          <select
            className="select h-11 rounded-xl text-sm sm:col-span-2"
            value={form.region}
            onChange={(e) =>
              setField("region", e.target.value as CustomerAddressRegion)
            }
          >
            {REGION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <textarea
            className="input min-h-[80px] resize-none rounded-xl text-sm sm:col-span-2"
            placeholder="Additional information"
            value={form.additional_information}
            onChange={(e) =>
              setField("additional_information", e.target.value)
            }
          />

          <label className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => setField("is_default", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-semibold text-gray-700">
              Set as default address
            </span>
          </label>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save address"}
        </button>
      </div>
    </div>
  </div>
);
}

export function CheckoutPanel() {
  const router = useRouter();
  const checkoutIdempotencyKeyRef = useRef<string | null>(null);
  const paymentInitiationIdempotencyKeyRef = useRef<string | null>(null);
  const paymentFinalizationIdempotencyKeyRef = useRef<string | null>(null);

  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<CheckoutAddress[]>([]);
  const [pickupStations, setPickupStations] = useState<PickupStation[]>([]);
  const [deliveryOption, setDeliveryOption] =
    useState<DeliveryOption>('HOME_DELIVERY');
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [expandedAddressId, setExpandedAddressId] = useState<number | null>(null);
  const [selectedPickupStationId, setSelectedPickupStationId] = useState<
    number | null
  >(null);
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummary | null>(
    null
  );
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const [paymentProvider, setPaymentProvider] =
    useState<PaymentProvider>('CASH');
  const [paymentMenuOpen, setPaymentMenuOpen] = useState(false);
  const [deliveryMenuOpen, setDeliveryMenuOpen] = useState(false);
  const [addressMenuOpen, setAddressMenuOpen] = useState(false);
  const [pickupStationMenuOpen, setPickupStationMenuOpen] = useState(false);
  const [mtnPhone, setMtnPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  const [loading, setLoading] = useState(false);
  const [pollingPayment, setPollingPayment] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
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
      const [cartData, addressData, pickupStationData] = await Promise.all([
        cartApi.listItems().catch(() => []),
        addressApi.list().catch(() => []),
        shippingApi.pickupStations().catch(() => []),
      ]);

      setItems(cartData);
      setAddresses(addressData);

      const activePickupStations = pickupStationData.filter(
        (station) => station.is_active !== false
      );

      setPickupStations(activePickupStations);
      setSelectedPickupStationId((current) => {
        if (activePickupStations.some((station) => station.id === current)) {
          return current;
        }

        return activePickupStations[0]?.id ?? null;
      });

      if (addressData.length) {
        const defaultAddress =
          addressData.find((item) => item.is_default) ?? addressData[0];
        setSelectedAddressId(defaultAddress?.id ?? null);
        setExpandedAddressId(defaultAddress?.id ?? null);
      } else {
        setSelectedAddressId(null);
        setExpandedAddressId(null);
      }
    } catch {
      setItems([]);
      setAddresses([]);
      setPickupStations([]);
      setSelectedPickupStationId(null);
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
    if (deliveryOption === 'PICKUP_STATION' && !pickupStations.length) {
      setDeliveryOption('HOME_DELIVERY');
    }
  }, [deliveryOption, pickupStations.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest('[data-payment-dropdown]')) {
        setPaymentMenuOpen(false);
      }

      if (!target.closest('[data-delivery-dropdown]')) {
        setDeliveryMenuOpen(false);
      }

      if (!target.closest('[data-address-dropdown]')) {
        setAddressMenuOpen(false);
      }

      if (!target.closest('[data-pickup-station-dropdown]')) {
        setPickupStationMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const lineTotal =
        item.line_total != null
          ? Number(item.line_total)
          : Number((item as any).variant?.price || 0) * item.quantity;
      return sum + lineTotal;
    }, 0);
  }, [items]);

  const cartSignature = useMemo(() => {
    return items
      .map((item) => `${item.id}:${item.quantity}:${item.line_total ?? ''}`)
      .join('|');
  }, [items]);

  const selectedPickupStation = useMemo(() => {
    return (
      pickupStations.find((station) => station.id === selectedPickupStationId) ??
      null
    );
  }, [pickupStations, selectedPickupStationId]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
  }, [items]);

  const selectedAddress = useMemo(() => {
    return addresses.find((item) => item.id === selectedAddressId) ?? null;
  }, [addresses, selectedAddressId]);

  const buildCheckoutRequest = useCallback(
    (options?: { couponCode?: string }) => {
      if (!selectedAddressId) return null;
      if (
        deliveryOption === 'PICKUP_STATION' &&
        !selectedPickupStationId
      ) {
        return null;
      }

      return {
        address_id: selectedAddressId,
        delivery_option: deliveryOption,
        ...(deliveryOption === 'PICKUP_STATION' && selectedPickupStationId
          ? { pickup_station_id: selectedPickupStationId }
          : {}),
        ...(options?.couponCode ? { coupon_code: options.couponCode } : {}),
      };
    },
    [deliveryOption, selectedAddressId, selectedPickupStationId]
  );

  useEffect(() => {
    let cancelled = false;

    if (!items.length) {
      setCheckoutSummary(null);
      setSummaryError('');
      setSummaryLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const request = buildCheckoutRequest({
      couponCode: appliedCouponCode || undefined,
    });

    if (!request) {
      setCheckoutSummary(null);
      setSummaryError('');
      setSummaryLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setSummaryLoading(true);
    setSummaryError('');

    checkoutApi
      .summary(request)
      .then((summary) => {
        if (cancelled) return;
        setCheckoutSummary(summary);
        setSummaryError('');
        if (appliedCouponCode) {
          setCouponError('');
          setCouponCode(summary.coupon_code || appliedCouponCode);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        const message = getApiErrorMessage(
          error,
          'Could not calculate checkout total.'
        );

        if (appliedCouponCode) {
          setCouponError(message);
          setAppliedCouponCode('');
          return;
        }

        setCheckoutSummary(null);
        setSummaryError(message);
      })
      .finally(() => {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    appliedCouponCode,
    buildCheckoutRequest,
    cartSignature,
    items.length,
  ]);

  const shippingFee = useMemo(() => {
    return Number(checkoutSummary?.shipping ?? 0) || 0;
  }, [checkoutSummary]);

  const discountAmount = useMemo(() => {
    return Math.max(0, Number(checkoutSummary?.discount ?? 0) || 0);
  }, [checkoutSummary]);

  const itemsSubtotal = useMemo(() => {
    return Number(checkoutSummary?.items_subtotal ?? subtotal) || 0;
  }, [checkoutSummary, subtotal]);

  const total = useMemo(() => {
    return Number(checkoutSummary?.total ?? subtotal) || 0;
  }, [checkoutSummary, subtotal]);

  const selectedPaymentOption =
    PAYMENT_OPTIONS.find((option) => option.value === paymentProvider) ??
    PAYMENT_OPTIONS[0];
  const selectedDeliveryOption =
    DELIVERY_OPTIONS.find((option) => option.value === deliveryOption) ??
    DELIVERY_OPTIONS[0];
  const addressSectionTitle =
    deliveryOption === 'PICKUP_STATION'
      ? 'Choose contact address'
      : 'Choose address';
  const addressSectionDescription =
    deliveryOption === 'PICKUP_STATION'
      ? 'We will use this saved address and phone number for order updates while you collect from your pickup station.'
      : 'Pick where your order should be delivered.';
  const shippingCostLabel =
    deliveryOption === 'PICKUP_STATION'
      ? 'Pickup at checkout'
      : 'Delivery fee';
  const deliveryEstimateLabel = formatDeliveryWindow(
    checkoutSummary?.estimated_days ?? null
  );
  const selectedAddressLabel =
    selectedAddress?.label || selectedAddress?.city || 'Choose address';
  const selectedAddressMeta = selectedAddress
    ? getAddressSummary(selectedAddress)
    : addressSectionDescription;
  const selectedPickupStationLabel =
    selectedPickupStation?.name || 'Choose pickup station';
  const selectedPickupStationMeta = selectedPickupStation
    ? [selectedPickupStation.area, selectedPickupStation.city]
        .filter(Boolean)
        .join(' / ')
    : 'Select where the customer will collect the order';
  const friendlySummaryError = getFriendlySummaryError({
    message: summaryError,
    deliveryOption,
    hasPickupStations: pickupStations.length > 0,
  });

  const isBusy = loading || pollingPayment;
  const needsPickupStation = deliveryOption === 'PICKUP_STATION';
  const needsCalculatedSummary =
    !!items.length &&
    !!selectedAddressId &&
    (!needsPickupStation || !!selectedPickupStationId);
  const isPlaceOrderDisabled =
    !items.length ||
    !selectedAddressId ||
    (needsPickupStation && !selectedPickupStationId) ||
    summaryLoading ||
    (needsCalculatedSummary && (!checkoutSummary || !!summaryError)) ||
    isBusy;
  const canRecommendPickup =
    deliveryOption === 'HOME_DELIVERY' &&
    !!friendlySummaryError &&
    pickupStations.length > 0;
  const shippingDisplayValue =
    deliveryOption === 'PICKUP_STATION'
      ? 'UGX 0 at checkout'
      : summaryLoading
      ? 'Calculating...'
      : friendlySummaryError
      ? 'Unavailable'
      : formatCurrency(shippingFee);
  const totalDisplayValue =
    summaryLoading
      ? 'Updating...'
      : needsCalculatedSummary && (!checkoutSummary || summaryError)
      ? 'Awaiting delivery'
      : formatCurrency(total);
  const checkoutStatusTitle = !items.length
    ? 'Add items to continue'
    : !selectedAddressId
    ? 'Select a delivery address'
    : summaryLoading
    ? 'Refreshing your checkout total'
    : friendlySummaryError
    ? 'Action needed before checkout'
    : 'Ready to place your order';
  const checkoutStatusMessage = !items.length
    ? 'Your cart is empty right now.'
    : !selectedAddressId
    ? 'Choose or add an address so we can confirm delivery.'
    : summaryLoading
    ? 'We are recalculating delivery and total for your latest selection.'
    : friendlySummaryError
    ? friendlySummaryError
    : paymentProvider === 'MTN'
    ? 'You will confirm the MTN Mobile Money prompt on your phone after tapping Place order.'
    : 'Delivery, address, and payment details are all lined up.';
  const deliveryStatusLabel = summaryLoading
    ? 'Refreshing total'
    : friendlySummaryError
    ? canRecommendPickup
      ? 'Pickup recommended'
      : 'Address not covered'
    : deliveryOption === 'PICKUP_STATION'
    ? 'Pickup ready'
    : checkoutSummary
    ? 'Delivery available'
    : selectedAddressId
    ? 'Waiting for calculation'
    : 'Select an address';

  const getMtnFailureMessage = (statusRes: {
    provider_response?: Record<string, unknown> | null;
    reason?: unknown;
  }): string => {
    const reason =
      (
        statusRes.provider_response as
          | { status_check?: { reason?: unknown } }
          | undefined
      )?.status_check?.reason ||
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
    } catch (error: unknown) {
      setFeedback(
        getApiErrorMessage(
          error,
          'Could not confirm payment status right now.'
        ),
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

      const payload: CustomerAddressPayload = {
        city: values.city,
        area: values.area || undefined,
        street_name: values.street_name,
        phone_number: values.phone_number || undefined,
        additional_telephone: values.additional_telephone || undefined,
        additional_information: values.additional_information || undefined,
        region: values.region,
        is_default: values.is_default,
      };

      const created = await addressApi.create(payload);

      if (created?.id) {
        setSelectedAddressId(Number(created.id));
        setExpandedAddressId(Number(created.id));
      }

      setAddressModalVisible(false);
      setFeedback('Address saved successfully.', 'success');
      await loadCheckoutData();
    } catch (error: unknown) {
      setFeedback(
        getApiErrorMessage(error, 'Failed to save address. Please try again.'),
        'error'
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const makeDefaultAddress = async () => {
    if (!selectedAddress) return;

    try {
      await addressApi.update(selectedAddress.id, { is_default: true });
      setFeedback('Default address updated successfully.', 'success');
      await loadCheckoutData();
    } catch (error: unknown) {
      setFeedback(
        getApiErrorMessage(error, 'Failed to update address. Please try again.'),
        'error'
      );
    }
  };

  const handleApplyCoupon = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const code = couponCode.trim().toUpperCase();
    setCouponError('');

    if (!code) {
      setCouponError('Enter a coupon code.');
      return;
    }

    if (!items.length || subtotal <= 0) {
      setCouponError('Add items before applying a coupon.');
      return;
    }

    const request = buildCheckoutRequest({ couponCode: code });

    if (!request) {
      setCouponError(
        deliveryOption === 'PICKUP_STATION'
          ? 'Choose a contact address and pickup station before applying a coupon.'
          : 'Choose a delivery address before applying a coupon.'
      );
      return;
    }

    try {
      setApplyingCoupon(true);
      const summary = await checkoutApi.validate(request);

      setCheckoutSummary(summary);
      setAppliedCouponCode(summary.coupon_code || code);
      setCouponCode(summary.coupon_code || code);
      setSummaryError('');
      setFeedback('Coupon applied successfully.', 'success');
    } catch (error: unknown) {
      setCouponError(
        getApiErrorMessage(error, 'Coupon could not be applied.')
      );
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCouponCode('');
    setCouponCode('');
    setCouponError('');
  };

  const handleCashCheckout = useCallback(async () => {
    if (!selectedAddressId) {
      setFeedback('Please select a delivery address.', 'info');
      return;
    }

    const idempotencyKey =
      checkoutIdempotencyKeyRef.current ?? createIdempotencyKey('checkout');
    checkoutIdempotencyKeyRef.current = idempotencyKey;

    const checkoutRequest = buildCheckoutRequest({
      couponCode: appliedCouponCode || undefined,
    });

    if (!checkoutRequest?.address_id) {
      setFeedback('Please select a delivery address.', 'info');
      return;
    }

    const response = await orderApi.checkout(
      {
        ...checkoutRequest,
        payment_method: 'CASH',
      },
      { idempotencyKey }
    );

    const order = response?.order ?? response;

    notifyCartUpdated();
    await loadCheckoutData();

    setFeedback(`Order ${order.slug} placed successfully.`, 'success');
    router.push('/account/orders');
  }, [
    appliedCouponCode,
    buildCheckoutRequest,
    loadCheckoutData,
    router,
    selectedAddressId,
  ]);

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

    const paymentIdempotencyKey =
      paymentInitiationIdempotencyKeyRef.current ??
      createIdempotencyKey('payment-initiate');
    paymentInitiationIdempotencyKeyRef.current = paymentIdempotencyKey;

    const checkoutRequest = buildCheckoutRequest({
      couponCode: appliedCouponCode || undefined,
    });

    if (!checkoutRequest?.address_id) {
      setFeedback('Please select a delivery address.', 'info');
      return;
    }

    const payment = await paymentApi.initiateMTN(
      {
        ...checkoutRequest,
        phone_number: normalizedPhone,
      },
      { idempotencyKey: paymentIdempotencyKey }
    );

    setFeedback('Approve the MTN Mobile Money prompt on your phone.', 'info');

    const paid = await pollPaymentStatus(payment.reference);
    if (!paid) return;

    const finalizationIdempotencyKey =
      paymentFinalizationIdempotencyKeyRef.current ??
      createIdempotencyKey('payment-finalize');
    paymentFinalizationIdempotencyKeyRef.current = finalizationIdempotencyKey;

    const result = await paymentApi.finalizeOrder(payment.reference, {
      idempotencyKey: finalizationIdempotencyKey,
    });

    notifyCartUpdated();
    await loadCheckoutData();

    setFeedback(`Order ${result.order.slug} placed successfully.`, 'success');
    router.push('/account/orders');
  }, [
    appliedCouponCode,
    buildCheckoutRequest,
    loadCheckoutData,
    mtnPhone,
    pollPaymentStatus,
    router,
    selectedAddressId,
  ]);

  const onPlaceOrder = async () => {
    if (isBusy) return;

    if (!items.length) {
      setFeedback('Add items before checking out.', 'info');
      return;
    }

    if (!selectedAddressId) {
      setFeedback(
        deliveryOption === 'PICKUP_STATION'
          ? 'Please select or add a contact address before placing your order.'
          : 'Please select or add a delivery address before placing your order.',
        'info'
      );
      return;
    }

    if (needsPickupStation && !selectedPickupStationId) {
      setFeedback('Please choose a pickup station.', 'info');
      return;
    }

    if (summaryLoading) {
      setFeedback('Calculating your checkout total. Please wait a moment.', 'info');
      return;
    }

    if (needsCalculatedSummary && (!checkoutSummary || summaryError)) {
      setFeedback(
        friendlySummaryError ||
          'We could not calculate the delivery fee for this order.',
        'error'
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
    } catch (error: unknown) {
      setFeedback(
        getApiErrorMessage(error, 'Checkout failed. Please try again.'),
        'error'
      );
    } finally {
      checkoutIdempotencyKeyRef.current = null;
      paymentInitiationIdempotencyKeyRef.current = null;
      paymentFinalizationIdempotencyKeyRef.current = null;
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

  const getDeliveryIcon = (option: DeliveryOption) => {
    if (option === 'HOME_DELIVERY') {
      return <Truck className="h-5 w-5" />;
    }

    return <Landmark className="h-5 w-5" />;
  };

  return (
    <>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#fffdf8_100%)]">
        <section className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(236,253,245,0.95),rgba(255,247,237,0.92))] p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.38)] sm:p-6">
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-orange-200/35 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-emerald-200/35 blur-3xl" />

                <div className="relative">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      </div>

                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700 shadow-sm">
                          <Sparkles className="h-3.5 w-3.5" />
                          Checkout
                        </div>
                        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                          Finish in one clear pass
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                          Review delivery coverage, confirm the best address,
                          and place the order with a checkout that stays clear
                          even when a location needs pickup instead.
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                            <Package2 className="h-4 w-4 text-emerald-600" />
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                            <Truck className="h-4 w-4 text-emerald-600" />
                            {selectedDeliveryOption.label}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                            <MapPin className="h-4 w-4 text-emerald-600" />
                            <span className="max-w-[190px] truncate">
                              {deliveryOption === 'PICKUP_STATION'
                                ? selectedPickupStationLabel
                                : selectedAddressLabel}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAddressModalVisible(true)}
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/70 bg-white/90 px-4 text-sm font-bold text-slate-700 transition hover:bg-white"
                    >
                      + Add new address
                    </button>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-4 shadow-sm">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                        Fulfillment
                      </p>
                      <p className="mt-2 text-base font-black text-slate-900">
                        {deliveryOption === 'PICKUP_STATION'
                          ? 'Pickup selected'
                          : friendlySummaryError
                          ? 'Needs a fallback'
                          : deliveryEstimateLabel
                          ? `Arrives in ${deliveryEstimateLabel.toLowerCase()}`
                          : 'Ready to price'}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {deliveryOption === 'PICKUP_STATION'
                          ? selectedPickupStationMeta || 'Pickup station pending'
                          : friendlySummaryError || selectedAddressMeta || 'Select an address to continue.'}
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-4 shadow-sm">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                        Address
                      </p>
                      <p className="mt-2 text-base font-black text-slate-900">
                        {selectedAddressLabel}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {selectedAddressMeta || 'Choose where this order should go.'}
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-4 shadow-sm">
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                        Total
                      </p>
                      <p className="mt-2 text-base font-black text-slate-900">
                        {totalDisplayValue}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {appliedCouponCode
                          ? `${appliedCouponCode} is applied to this order.`
                          : 'Subtotal, discounts, and delivery stay in sync as you edit checkout.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Delivery option
                  </p>
                  <h2 className="mt-1 text-lg font-extrabold text-gray-900 sm:text-xl">
                    Choose delivery method
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Select home delivery or pickup station without leaving this checkout.
                  </p>
                </div>

                <div className="relative" data-delivery-dropdown>
                  <button
                    type="button"
                    onClick={() => setDeliveryMenuOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-gray-300"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                        {getDeliveryIcon(deliveryOption)}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Selected option
                        </p>
                        <p className="truncate text-sm font-extrabold text-gray-900">
                          {selectedDeliveryOption.label}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {selectedDeliveryOption.subtitle}
                        </p>
                      </div>
                    </div>

                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-gray-500 transition ${
                        deliveryMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {deliveryMenuOpen ? (
                    <div className="absolute z-30 mt-3 w-full rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl">
                      <div className="space-y-2">
                        {DELIVERY_OPTIONS.map((option) => {
                          const selected = option.value === deliveryOption;
                          const disabled =
                            option.value === 'PICKUP_STATION' && !pickupStations.length;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                if (disabled) {
                                  setFeedback(
                                    'Pickup stations are not available for this store yet.',
                                    'info'
                                  );
                                  return;
                                }

                                setDeliveryOption(option.value);
                                setDeliveryMenuOpen(false);
                              }}
                              className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                                selected
                                  ? 'border-emerald-600 bg-emerald-50'
                                  : 'border-gray-200 bg-white hover:bg-gray-50'
                              } ${disabled ? 'opacity-60' : ''}`}
                            >
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                  selected
                                    ? 'bg-white text-emerald-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {getDeliveryIcon(option.value)}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-extrabold text-gray-900">
                                    {option.label}
                                  </p>

                                  {disabled ? (
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                      Unavailable
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
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Delivery address
                    </p>
                    <h2 className="mt-1 text-lg font-extrabold text-gray-900 sm:text-xl">
                      {addressSectionTitle}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {addressSectionDescription}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAddressModalVisible(true)}
                    className="shrink-0 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                  >
                    + Add
                  </button>
                </div>

                {!addresses.length ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                    {deliveryOption === 'PICKUP_STATION'
                      ? 'No address yet. Add a contact address to continue.'
                      : 'No address yet. Add a delivery address to continue.'}
                  </div>
                ) : (
                  <div className="relative" data-address-dropdown>
                    <button
                      type="button"
                      onClick={() => setAddressMenuOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-gray-300"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                          <MapPin className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Selected address
                          </p>
                          <p className="truncate text-sm font-extrabold text-gray-900">
                            {selectedAddressLabel}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {selectedAddressMeta || addressSectionDescription}
                          </p>
                        </div>
                      </div>

                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-gray-500 transition ${
                          addressMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {addressMenuOpen ? (
                      <div className="absolute z-30 mt-3 max-h-[320px] w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl">
                        <div className="space-y-2">
                          {addresses.map((item) => {
                            const selected = item.id === selectedAddressId;

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setSelectedAddressId(item.id);
                                  setExpandedAddressId(item.id);
                                  setAddressMenuOpen(false);
                                }}
                                className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                                  selected
                                    ? 'border-emerald-600 bg-emerald-50'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                }`}
                              >
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                    selected
                                      ? 'bg-white text-emerald-700'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  <MapPin className="h-5 w-5" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-extrabold text-gray-900">
                                      {item.label || item.city}
                                    </p>

                                    {item.is_default ? (
                                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                        Default
                                      </span>
                                    ) : null}

                                    {selected ? (
                                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                        Selected
                                      </span>
                                    ) : null}
                                  </div>

                                  <p className="mt-1 truncate text-xs text-gray-500">
                                    {getAddressSummary(item)}
                                  </p>

                                  {item.street_name ? (
                                    <p className="mt-1 truncate text-xs text-gray-500">
                                      {item.street_name}
                                    </p>
                                  ) : null}

                                  {item.phone_number ? (
                                    <p className="mt-1 text-xs font-semibold text-gray-500">
                                      Phone: {item.phone_number}
                                    </p>
                                  ) : null}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {!!selectedAddress && !selectedAddress.is_default ? (
                      <button
                        type="button"
                        onClick={makeDefaultAddress}
                        className="mt-3 inline-flex h-10 items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                      >
                        Make selected address default
                      </button>
                    ) : null}
                  </div>
                )}
              </div>

              {deliveryOption === 'HOME_DELIVERY' && friendlySummaryError ? (
                <div className="rounded-3xl border border-amber-200 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(255,247,237,0.98))] p-4 shadow-sm sm:p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                        <Truck className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                          Delivery recommendation
                        </p>
                        <h2 className="mt-1 text-lg font-extrabold text-slate-900">
                          Home delivery needs a supported address
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                          {friendlySummaryError}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                            Selected address: {selectedAddressLabel}
                          </span>
                          {canRecommendPickup ? (
                            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                              Pickup stations are available right now
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {canRecommendPickup ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryOption('PICKUP_STATION');
                          setFeedback(
                            'Switched to pickup. Choose your station to continue.',
                            'info'
                          );
                        }}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700"
                      >
                        Use pickup instead
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {deliveryOption === 'PICKUP_STATION' ? (
                <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Pickup station
                    </p>
                    <h2 className="mt-1 text-lg font-extrabold text-gray-900 sm:text-xl">
                      Choose pickup point
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Select where you will collect the order.
                    </p>
                  </div>

                  {!pickupStations.length ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                      No pickup stations are configured yet.
                    </div>
                  ) : (
                    <div className="relative" data-pickup-station-dropdown>
                      <button
                        type="button"
                        onClick={() => setPickupStationMenuOpen((prev) => !prev)}
                        className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-gray-300"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                            <Landmark className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Selected station
                            </p>
                            <p className="truncate text-sm font-extrabold text-gray-900">
                              {selectedPickupStationLabel}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {selectedPickupStationMeta}
                            </p>
                          </div>
                        </div>

                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-gray-500 transition ${
                            pickupStationMenuOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {pickupStationMenuOpen ? (
                        <div className="absolute z-30 mt-3 max-h-[320px] w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl">
                          <div className="space-y-2">
                            {pickupStations.map((station) => {
                              const selected = station.id === selectedPickupStationId;

                              return (
                                <button
                                  key={station.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedPickupStationId(station.id);
                                    setPickupStationMenuOpen(false);
                                  }}
                                  className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                                    selected
                                      ? 'border-emerald-600 bg-emerald-50'
                                      : 'border-gray-200 bg-white hover:bg-gray-50'
                                  }`}
                                >
                                  <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                      selected
                                        ? 'bg-white text-emerald-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    <Landmark className="h-5 w-5" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-sm font-extrabold text-gray-900">
                                        {station.name}
                                      </p>

                                      {selected ? (
                                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                          Selected
                                        </span>
                                      ) : null}
                                    </div>

                                    <p className="mt-1 text-xs text-gray-500">
                                      {[station.area, station.city]
                                        .filter(Boolean)
                                        .join(' / ')}
                                    </p>

                                    <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                                      {station.address}
                                    </p>

                                    {station.opening_hours ? (
                                      <p className="mt-1 text-xs font-semibold text-gray-500">
                                        Hours: {station.opening_hours}
                                      </p>
                                    ) : null}
                                  </div>

                                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-700">
                                    UGX 0
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}

              <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Delivery intelligence
                  </p>
                  <h2 className="mt-1 text-lg font-extrabold text-gray-900 sm:text-xl">
                    Coverage, fee, and next step
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Checkout recalculates delivery as you change address or fulfillment.
                  </p>
                </div>

                <div
                  className={`rounded-[1.6rem] border px-4 py-4 ${
                    friendlySummaryError
                      ? 'border-amber-200 bg-[linear-gradient(135deg,rgba(255,251,235,0.96),rgba(255,247,237,0.98))]'
                      : 'border-emerald-100 bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(255,255,255,0.96))]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {deliveryOption === 'PICKUP_STATION'
                            ? 'Pickup fee'
                            : 'Calculated delivery fee'}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                            friendlySummaryError
                              ? 'bg-white text-amber-700'
                              : 'bg-white text-emerald-700'
                          }`}
                        >
                          {deliveryStatusLabel}
                        </span>
                      </div>

                      <p className="mt-2 text-xl font-black text-gray-900">
                        {shippingDisplayValue}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {deliveryOption === 'PICKUP_STATION'
                          ? 'Pickup keeps fulfillment free at checkout.'
                          : selectedAddress
                          ? selectedAddressMeta
                          : 'Choose an address to calculate delivery.'}
                      </p>

                      {summaryLoading ? (
                        <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-600">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                          Calculating delivery coverage...
                        </div>
                      ) : null}

                      {!summaryLoading && friendlySummaryError ? (
                        <p className="mt-2 text-sm font-semibold text-amber-700">
                          {friendlySummaryError}
                        </p>
                      ) : null}

                      {!summaryLoading &&
                      !friendlySummaryError &&
                      deliveryOption === 'HOME_DELIVERY' &&
                      deliveryEstimateLabel ? (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Estimated delivery: {deliveryEstimateLabel}
                        </p>
                      ) : null}

                      {!summaryLoading && canRecommendPickup ? (
                        <button
                          type="button"
                          onClick={() => {
                            setDeliveryOption('PICKUP_STATION');
                            setFeedback(
                              'Switched to pickup. Choose your station to continue.',
                              'info'
                            );
                          }}
                          className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          Switch to pickup
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                      <Truck className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Payment method
                  </p>
                  <h2 className="mt-1 text-lg font-extrabold text-gray-900 sm:text-xl">
                    Choose how you want to pay
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Select your preferred payment option to complete this order.
                  </p>
                </div>

                <div className="relative" data-payment-dropdown>
                  <button
                    type="button"
                    onClick={() => setPaymentMenuOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-gray-300"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
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
                    <div className="absolute z-20 mt-3 w-full rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl">
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
                              className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                                selected
                                  ? 'border-emerald-600 bg-emerald-50'
                                  : 'border-gray-200 bg-white hover:bg-gray-50'
                              } ${option.disabled ? 'opacity-60' : ''}`}
                            >
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
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
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
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
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-[0_26px_70px_-38px_rgba(15,23,42,0.42)] backdrop-blur sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Review
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-gray-900">
                  Order summary
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Confirm your items and total before placing the order.
                </p>

                <div
                  className={`mt-4 rounded-[1.5rem] border px-4 py-3 ${
                    friendlySummaryError
                      ? 'border-amber-200 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(255,247,237,0.98))]'
                      : 'border-emerald-100 bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(255,255,255,0.96))]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white ${
                        friendlySummaryError ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Checkout status
                      </p>
                      <p className="mt-1 text-base font-black text-slate-900">
                        {checkoutStatusTitle}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {checkoutStatusMessage}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 max-h-[280px] space-y-3 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const itemTotal =
                      item.line_total ?? Number((item as any).variant?.price || 0) * item.quantity;

                    const title = getItemTitle(item);
                    const variantLabel = getVariantLabel(item);

                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-gray-200 bg-gray-50 p-3"
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

                <form
                  onSubmit={handleApplyCoupon}
                  className="mt-4 border-t border-gray-200 pt-4"
                >
                  <label
                    htmlFor="coupon-code"
                    className="text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Coupon
                  </label>

                  <div className="mt-2 flex gap-2">
                    <input
                      id="coupon-code"
                      className="min-w-0 flex-1 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
                      value={couponCode}
                      onChange={(event) => {
                        setCouponCode(event.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      placeholder="Enter code"
                      disabled={applyingCoupon || Boolean(appliedCouponCode)}
                    />

                    {appliedCouponCode ? (
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={applyingCoupon || !items.length}
                        className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {applyingCoupon ? 'Applying...' : 'Apply'}
                      </button>
                    )}
                  </div>

                  {appliedCouponCode ? (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      {appliedCouponCode} applied. You saved{' '}
                      {formatCurrency(discountAmount)}.
                    </p>
                  ) : null}

                  {couponError ? (
                    <p className="mt-2 text-xs font-semibold text-red-600">
                      {couponError}
                    </p>
                  ) : null}
                </form>

                <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Items</span>
                    <span className="font-bold text-gray-900">{itemCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Delivery option</span>
                    <span className="font-bold text-gray-900">
                      {selectedDeliveryOption.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {deliveryOption === 'PICKUP_STATION'
                        ? 'Pickup station'
                        : 'Delivery address'}
                    </span>
                    <span className="max-w-[180px] truncate text-right font-bold text-gray-900">
                      {deliveryOption === 'PICKUP_STATION'
                        ? selectedPickupStation?.name || 'Not selected'
                        : selectedAddress?.label ||
                          selectedAddress?.city ||
                          'Not selected'}
                    </span>
                  </div>

                  {deliveryOption === 'PICKUP_STATION' ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Contact address</span>
                      <span className="max-w-[180px] truncate text-right font-bold text-gray-900">
                        {selectedAddress?.label ||
                          selectedAddress?.city ||
                          'Not selected'}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Payment</span>
                    <span className="font-bold text-gray-900">
                      {getPaymentLabel(paymentProvider)}
                    </span>
                  </div>

                  {deliveryOption === 'HOME_DELIVERY' && deliveryEstimateLabel ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Estimated delivery</span>
                      <span className="font-bold text-gray-900">
                        {deliveryEstimateLabel}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(itemsSubtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="font-bold text-emerald-700">
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{shippingCostLabel}</span>
                    <span className="font-bold text-gray-900">
                      {shippingDisplayValue}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <span className="text-sm font-semibold text-gray-500">
                      Total
                    </span>
                    <span className="text-2xl font-extrabold text-gray-900">
                      {totalDisplayValue}
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
                  className="mt-4 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
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
