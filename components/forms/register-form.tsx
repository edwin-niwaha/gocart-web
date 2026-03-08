'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/stores/auth-store';
import { GoogleSignInButton } from '@/components/forms/google-signin-button';

export function RegisterForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [form, setForm] = useState({ email: '', username: '', password: '', password_confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await authApi.register(form);
      setUser(response.user);
      router.push('/account/orders');
    } catch (err: any) {
      const detail = err?.response?.data;
      setError(typeof detail === 'string' ? detail : 'Registration failed. Check your values.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="inline-flex rounded-full bg-[#F79420]/10 px-3 py-1 text-sm font-bold text-[#F79420]">Create account</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">Start shopping with GoCart</h1>
        <p className="mt-2 text-sm text-slate-600">Register to save your cart, place orders online, and track purchases.</p>
      </div>

      <div className="space-y-3">
        <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input className="input" type="password" placeholder="Confirm password" value={form.password_confirm} onChange={(e) => setForm({ ...form, password_confirm: e.target.value })} />
      </div>

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <button disabled={busy} className="btn w-full bg-[#127D61] text-white disabled:opacity-60">
        {busy ? 'Creating account...' : 'Create account'}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-3 text-xs font-bold uppercase tracking-wide text-slate-400">or</span></div>
      </div>

      <GoogleSignInButton label="Sign up with Google" />

      <p className="text-center text-sm text-slate-600">
        Already registered? <Link href="/auth/login" className="font-bold text-[#127D61]">Sign in</Link>
      </p>
    </form>
  );
}
