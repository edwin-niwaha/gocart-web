'use client';

import { useMemo } from 'react';
import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

export default function StaffPage() {
  const config = useMemo(() => ({
    title: 'Staff management',
    singular: 'Membership',
    idKey: 'id',
    description: 'Invite, assign roles, and deactivate tenant staff accounts.',
    list: adminApi.memberships,
    create: adminApi.createMembership,
    update: adminApi.updateMembership,
    searchable: true,
    pageSize: 10,
    fields: [
      { name: 'email', label: 'User email', type: 'text' as const, required: true },
      { name: 'username', label: 'Username (for new user)', type: 'text' as const },
      { name: 'password', label: 'Temporary password', type: 'text' as const },
      {
        name: 'role',
        label: 'Role',
        type: 'select' as const,
        required: true,
        options: [
          { label: 'Staff', value: 'staff' },
          { label: 'Manager', value: 'manager' },
          { label: 'Tenant admin', value: 'tenant_admin' },
        ],
      },
      { name: 'is_active', label: 'Active', type: 'checkbox' as const },
    ],
  }), []);

  return <AdminResourceManager config={config} />;
}
