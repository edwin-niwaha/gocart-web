import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/forms/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <div className="py-8">
      <Suspense
        fallback={
          <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
            Loading reset form...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
