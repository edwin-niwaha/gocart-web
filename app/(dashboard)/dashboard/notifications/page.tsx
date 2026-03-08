'use client';

import { AdminResourceManager } from '@/components/dashboard/admin-resource-manager';
import { adminApi } from '@/lib/api/services';

const config = {
  title: 'Notifications',
  singular: 'Notification',
  idKey: 'id',
  description: 'Manage customer notifications and read states.',
  list: adminApi.notifications,
  create: adminApi.createNotification,
  update: adminApi.updateNotification,
  remove: adminApi.removeNotification,
  actions: [{ label: 'Mark read', tone: 'primary', onClick: (item) => adminApi.markNotificationRead(item.id) }],
  readOnly: false,
  fields: [{ name: 'notification_type', label: 'Notification type', type: 'text' }, { name: 'title', label: 'Title', type: 'text' }, { name: 'message', label: 'Message', type: 'textarea' }, { name: 'data', label: 'Data JSON', type: 'json' }, { name: 'is_read', label: 'Is Read', type: 'checkbox' }],
};

export default function Page() {
  return <AdminResourceManager config={config} />;
}
