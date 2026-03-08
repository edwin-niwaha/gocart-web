'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Payments',
  singular: 'Payment',
  idKey: 'id',
  description: 'Manage payment records and settlement actions.',
  list: adminApi.payments,
  create: adminApi.createPayment,
  update: adminApi.updatePayment,

  actions: [{ label: 'Mark paid', tone: 'primary', onClick: (item) => adminApi.markPaymentPaid(item.id, { transaction_id: 'manual-admin-approval', provider_response: { source: 'web-admin' } }) }, { label: 'Mark failed', tone: 'danger', onClick: (item) => adminApi.markPaymentFailed(item.id, { provider_response: { source: 'web-admin' } }) }],
  readOnly: false,
  fields: [{ name: 'order', label: 'Order ID', type: 'number' }, { name: 'provider', label: 'Provider', type: 'text' }, { name: 'currency', label: 'Currency', type: 'text' }, { name: 'amount', label: 'Amount', type: 'number' }],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
