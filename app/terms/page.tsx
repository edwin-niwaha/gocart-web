'use client';

import { useTenant } from '@/app/providers/TenantProvider';

export default function TermsPage() {
  const { settings } = useTenant() || {};

  const hasTerms = Boolean(settings?.terms_url);

  return (
    <div className="card my-8">
      <h1 className="section-title">Terms</h1>

      <p className="subtle mt-3">
        {hasTerms
          ? 'View the tenant terms using the link below.'
          : 'No tenant terms URL has been configured yet.'}
      </p>

      {hasTerms && (
        <a
          href={settings!.terms_url}
          className="btn mt-4"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open terms
        </a>
      )}
    </div>
  );
}