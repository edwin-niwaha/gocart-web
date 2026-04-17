'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/services';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');

    try {
      const normalizedEmail = email.trim().toLowerCase();
      await authApi.forgotPassword(normalizedEmail);
      setMessage('If the email exists, a reset code has been sent.');
      router.push(`/auth/reset-password?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.response?.data?.email?.[0] || 'Request failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-md space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <p className="inline-flex rounded-full bg-[#127D61]/10 px-3 py-1 text-sm font-bold text-[#127D61]">
          Forgot password
        </p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">Reset your password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your email address and we will send you a reset code.
        </p>
      </div>

      <input
        className="input w-full"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {message ? (
        <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>
      ) : null}

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <button disabled={busy} className="btn w-full bg-[#127D61] text-white disabled:opacity-60">
        {busy ? 'Sending...' : 'Send code'}
      </button>

      <p className="text-center text-sm text-slate-600">
        Back to <Link href="/auth/login" className="font-bold text-[#127D61]">sign in</Link>
      </p>
    </form>
  );
}