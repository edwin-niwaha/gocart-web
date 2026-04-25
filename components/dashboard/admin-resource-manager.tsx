'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import { getApiErrorMessage } from '@/lib/api/services';
import type { AdminResourceConfig, ResourceField } from '@/lib/types/admin';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toInputValue(type: ResourceField['type'], value: unknown) {
  if (type === 'checkbox') return Boolean(value);

  if (type === 'json') {
    return typeof value === 'string'
      ? value
      : JSON.stringify(value ?? [], null, 2);
  }

  return value == null ? '' : String(value);
}

function normalizePayload(fields: ResourceField[], state: Record<string, any>) {
  const payload: Record<string, any> = {};

  for (const field of fields) {
    const raw = state[field.name];

    if (field.type === 'checkbox') {
      payload[field.name] = Boolean(raw);
      continue;
    }

    if (raw === '' || raw == null) {
      if (field.preserveEmpty) payload[field.name] = '';
      continue;
    }

    if (field.type === 'number') {
      payload[field.name] = Number(raw);
    } else if (field.type === 'json') {
      payload[field.name] = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } else {
      payload[field.name] = raw;
    }
  }

  return payload;
}

function isImageUrl(value: unknown) {
  return typeof value === 'string' && /^https?:\/\/.+/i.test(value);
}

function formatDate(value: unknown) {
  if (!value || typeof value !== 'string') return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString();
}

function getDisplayTitle<T extends Record<string, any>>(
  item: T,
  idKey: string,
  fallback: string,
) {
  return String(
    item.name ??
      item.title ??
      item.label ??
      item.email ??
      item[idKey] ??
      fallback,
  );
}

function getDisplayImage<T extends Record<string, any>>(item: T) {
  const possibleImages = [
    item.image_url,
    item.image,
    item.thumbnail,
    item.hero_image,
    item.logo,
  ];

  return possibleImages.find(isImageUrl) as string | undefined;
}

function getStatusBadge(value: unknown) {
  if (value === true) {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  }

  return 'bg-slate-100 text-slate-600 ring-slate-200';
}

