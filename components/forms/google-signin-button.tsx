'use client';

import { Chrome } from 'lucide-react';

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

export function GoogleSignInButton({ label = 'Continue with Google' }: { label?: string }) {
  function handleGoogleLogin() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      window.alert('Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID in environment variables.');
      return;
    }

    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope: 'openid email profile',
      include_granted_scopes: 'true',
      prompt: 'select_account',
    });

    window.location.href = `${GOOGLE_OAUTH_URL}?${params.toString()}`;
  }

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-800 transition hover:bg-slate-50"
    >
      <Chrome size={18} />
      {label}
    </button>
  );
}
