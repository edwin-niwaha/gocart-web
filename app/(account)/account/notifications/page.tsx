'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, BellRing, CheckCheck, ChevronRight, Loader2 } from 'lucide-react';
import {
  getApiErrorMessage,
  notificationApi,
  type PaginatedResponse,
} from '@/lib/api/services';
import type { Notification } from '@/lib/types';

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [nextUrl, setNextUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingIds, setMarkingIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.is_read).length,
    [items]
  );

  const applyResponse = useCallback(
    (
      response: PaginatedResponse<Notification>,
      mode: 'replace' | 'append' = 'replace'
    ) => {
      const incoming = Array.isArray(response) ? response : response.results ?? [];
      const next = Array.isArray(response) ? null : response.next ?? null;
      const total = Array.isArray(response) ? incoming.length : response.count ?? incoming.length;

      setCount(total);
      setNextUrl(next);

      setItems((prev) => {
        if (mode === 'replace') return incoming;

        const seen = new Set(prev.map((item) => item.id));
        const merged = [...prev];

        for (const item of incoming) {
          if (!seen.has(item.id)) {
            merged.push(item);
          }
        }

        return merged;
      });
    },
    []
  );

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await notificationApi.list();
      applyResponse(response, 'replace');
    } catch (error: unknown) {
      setItems([]);
      setCount(0);
      setNextUrl(null);
      setError(getApiErrorMessage(error, 'Failed to load notifications.'));
    } finally {
      setLoading(false);
    }
  }, [applyResponse]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const response = await notificationApi.list();
      applyResponse(response, 'replace');
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, 'Failed to refresh notifications.'));
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextUrl || loadingMore) return;

    try {
      setLoadingMore(true);
      setError(null);

      const response = await notificationApi.list(nextUrl);
      applyResponse(response, 'append');
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, 'Failed to load more notifications.'));
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkRead = async (id: number, isRead?: boolean) => {
    if (isRead) return;

    try {
      setMarkingIds((prev) => [...prev, id]);
      await notificationApi.markRead(id);

      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                is_read: true,
                read_at: item.read_at ?? new Date().toISOString(),
              }
            : item
        )
      );
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, 'Failed to mark notification as read.'));
    } finally {
      setMarkingIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const handleMarkAllRead = async () => {
    if (!items.length || unreadCount === 0) return;

    try {
      setMarkingAll(true);
      await notificationApi.markAllRead();

      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at ?? new Date().toISOString(),
        }))
      );
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, 'Failed to mark all notifications as read.'));
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-gray-50">
      <section className="w-full px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Account
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">
                Notifications
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Order updates and important alerts appear here.
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
              <BellRing className="h-5 w-5 text-emerald-600" />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600">
              {count > 0
                ? unreadCount > 0
                  ? `${unreadCount} unread of ${count}`
                  : `${count} notification${count === 1 ? '' : 's'}`
                : 'No notifications'}
            </div>

            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll || unreadCount === 0}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {markingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Marking...
                </>
              ) : (
                <>
                  <CheckCheck className="h-4 w-4" />
                  Mark all read
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
          >
            {refreshing ? 'Refreshing...' : 'Refresh notifications'}
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[320px] w-full items-center justify-center rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
              <p className="text-sm font-medium text-gray-600">
                Loading notifications...
              </p>
            </div>
          </div>
        ) : error && !items.length ? (
          <div className="w-full rounded-3xl border border-red-200 bg-red-50 p-5 text-center shadow-sm">
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={loadNotifications}
              className="mt-3 rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="w-full rounded-3xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <Bell className="h-6 w-6 text-gray-500" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-gray-900">
              No notifications
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Order updates and promotions will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3">
              {items.map((item) => {
                const isMarking = markingIds.includes(item.id);
                const isRead = Boolean(item.is_read);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleMarkRead(item.id, item.is_read)}
                    disabled={isMarking}
                    className={`w-full rounded-3xl border p-4 text-left shadow-sm transition ${
                      isRead
                        ? 'border-gray-200 bg-white hover:bg-gray-50'
                        : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100/60'
                    } ${isMarking ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                        {isRead ? (
                          <Bell className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <BellRing className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h2
                            className={`text-sm leading-5 ${
                              isRead
                                ? 'font-semibold text-gray-900'
                                : 'font-extrabold text-gray-900'
                            }`}
                          >
                            {item.title}
                          </h2>

                          {!isRead ? (
                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600" />
                          ) : null}
                        </div>

                        <p className="mt-1 text-sm leading-6 text-gray-600">
                          {item.message}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-gray-500">
                            {isRead ? 'Read' : 'Tap to mark as read'}
                          </span>

                          {isMarking ? (
                            <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Updating...
                            </span>
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {nextUrl ? (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingMore ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading more...
                    </span>
                  ) : (
                    'Load more'
                  )}
                </button>
              </div>
            ) : items.length > 0 ? (
              <p className="mt-4 text-center text-xs font-medium text-gray-500">
                You have reached the end.
              </p>
            ) : null}

            {error ? (
              <p className="mt-3 text-center text-sm font-medium text-red-600">
                {error}
              </p>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
