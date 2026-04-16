'use client';

import { FormEvent, useMemo, useState } from 'react';
import { supportApi } from '@/lib/api/services';
import { useTenant } from '@/app/providers/TenantProvider';

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

export default function SupportPage() {
  const { settings } = useTenant() || {};

  const [form, setForm] = useState<SupportFormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const hasChat = Boolean(settings?.support_chat_url);

  const trimmedName = form.name.trim();
  const trimmedEmail = form.email.trim();
  const trimmedMessage = form.message.trim();

  const isValid = useMemo(() => {
    return Boolean(trimmedName && trimmedEmail && trimmedMessage);
  }, [trimmedName, trimmedEmail, trimmedMessage]);

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

  try {
    setLoading(true);

    const response = await supportApi.create({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
    });

    setSuccessMessage(response?.detail || 'Your message has been sent successfully.');
    setForm(initialState);
  } catch (err: any) {
    setErrorMessage(
      err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'We could not send your message right now. Please try again.'
    );
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Support
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Need help with your order, account, or a product question? Send us a
          message and our team will get back to you.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Send a message</h2>
            <p className="text-sm text-slate-500">
              Fill in the form below and we will respond as soon as possible.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="support-name"
                className="text-sm font-semibold text-slate-800"
              >
                Name
              </label>
              <input
                id="support-name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                placeholder="Enter your name"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={loading}
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="support-email"
                className="text-sm font-semibold text-slate-800"
              >
                Email address
              </label>
              <input
                id="support-email"
                type="email"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="support-message"
                className="text-sm font-semibold text-slate-800"
              >
                Message
              </label>
              <textarea
                id="support-message"
                className="min-h-40 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                placeholder="Tell us how we can help"
                value={form.message}
                onChange={(e) => handleChange('message', e.target.value)}
                disabled={loading}
              />
            </div>

            {(successMessage || errorMessage) && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  successMessage
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {successMessage || errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isValid}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send message'}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Support details</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              For faster assistance, include your order details or a short
              description of the issue in your message.
            </p>
          </div>

          {hasChat && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Live support</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Prefer live chat? Open our support channel for a quicker
                conversation.
              </p>

              <a
                href={settings!.support_chat_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Open support chat
              </a>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}