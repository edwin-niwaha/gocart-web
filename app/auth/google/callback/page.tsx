'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const [message, setMessage] = useState('Completing Google sign-in...');
  const executed = useRef(false);

  useEffect(() => {
    if (executed.current) return;
    executed.current = true;

    async function completeLogin() {
      try {
        const hash = window.location.hash.replace('#', '');
        const params = new URLSearchParams(hash);

        const accessToken = params.get('access_token');
        const error = params.get('error');

        if (error) {
          setMessage('Google authentication was cancelled.');
          return;
        }

        if (!accessToken) {
          setMessage('Google sign-in failed. Missing access token.');
          return;
        }

        const response = await authApi.googleLogin(accessToken);

        setUser(response.user);

        // Clean URL hash
        window.history.replaceState(null, '', window.location.pathname);

        if (response.user.user_type === 'ADMIN') {
          router.replace('/dashboard');
        } else {
          router.replace('/account/orders');
        }
      } catch (err: any) {
        setMessage(
          err?.response?.data?.detail ||
          'Unable to complete Google authentication.'
        );
      }
    }

    completeLogin();
  }, [router, setUser]);

  return (
    <div className="mx-auto max-w-xl py-16">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">
          Google Authentication
        </h1>

        <p className="mt-3 text-slate-600">{message}</p>

        <div className="mt-6 text-sm text-slate-400">
          Please wait while we securely sign you in.
        </div>
      </div>
    </div>
  );
}