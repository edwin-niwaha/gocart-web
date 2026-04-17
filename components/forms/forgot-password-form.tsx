'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/services';

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSuccess('');
    setError('');

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail) {
        throw new Error('Please enter your email address.');
      }

      await authApi.forgotPassword(normalizedEmail);

      setSuccess('If the email exists, a reset code has been sent.');

      router.push(
        `/auth/reset-password?email=${encodeURIComponent(normalizedEmail)}`
      );
    } catch (err: any) {
      setError(
        err?.message ||
          err?.response?.data?.detail ||
          err?.response?.data?.email?.[0] ||
          'Request failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-black text-slate-900">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your email address and we’ll send you a reset code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Email address
          </label>
          <input
            type="email"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#127D61]"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
        </div>

        {success ? (
          <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-[#127D61] px-4 py-3 font-bold text-white transition hover:opacity-95 disabled:opacity-60"
        >
          {busy ? 'Sending...' : 'Send code'}
        </button>

        <p className="text-center text-sm text-slate-600">
          Back to{' '}
          <Link href="/auth/login" className="font-bold text-[#127D61]">
            login
          </Link>
        </p>
      </form>
    </div>
  );
}