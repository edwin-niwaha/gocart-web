'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi, getApiErrorMessage } from '@/lib/api/services';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSuccess('');
    setError('');

    try {
      if (!email.trim() || !code.trim() || !password.trim() || !passwordConfirm.trim()) {
        throw new Error('Please complete all fields.');
      }

      if (password !== passwordConfirm) {
        throw new Error('Passwords do not match.');
      }

      await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        password,
        password_confirm: passwordConfirm,
      });

      setSuccess('Password reset successful.');
      router.push('/auth/login');
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, 'Could not reset password.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-black text-slate-900">Reset password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter the code sent to your email and choose a new password.
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
        </div>

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

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            New password
          </label>
          <input
            type="password"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#127D61]"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Confirm password
          </label>
          <input
            type="password"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#127D61]"
            placeholder="Confirm password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
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
          {busy ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </div>
  );
}