export function AdminResourceManager<T extends Record<string, any>>({
  config,
}: {
  config: AdminResourceConfig<T>;
}) {
  const idKey = String(config.idKey ?? 'id');
  const pageSize = config.pageSize ?? 8;

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [state, setState] = useState<Record<string, any>>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const resetForm = useCallback(() => {
    setEditing(null);

    const initial: Record<string, any> = {};

    config.fields.forEach((field) => {
      initial[field.name] = field.type === 'checkbox' ? false : '';
    });

    setState(initial);
  }, [config.fields]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await config.list();

      const data = Array.isArray(result)
        ? result
        : Array.isArray((result as any)?.results)
          ? (result as any).results
          : [];

      setItems(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load resource.'));
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    resetForm();
    load();
  }, [load, resetForm]);

  function openCreateModal() {
    resetForm();
    setMessage('');
    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    if (busy) return;

    resetForm();
    setModalOpen(false);
  }

  function onEdit(item: T) {
    setEditing(item);

    const next: Record<string, any> = {};

    config.fields.forEach((field) => {
      next[field.name] = toInputValue(field.type, item[field.name]);
    });

    setState(next);
    setMessage('');
    setError('');
    setModalOpen(true);
  }

  function handleFieldChange(field: ResourceField, value: any) {
    setState((prev) => {
      const next = { ...prev, [field.name]: value };

      const slugField = config.fields.find(
        (f) => f.name === 'slug' && f.autoSlugFrom === field.name,
      );

      if (slugField && !editing) {
        next.slug = slugify(String(value || ''));
      }

      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (config.readOnly) return;

    setBusy(true);
    setMessage('');
    setError('');

    try {
      const editableFields = config.fields.filter((field) => !field.readOnly);

      for (const field of editableFields) {
        const raw = state[field.name];

        if (
          field.required &&
          field.type !== 'checkbox' &&
          (raw === '' || raw == null)
        ) {
          throw new Error(`${field.label} is required.`);
        }

        if (field.type === 'json' && raw) {
          JSON.parse(raw);
        }
      }

      const payload = normalizePayload(editableFields, state);

      if (editing && config.update) {
        await config.update(editing[idKey], payload);
        setMessage(`${config.singular} updated successfully.`);
      } else if (config.create) {
        await config.create(payload);
        setMessage(`${config.singular} created successfully.`);
      }

      resetForm();
      setModalOpen(false);
      await load();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Request failed.'));
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(item: T) {
    if (!config.remove) return;

    const ok = window.confirm(
      `Delete "${getDisplayTitle(item, idKey, config.singular)}"?`,
    );

    if (!ok) return;

    setBusy(true);
    setMessage('');
    setError('');

    try {
      await config.remove(item[idKey]);
      setMessage(`${config.singular} deleted successfully.`);
      await load();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Delete failed.'));
    } finally {
      setBusy(false);
    }
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return items;

    return items.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(q),
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 px-5 py-6 text-white sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-wide">
                Admin Resource
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                {config.title}
              </h1>

              {config.description ? (
                <p className="mt-1 max-w-2xl text-sm font-medium text-emerald-50">
                  {config.description}
                </p>
              ) : null}
            </div>

            {!config.readOnly && config.create ? (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50"
              >
                <Plus className="h-4 w-4" />
                Create {config.singular}
              </button>
            ) : null}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            {config.searchable !== false ? (
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${config.title.toLowerCase()}...`}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
              />
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600">
              {filteredItems.length} record
              {filteredItems.length === 1 ? '' : 's'}
            </div>

            <button
              type="button"
              onClick={load}
              disabled={loading || busy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Alerts */}
        {message ? (
          <div className="mx-5 mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 sm:mx-6">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mx-5 mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 sm:mx-6">
            {error}
          </div>
        ) : null}

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-4 font-black">{config.singular}</th>

                {config.fields.slice(0, 4).map((field) => (
                  <th key={field.name} className="px-6 py-4 font-black">
                    {field.label}
                  </th>
                ))}

                <th className="px-6 py-4 text-right font-black">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={config.fields.slice(0, 4).length + 2}
                    className="px-6 py-12 text-center"
                  >
                    <p className="text-sm font-bold text-slate-500">
                      Loading records...
                    </p>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={config.fields.slice(0, 4).length + 2}
                    className="px-6 py-14 text-center"
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                      <ImageIcon className="h-7 w-7 text-emerald-600" />
                    </div>

                    <h3 className="mt-3 text-sm font-black text-slate-900">
                      No records found
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Create a new {config.singular.toLowerCase()} to get
                      started.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const title = getDisplayTitle(
                    item,
                    idKey,
                    `#${idx + 1}`,
                  );
                  const image = getDisplayImage(item);

                  return (
                    <tr
                      key={String(item[idKey] ?? idx)}
                      className="transition hover:bg-emerald-50/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex min-w-[220px] items-center gap-3">
                          {image ? (
                            <img
                              src={image}
                              alt={title}
                              className="h-11 w-11 rounded-2xl border border-slate-100 object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate font-black text-slate-900">
                              {title}
                            </p>

                            <p className="text-xs font-semibold text-slate-500">
                              {idKey}: {String(item[idKey] ?? '—')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {config.fields.slice(0, 4).map((field) => {
                        const value = item[field.name];

                        return (
                          <td key={field.name} className="px-6 py-4">
                            {field.type === 'checkbox' ? (
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${getStatusBadge(
                                  value,
                                )}`}
                              >
                                {value ? 'Yes' : 'No'}
                              </span>
                            ) : field.type === 'image' && isImageUrl(value) ? (
                              <img
                                src={String(value)}
                                alt={field.label}
                                className="h-10 w-10 rounded-xl border object-cover"
                              />
                            ) : (
                              <p className="line-clamp-2 max-w-xs text-sm font-semibold text-slate-700">
                                {value == null || value === ''
                                  ? '—'
                                  : String(value)}
                              </p>
                            )}
                          </td>
                        );
                      })}

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {config.update ? (
                            <button
                              type="button"
                              onClick={() => onEdit(item)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          ) : null}

                          {config.actions?.map((action) => (
                            <button
                              key={action.label}
                              type="button"
                              onClick={async () => {
                                setBusy(true);
                                setError('');
                                setMessage('');

                                try {
                                  await action.onClick(item);
                                  setMessage(`${action.label} completed.`);
                                  await load();
                                } catch (err: unknown) {
                                  setError(
                                    getApiErrorMessage(
                                      err,
                                      `${action.label} failed.`,
                                    ),
                                  );
                                } finally {
                                  setBusy(false);
                                }
                              }}
                              className={`rounded-xl px-3 py-2 text-xs font-black ${
                                action.tone === 'danger'
                                  ? 'bg-red-600 text-white'
                                  : action.tone === 'secondary'
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {action.label}
                            </button>
                          ))}

                          {config.remove ? (
                            <button
                              type="button"
                              onClick={() => removeItem(item)}
                              disabled={busy}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="grid gap-3 p-4 lg:hidden">
          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">
              Loading records...
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-emerald-600" />
              <h3 className="mt-2 text-sm font-black text-slate-900">
                No records found
              </h3>
            </div>
          ) : (
            paginatedItems.map((item, idx) => {
              const title = getDisplayTitle(item, idKey, `#${idx + 1}`);
              const image = getDisplayImage(item);
              const updatedAt = formatDate(item.updated_at);
              const createdAt = formatDate(item.created_at);

              return (
                <article
                  key={String(item[idKey] ?? idx)}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {image ? (
                      <img
                        src={image}
                        alt={title}
                        className="h-14 w-14 rounded-2xl border object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-black text-slate-900">
                        {title}
                      </h3>

                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {idKey}: {String(item[idKey] ?? '—')}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {'is_active' in item ? (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${getStatusBadge(
                              item.is_active,
                            )}`}
                          >
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        ) : null}

                        {'is_in_stock' in item ? (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              item.is_in_stock
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {item.is_in_stock ? 'In stock' : 'Out of stock'}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm">
                    {config.fields.slice(0, 5).map((field) => {
                      const value = item[field.name];

                      if (
                        value == null ||
                        value === '' ||
                        field.type === 'image'
                      ) {
                        return null;
                      }

                      return (
                        <div
                          key={field.name}
                          className="rounded-xl bg-slate-50 px-3 py-2"
                        >
                          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                            {field.label}
                          </p>

                          <p className="mt-0.5 line-clamp-2 font-semibold text-slate-700">
                            {field.type === 'checkbox'
                              ? value
                                ? 'Yes'
                                : 'No'
                              : String(value)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {updatedAt || createdAt ? (
                    <p className="mt-3 text-xs font-medium text-slate-400">
                      {updatedAt
                        ? `Updated: ${updatedAt}`
                        : `Created: ${createdAt}`}
                    </p>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {config.update ? (
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                    ) : null}

                    {config.remove ? (
                      <button
                        type="button"
                        onClick={() => removeItem(item)}
                        disabled={busy}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-black text-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    ) : null}
                  </div>

                  {config.actions?.length ? (
                    <div className="mt-2 grid gap-2">
                      {config.actions.map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onClick={async () => {
                            setBusy(true);
                            setError('');
                            setMessage('');

                            try {
                              await action.onClick(item);
                              setMessage(`${action.label} completed.`);
                              await load();
                            } catch (err: unknown) {
                              setError(
                                getApiErrorMessage(
                                  err,
                                  `${action.label} failed.`,
                                ),
                              );
                            } finally {
                              setBusy(false);
                            }
                          }}
                          className={`rounded-xl px-3 py-2 text-sm font-black ${
                            action.tone === 'danger'
                              ? 'bg-red-600 text-white'
                              : action.tone === 'secondary'
                                ? 'bg-orange-500 text-white'
                                : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredItems.length > 0 ? (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm font-semibold text-slate-500">
              Page {page} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {/* Shared Create/Edit Modal */}
      {modalOpen && !config.readOnly ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm">
          <form
            onSubmit={submit}
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {editing
                    ? `Edit ${config.singular}`
                    : `Create ${config.singular}`}
                </h3>

                {config.description ? (
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {config.description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={busy}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto px-5 py-4">
              <div className="grid gap-3 md:grid-cols-2">
                {config.fields.map((field) => {
                  const wide =
                    field.type === 'textarea' ||
                    field.type === 'json' ||
                    field.type === 'image';

                  return (
                    <label
                      key={field.name}
                      className={wide ? 'space-y-2 md:col-span-2' : 'space-y-2'}
                    >
                      <span className="text-sm font-black text-slate-700">
                        {field.label}
                        {field.required ? (
                          <span className="text-red-500"> *</span>
                        ) : null}
                      </span>

                      {field.type === 'textarea' || field.type === 'json' ? (
                        <textarea
                          className="min-h-[92px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                          value={state[field.name] ?? ''}
                          onChange={(e) =>
                            handleFieldChange(field, e.target.value)
                          }
                          placeholder={field.placeholder}
                          readOnly={field.readOnly}
                        />
                      ) : field.type === 'checkbox' ? (
                        <div className="flex min-h-11 items-center gap-3 rounded-xl bg-slate-50 px-3">
                          <input
                            type="checkbox"
                            checked={Boolean(state[field.name])}
                            onChange={(e) =>
                              handleFieldChange(field, e.target.checked)
                            }
                            disabled={field.readOnly}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />

                          <span className="text-sm font-semibold text-slate-600">
                            Enabled
                          </span>
                        </div>
                      ) : field.type === 'select' ? (
                        <select
                          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                          value={state[field.name] ?? ''}
                          onChange={(e) =>
                            handleFieldChange(field, e.target.value)
                          }
                          disabled={field.readOnly}
                        >
                          <option value="">Select {field.label}</option>

                          {(field.options ?? []).map((option) => (
                            <option
                              key={String(option.value)}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={
                            field.type === 'number'
                              ? 'number'
                              : field.type === 'date'
                                ? 'datetime-local'
                                : 'text'
                          }
                          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                          value={state[field.name] ?? ''}
                          onChange={(e) =>
                            handleFieldChange(field, e.target.value)
                          }
                          placeholder={field.placeholder}
                          readOnly={field.readOnly}
                        />
                      )}

                      {field.preview && isImageUrl(state[field.name]) ? (
                        <img
                          src={state[field.name]}
                          alt={field.label}
                          className="mt-2 h-24 w-24 rounded-2xl border object-cover"
                        />
                      ) : null}

                      {field.helpText ? (
                        <p className="text-xs font-medium text-slate-500">
                          {field.helpText}
                        </p>
                      ) : null}
                    </label>
                  );
                })}
              </div>

              {error ? (
                <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={busy}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy
                  ? 'Saving...'
                  : editing
                    ? `Update ${config.singular}`
                    : `Create ${config.singular}`}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}