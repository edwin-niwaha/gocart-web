'use client';

import { useEffect, useMemo, useState } from 'react';
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
  if (type === 'json') return typeof value === 'string' ? value : JSON.stringify(value ?? [], null, 2);
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

    if (raw === '' || raw == null) continue;

    switch (field.type) {
      case 'number':
        payload[field.name] = Number(raw);
        break;
      case 'json':
        payload[field.name] = typeof raw === 'string' ? JSON.parse(raw) : raw;
        break;
      default:
        payload[field.name] = raw;
    }
  }

  return payload;
}

function isImageUrl(value: unknown) {
  if (typeof value !== 'string') return false;
  return /^https?:\/\/.+/i.test(value);
}

function formatDate(value: unknown) {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [state, setState] = useState<Record<string, any>>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const resetForm = () => {
    setEditing(null);
    const initial: Record<string, any> = {};
    config.fields.forEach((field) => {
      initial[field.name] = field.type === 'checkbox' ? false : '';
    });
    setState(initial);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await config.list();
      setItems(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load resource.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    resetForm();
    load();
  }, []);

  const onEdit = (item: T) => {
    setEditing(item);
    const next: Record<string, any> = {};

    config.fields.forEach((field) => {
      next[field.name] = toInputValue(field.type, item[field.name]);
    });

    setState(next);
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFieldChange = (field: ResourceField, value: any) => {
    setState((prev) => {
      const next = { ...prev, [field.name]: value };

      const slugField = config.fields.find(
        (f) => f.name === 'slug' && f.autoSlugFrom === field.name
      );

      if (slugField && !editing) {
        next.slug = slugify(String(value || ''));
      }

      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (config.readOnly) return;

    setBusy(true);
    setMessage('');
    setError('');

    try {
      const editableFields = config.fields.filter((field) => !field.readOnly);

      for (const field of editableFields) {
        const raw = state[field.name];
        if (field.required && field.type !== 'checkbox' && (raw === '' || raw == null)) {
          throw new Error(`${field.label} is required.`);
        }
        if (field.type === 'json' && raw) {
          JSON.parse(raw);
        }
      }

      const payload = normalizePayload(editableFields, state);

      if (editing && config.update) {
        await config.update(editing[idKey], payload);
        setMessage(`${config.singular} updated.`);
      } else if (config.create) {
        await config.create(payload);
        setMessage(`${config.singular} created.`);
      }

      resetForm();
      await load();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        JSON.stringify(err?.response?.data || {}) ||
        'Request failed.'
      );
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (item: T) => {
    if (!config.remove) return;

    const ok = window.confirm(`Delete this ${config.singular.toLowerCase()}?`);
    if (!ok) return;

    setBusy(true);
    setMessage('');
    setError('');

    try {
      await config.remove(item[idKey]);
      setMessage(`${config.singular} deleted.`);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Delete failed.');
    } finally {
      setBusy(false);
    }
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
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
      <div className="card">
        <p className="badge">{config.title}</p>
        <h1 className="mt-3 text-3xl font-black">{config.title}</h1>
        {config.description ? <p className="mt-2 subtle">{config.description}</p> : null}
      </div>

      {!config.readOnly ? (
        <form onSubmit={submit} className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              {editing ? `Edit ${config.singular}` : `Create ${config.singular}`}
            </h2>
            {editing ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border px-4 py-2 text-sm font-semibold"
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {config.fields.map((field) => {
              const wide =
                field.type === 'textarea' || field.type === 'json' || field.type === 'image';

              return (
                <label
                  key={field.name}
                  className={wide ? 'md:col-span-2 space-y-2' : 'space-y-2'}
                >
                  <span className="text-sm font-semibold">{field.label}</span>

                  {field.type === 'textarea' || field.type === 'json' ? (
                    <textarea
                      className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                      value={state[field.name] ?? ''}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      placeholder={field.placeholder}
                      readOnly={field.readOnly}
                    />
                  ) : field.type === 'checkbox' ? (
                    <input
                      type="checkbox"
                      checked={Boolean(state[field.name])}
                      onChange={(e) => handleFieldChange(field, e.target.checked)}
                      disabled={field.readOnly}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                      value={state[field.name] ?? ''}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      disabled={field.readOnly}
                    >
                      <option value="">Select {field.label}</option>
                      {(field.options ?? []).map((option) => (
                        <option key={String(option.value)} value={option.value}>
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
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                      value={state[field.name] ?? ''}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      placeholder={field.placeholder}
                      readOnly={field.readOnly}
                    />
                  )}

                  {field.preview && isImageUrl(state[field.name]) ? (
                    <img
                      src={state[field.name]}
                      alt={field.label}
                      className="mt-2 h-32 w-32 rounded-2xl border object-cover"
                    />
                  ) : null}

                  {field.helpText ? (
                    <p className="text-xs text-slate-500">{field.helpText}</p>
                  ) : null}
                </label>
              );
            })}
          </div>

          {message ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            disabled={busy}
            className="rounded-2xl bg-[#127D61] px-5 py-3 font-bold text-white disabled:opacity-60"
          >
            {busy ? 'Saving...' : editing ? `Update ${config.singular}` : `Create ${config.singular}`}
          </button>
        </form>
      ) : null}

      <div className="card">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold">Records</h2>

          <div className="flex flex-col gap-3 md:flex-row">
            {config.searchable !== false ? (
              <input
                type="text"
                placeholder={`Search ${config.title.toLowerCase()}...`}
                className="w-full rounded-xl border px-4 py-2 text-sm outline-none focus:border-emerald-500 md:w-72"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            ) : null}

            <button
              type="button"
              onClick={load}
              className="rounded-xl border px-4 py-2 text-sm font-semibold"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? <p className="subtle">Loading...</p> : null}
        {!loading && filteredItems.length === 0 ? <p className="subtle">No records found.</p> : null}

        <div className="space-y-4">
          {paginatedItems.map((item, idx) => {
            const displayTitle = String(
              item.name ?? item.title ?? item[idKey] ?? `#${idx + 1}`
            );
            const displayImage =
              typeof item.image_url === 'string' && isImageUrl(item.image_url)
                ? item.image_url
                : typeof item.hero_image === 'string' && isImageUrl(item.hero_image)
                  ? item.hero_image
                  : null;
            const updatedAt = formatDate(item.updated_at);
            const createdAt = formatDate(item.created_at);

            return (
              <div
                key={String(item[idKey] ?? idx)}
                className="rounded-3xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt={displayTitle}
                        className="h-20 w-20 rounded-2xl border object-cover"
                      />
                    ) : null}

                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold text-slate-900">{displayTitle}</p>

                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
                        {'slug' in item && item.slug ? <span>Slug: {String(item.slug)}</span> : null}
                        {'id' in item && item.id != null ? <span>ID: {String(item.id)}</span> : null}
                        {'price' in item && item.price != null ? <span>Price: {String(item.price)}</span> : null}
                        {'stock_quantity' in item && item.stock_quantity != null ? (
                          <span>Stock: {String(item.stock_quantity)}</span>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {'is_active' in item ? (
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.is_active
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                              }`}
                          >
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        ) : null}

                        {'is_in_stock' in item ? (
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.is_in_stock
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                              }`}
                          >
                            {item.is_in_stock ? 'In stock' : 'Out of stock'}
                          </span>
                        ) : null}
                      </div>

                      {('description' in item && item.description) || updatedAt || createdAt ? (
                        <div className="mt-3 space-y-1">
                          {'description' in item && item.description ? (
                            <p className="line-clamp-2 max-w-2xl text-sm text-slate-600">
                              {String(item.description)}
                            </p>
                          ) : null}

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                            {updatedAt ? <span>Updated: {updatedAt}</span> : null}
                            {!updatedAt && createdAt ? <span>Created: {createdAt}</span> : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {config.update ? (
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="rounded-xl border px-3 py-2 text-sm font-semibold"
                      >
                        Edit
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
                          } catch (err: any) {
                            setError(
                              err?.response?.data?.detail ||
                              err?.message ||
                              `${action.label} failed.`
                            );
                          } finally {
                            setBusy(false);
                          }
                        }}
                        className={`rounded-xl px-3 py-2 text-sm font-semibold ${action.tone === 'danger'
                            ? 'bg-red-600 text-white'
                            : action.tone === 'secondary'
                              ? 'bg-[#F79420] text-white'
                              : 'bg-[#127D61] text-white'
                          }`}
                      >
                        {action.label}
                      </button>
                    ))}

                    {config.remove ? (
                      <button
                        type="button"
                        onClick={() => removeItem(item)}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && filteredItems.length > 0 ? (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}