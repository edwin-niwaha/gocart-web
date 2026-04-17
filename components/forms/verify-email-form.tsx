'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/services';

export function VerifyEmailForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');

    try {
      if (!code.trim()) {
        throw new Error('Please enter the verification code.');
      }

      await authApi.verifyEmail(code.trim());
      setMessage('Email verified successfully.');
      router.push('/account');
    } catch (err: any) {
      setError(
        err?.message ||
          err?.response?.data?.detail ||
          'Verification failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    setBusy(true);
    setMessage('');
    setError('');

    try {
      await authApi.sendEmailVerification();
      setMessage('Verification code sent successfully.');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not resend code.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-black text-slate-900">Verify email</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter the verification code sent to your email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Verification code
          </label>
          <input
            type="text"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#127D61]"
            placeholder="Enter code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={busy}
          />
        </div>

        {message ? (
          <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
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
          {busy ? 'Verifying...' : 'Verify email'}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={busy}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Resend code
        </button>
      </form>
    </div>
  );
}