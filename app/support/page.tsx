'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Headphones,
  Loader2,
  Mail,
  MessageCircleMore,
  Package,
  ShieldCheck,
  User,
} from 'lucide-react';
import { getApiErrorMessage, supportApi } from '@/lib/api/services';
import { canUseStorefrontShopping } from '@/lib/auth/roles';
import { useTenant } from '@/app/providers/TenantProvider';
import { CustomerSessionRequired } from '@/components/storefront/customer-session-required';
import { useAuthStore } from '@/lib/stores/auth-store';

type SupportFormState = {
  name: string;
  email: string;
  message: string;
};

const initialState: SupportFormState = {
  name: '',
  email: '',
  message: '',
};

const supportHighlights = [
  {
    icon: Package,
    title: 'Order details',
    description:
      'Add your order number, delivery area, or item name when the issue is tied to a purchase.',
  },
  {
    icon: User,
    title: 'Account help',
    description:
      'Mention the account email or username involved so the team can trace the request faster.',
  },
  {
    icon: Mail,
    title: 'Clear follow-up',
    description:
      'Use the best email address for replies and include the key problem in one short summary.',
  },
] as const;

export default function SupportPage() {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const { settings } = useTenant() || {};
  const canShop = canUseStorefrontShopping(user);

  const [form, setForm] = useState<SupportFormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const hasChat = Boolean(settings?.support_chat_url);
  const suggestedName = useMemo(() => {
    const fullName = [user?.first_name, user?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || user?.username || '';
  }, [user?.first_name, user?.last_name, user?.username]);
  const suggestedEmail = user?.email?.trim() || '';

  const trimmedName = form.name.trim();
  const trimmedEmail = form.email.trim();
  const trimmedMessage = form.message.trim();

  const isValid = useMemo(() => {
    return Boolean(
      trimmedName &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) &&
        trimmedMessage.length >= 10
    );
  }, [trimmedName, trimmedEmail, trimmedMessage]);

  useEffect(() => {
    setForm((prev) => ({
      name: prev.name || suggestedName,
      email: prev.email || suggestedEmail,
      message: prev.message,
    }));
  }, [suggestedEmail, suggestedName]);

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Support
                </p>
                <h1 className="mt-1 text-2xl font-extrabold text-gray-900">
                  Customer support
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  Loading support options...
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!canShop) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <CustomerSessionRequired
            title="Support is only available in a customer shopping session."
            description="Management accounts use the dashboard support inbox, while storefront support stays in the customer flow."
          />
        </section>
      </main>
    );
  }

  const handleChange = (field: keyof SupportFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (successMessage) {
      setSuccessMessage('');
    }

    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSuccessMessage('');
    setErrorMessage('');

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setErrorMessage('Please complete all fields before sending your message.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (trimmedMessage.length < 10) {
      setErrorMessage('Please include at least 10 characters in your message.');
      return;
    }

    try {
      setLoading(true);

      const response = await supportApi.create({
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
      });

      setSuccessMessage(
        response?.detail || 'Your message has been sent successfully.'
      );
      setForm({
        name: suggestedName,
        email: suggestedEmail,
        message: '',
      });
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          'We could not send your message right now. Please try again.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Support
                </p>
                <h1 className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-3xl">
                  Customer support
                </h1>
                <p className="mt-2 text-sm text-gray-500 sm:text-base">
                  Need help with an order, account, delivery, or product
                  question? Send a message and the store team will follow up.
                </p>
              </div>

              <div className="inline-flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
                  {hasChat ? (
                    <MessageCircleMore className="h-5 w-5" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-extrabold">
                    {hasChat ? 'Live help available' : 'Customer help desk'}
                  </p>
                  <p className="text-xs font-medium text-emerald-600">
                    {hasChat
                      ? 'Email and chat support for active shoppers'
                      : 'Message the store team directly from here'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
          <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Headphones className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Message support
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-gray-900">
                  Send a message
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Share the issue clearly and include any order or product
                  details that will help the team respond faster.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-800">Name</span>
                <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-4">
                  <User className="h-4 w-4 text-gray-400" />
                  <input
                    id="support-name"
                    className="w-full bg-transparent px-3 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    placeholder="Enter your name"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-800">
                  Email address
                </span>
                <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-4">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <input
                    id="support-email"
                    type="email"
                    className="w-full bg-transparent px-3 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-semibold text-gray-800">
                  Message
                </span>
                <textarea
                  id="support-message"
                  className="min-h-48 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500"
                  placeholder="Tell us what happened, what order or item is involved, and what help you need."
                  value={form.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  Include order details, product name, or delivery notes when
                  they are relevant.
                </p>
              </label>
            </div>

            {(successMessage || errorMessage) && (
              <div
                aria-live="polite"
                className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  successMessage
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {successMessage || errorMessage}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                We will reply using the email address in this form.
              </p>

              <button
                type="submit"
                disabled={loading || !isValid}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <span>{loading ? 'Sending...' : 'Send message'}</span>
              </button>
            </div>
          </form>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Before you send
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-gray-900">
                Help the team respond faster
              </h2>

              <div className="mt-5 space-y-4">
                {supportHighlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700">
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-gray-900">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-gray-500">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Support details
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-gray-900">
                Message review
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Support requests are reviewed and answered through the store
                team&apos;s support inbox.
              </p>
            </div>

            {hasChat ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700">
                    <MessageCircleMore className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Live support
                    </p>
                    <h2 className="mt-1 text-xl font-extrabold text-gray-900">
                      Open chat
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-emerald-800">
                      Prefer a faster conversation? Open the store&apos;s live
                      support channel.
                    </p>
                  </div>
                </div>

                <a
                  href={settings!.support_chat_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex min-h-[46px] w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Open support chat
                </a>
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  );
}
