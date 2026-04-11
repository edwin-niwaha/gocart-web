'use client';

import { useMemo } from 'react';
import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

export default function FeatureFlagsPage() {
  const config = useMemo(() => ({
    title: 'Feature flags',
    singular: 'Feature flag',
    idKey: 'id',
    description: 'Toggle tenant-level features without shipping a new build.',
    list: adminApi.featureFlags,
    create: adminApi.createFeatureFlag,
    readOnly: false,
    searchable: true,
    pageSize: 10,
    fields: [
      { name: 'key', label: 'Key', type: 'text' as const, required: true },
      { name: 'description', label: 'Description', type: 'textarea' as const },
      { name: 'enabled', label: 'Enabled', type: 'checkbox' as const },
    ],
  }), []);

  return <AdminResourceManager config={config} />;
}
