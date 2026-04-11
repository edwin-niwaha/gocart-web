'use client';

import { useTenant } from '@/app/providers/TenantProvider';

export default function PrivacyPage() {
  const { settings } = useTenant() || {};

  const hasPrivacy = Boolean(settings?.privacy_url);

  return (
    <div className="card my-8">
      <h1 className="section-title">Privacy</h1>

      <p className="subtle mt-3">
        {hasPrivacy
          ? 'View the tenant privacy policy using the link below.'
          : 'No tenant privacy URL has been configured yet.'}
      </p>

      {hasPrivacy && (
        <a
          href={settings!.privacy_url}
          className="btn mt-4"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open privacy policy
        </a>
      )}
    </div>
  );
}