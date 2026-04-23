'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api/services';

function NewsletterConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [message, setMessage] = useState('Confirming your subscription...');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );

  useEffect(() => {
    async function confirmSubscription() {
      if (!token) {
        setStatus('error');
        setMessage('Missing confirmation token.');
        return;
      }

      try {
        const response = await api.get(
          `/newsletter/confirm/?token=${encodeURIComponent(token)}`
        );
        setStatus('success');
        setMessage(
          response.data?.detail || 'Your subscription has been confirmed.'
        );
      } catch (error: unknown) {
        setStatus('error');
        setMessage(
          getApiErrorMessage(error, 'Unable to confirm your subscription.')
        );
      }
    }

    confirmSubscription();
  }, [token]);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">
        {status === 'success'
          ? 'Subscription confirmed'
          : 'Newsletter confirmation'}
      </h1>
      <p className="mt-4 text-sm text-slate-600">{message}</p>
    </div>
  );
}

export default function NewsletterConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="text-3xl font-bold">Newsletter confirmation</h1>
          <p className="mt-4 text-sm text-slate-600">
            Preparing confirmation...
          </p>
        </div>
      }
    >
      <NewsletterConfirmContent />
    </Suspense>
  );
}
