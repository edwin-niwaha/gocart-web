'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api/services';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');

    try {
      if (password !== passwordConfirm) {
        throw new Error('Passwords do not match.');
      }

      await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        password,
        password_confirm: passwordConfirm,
      });

      setMessage('Password reset successful.');
      router.push('/auth/login');
    } catch (err: any) {
      setError(err?.message || err?.response?.data?.detail || 'Reset failed.');
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
          Reset password
        </p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">Choose a new password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter the reset code sent to your email and set a new password.
        </p>
      </div>

      <input
        className="input w-full"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="input w-full"
        placeholder="Reset code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <input
        type="password"
        className="input w-full"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <input
        type="password"
        className="input w-full"
        placeholder="Confirm new password"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
      />

      {message ? (
        <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>
      ) : null}

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <button disabled={busy} className="btn w-full bg-[#127D61] text-white disabled:opacity-60">
        {busy ? 'Resetting...' : 'Reset password'}
      </button>
    </form>
  );
}