'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authApi } from '@/lib/api/services';
import { canAccessDashboardUser } from '@/lib/auth/roles';
import { useAuthStore } from '@/lib/stores/auth-store';
import { GoogleSignInButton } from '@/components/forms/google-signin-button';

type LoginFormState = {
  email: string;
  password: string;
};

function getSafeNextPath() {
  if (typeof window === 'undefined') return null;

  const nextPath = new URLSearchParams(window.location.search).get('next');

  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return null;
  }

  return nextPath;
}

function getRedirectPath(user: unknown, nextPath: string | null) {
  const isDashboardUser = canAccessDashboardUser(user as any);

  if (isDashboardUser) {
    return nextPath?.startsWith('/dashboard') ? nextPath : '/dashboard';
  }

  return nextPath ?? '/account/orders';
}

export function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const [form, setForm] = useState<LoginFormState>({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function updateField(field: keyof LoginFormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.email.trim() || !form.password) {
      setError('Please enter your email and password.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const response = await authApi.login({
        email: form.email.trim(),
        password: form.password,
      });

      setUser(response.user);

      const redirectPath = getRedirectPath(response.user, getSafeNextPath());
      router.push(redirectPath);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          'Invalid email or password.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <form
        onSubmit={onSubmit}
        className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 text-center">
          <p className="inline-flex rounded-full bg-[#127D61]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#127D61]">
            Welcome back
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
            Sign in to your account
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Access your orders, cart, addresses, and account dashboard.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-bold text-slate-700"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="input"
              disabled={busy}
              required
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-4">
              <label
                htmlFor="password"
                className="block text-sm font-bold text-slate-700"
              >
                Password
              </label>

              <Link
                href="/auth/forgot-password"
                className="text-sm font-bold text-[#127D61] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              className="input"
              disabled={busy}
              required
            />
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="btn mt-6 w-full bg-[#127D61] text-white transition hover:bg-[#0f6a52] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
            or
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <GoogleSignInButton />

        <p className="mt-6 text-center text-sm text-slate-600">
          No account yet?{' '}
          <Link
            href="/auth/register"
            className="font-bold text-[#127D61] hover:underline"
          >
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}