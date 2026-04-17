'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/stores/auth-store';
import { GoogleSignInButton } from '@/components/forms/google-signin-button';

export function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await authApi.login(form);
      setUser(response.user);
      router.push(response.user.user_type === 'ADMIN' ? '/dashboard' : '/account/orders');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid credentials.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="inline-flex rounded-full bg-[#127D61]/10 px-3 py-1 text-sm font-bold text-[#127D61]">Welcome back</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">Sign in to your account</h1>
        <p className="mt-2 text-sm text-slate-600">Access your orders, cart, addresses, and account dashboard.</p>
      </div>

      <div className="space-y-3">
        <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </div>
      <div className="text-right">
        <Link href="/auth/forgot-password" className="text-sm font-bold text-[#127D61]">
          Forgot password?
        </Link>
      </div>
      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <button disabled={busy} className="btn w-full bg-[#127D61] text-white disabled:opacity-60">
        {busy ? 'Signing in...' : 'Sign in'}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-3 text-xs font-bold uppercase tracking-wide text-slate-400">or</span></div>
      </div>

      <GoogleSignInButton />

      <p className="text-center text-sm text-slate-600">
        No account yet? <Link href="/auth/register" className="font-bold text-[#127D61]">Create one</Link>
      </p>
    </form>
  );
}
