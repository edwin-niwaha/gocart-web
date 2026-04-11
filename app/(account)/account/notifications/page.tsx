'use client';

import { useEffect, useState } from 'react';
import { notificationApi } from '@/lib/api/services';
import type { Notification } from '@/lib/types';

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  async function load() { setItems(await notificationApi.list()); }
  useEffect(() => { load().catch(() => setItems([])); }, []);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button className="btn" onClick={async () => { await notificationApi.markAllRead(); await load(); }}>Mark all read</button>
      </div>
      {items.map((item) => (
        <div key={item.id} className="card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-gray-600">{item.message}</p>
            </div>
            {!item.is_read ? <button className="btn btn-secondary" onClick={async () => { await notificationApi.markRead(item.id); await load(); }}>Read</button> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
