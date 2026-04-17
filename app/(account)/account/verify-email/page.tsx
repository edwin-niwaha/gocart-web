'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/services';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');

    try {
      await authApi.verifyEmail(code.trim());
      setMessage('Email verified successfully.');
      router.push('/account');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Verification failed.');
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    setBusy(true);
    setMessage('');
    setError('');

    try {
      await authApi.sendEmailVerification();
      setMessage('Verification code sent.');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not resend code.');
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
          Verify email
        </p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">Confirm your email</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter the verification code sent to your email address.
        </p>
      </div>

      <input
        className="input w-full"
        placeholder="Verification code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      {message ? (
        <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>
      ) : null}

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <button disabled={busy} className="btn w-full bg-[#127D61] text-white disabled:opacity-60">
        {busy ? 'Verifying...' : 'Verify email'}
      </button>

      <button
        type="button"
        onClick={resendCode}
        disabled={busy}
        className="btn w-full border border-slate-200 bg-white text-slate-900"
      >
        Resend code
      </button>
    </form>
  );
}