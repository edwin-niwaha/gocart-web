'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';

import {
  adminApi,
  getApiErrorMessage,
  isPaginatedResponse,
} from '@/lib/api/services';
import type { TenantMembership, TenantMembershipRole } from '@/lib/types';

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const ROLE_OPTIONS: Array<{
  label: string;
  value: Extract<TenantMembershipRole, 'staff' | 'manager' | 'tenant_admin'>;
}> = [
  { label: 'Staff', value: 'staff' },
  { label: 'Manager', value: 'manager' },
  { label: 'Tenant admin', value: 'tenant_admin' },
];

type ModalMode = 'create' | 'edit';

type ClientFormState = {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: Extract<TenantMembershipRole, 'staff' | 'manager' | 'tenant_admin'>;
  is_active: boolean;
  password: string;
};

const INITIAL_FORM: ClientFormState = {
  email: '',
  username: '',
  first_name: '',
  last_name: '',
  role: 'staff',
  is_active: true,
  password: '',
};

function formatRoleLabel(role?: string) {
  return String(role || 'staff')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return 'Recently';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getClientName(client: TenantMembership) {
  const fullName = client.full_name?.trim();
  if (fullName) return fullName;

  const composed = `${client.first_name || ''} ${client.last_name || ''}`.trim();
  if (composed) return composed;

  if (client.username?.trim()) return client.username.trim();
  if (client.email?.trim()) return client.email.trim();

  return 'Client';
}

function getClientStatus(client: TenantMembership) {
  if (client.status) return client.status;
  if (client.is_active && client.user_is_active !== false) return 'active';
  return 'inactive';
}

function getStatusClasses(status: string) {
  return status === 'active'
    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border border-slate-200 bg-slate-100 text-slate-600';
}

function buildEditForm(client: TenantMembership): ClientFormState {
  return {
    email: client.email || '',
    username: client.username || '',
    first_name: client.first_name || '',
    last_name: client.last_name || '',
    role:
      client.role === 'manager' || client.role === 'tenant_admin'
        ? client.role
        : 'staff',
    is_active: client.is_active,
    password: '',
  };
}

export default function UsersPage() {
  const [clients, setClients] = useState<TenantMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingClient, setEditingClient] = useState<TenantMembership | null>(null);
  const [form, setForm] = useState<ClientFormState>(INITIAL_FORM);

  const query = deferredSearch.trim();

  const loadClients = useCallback(
    async (showRefreshing = false) => {
      try {
        setError(null);
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);

        const response = await adminApi.clientsPage({
          page,
          page_size: pageSize,
          search: query || undefined,
          status: statusFilter || undefined,
        });

        if (isPaginatedResponse(response)) {
          setClients(response.results);
          setTotalCount(response.count);
          setTotalPages(Math.max(1, Math.ceil(response.count / pageSize)));
        } else {
          setClients(response);
          setTotalCount(response.length);
          setTotalPages(Math.max(1, Math.ceil(response.length / pageSize)));
        }
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, 'Failed to load clients.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, pageSize, query, statusFilter]
  );

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const visibleRangeText = useMemo(() => {
    if (totalCount === 0) return '0 clients';

    const start = (page - 1) * pageSize + 1;
    const end = start + clients.length - 1;
    return `${start}-${end} of ${totalCount}`;
  }, [clients.length, page, pageSize, totalCount]);

  const statusSummary = useMemo(() => {
    return clients.reduce(
      (summary, client) => {
        if (getClientStatus(client) === 'active') summary.active += 1;
        else summary.inactive += 1;
        return summary;
      },
      { active: 0, inactive: 0 }
    );
  }, [clients]);

  function resetForm() {
    setForm(INITIAL_FORM);
    setEditingClient(null);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    resetForm();
  }

  function openCreateModal() {
    setNotice(null);
    setError(null);
    setModalMode('create');
    setForm(INITIAL_FORM);
    setEditingClient(null);
    setModalOpen(true);
  }

  function openEditModal(client: TenantMembership) {
    setNotice(null);
    setError(null);
    setModalMode('edit');
    setEditingClient(client);
    setForm(buildEditForm(client));
    setModalOpen(true);
  }

  function updateForm<K extends keyof ClientFormState>(
    key: K,
    value: ClientFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const payload = {
        username: form.username.trim() || undefined,
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        role: form.role,
        is_active: form.is_active,
        ...(form.password.trim() ? { password: form.password } : {}),
      };

      if (modalMode === 'create') {
        await adminApi.createClient({
          ...payload,
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });
        setNotice('Client created successfully.');
        setPage(1);
      } else if (editingClient) {
        await adminApi.updateClient(editingClient.id, payload);
        setNotice('Client updated successfully.');
      }

      closeModal();
      if (modalMode === 'create' && page !== 1) {
        setPage(1);
      } else {
        await loadClients();
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to save client.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(client: TenantMembership) {
    const confirmed = window.confirm(
      `Remove ${getClientName(client)} from this tenant?`
    );
    if (!confirmed) return;

    setDeletingId(client.id);
    setError(null);
    setNotice(null);

    try {
      await adminApi.removeClient(client.id);
      setNotice('Client removed successfully.');

      if (clients.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      } else {
        await loadClients();
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to remove client.'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage the accounts currently linked to this tenant without
              leaving the dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{totalCount}</span>{' '}
              total
            </div>

            <button
              type="button"
              onClick={() => loadClients(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#127D61] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f684f]"
            >
              <Plus className="h-4 w-4" />
              Create Client
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_160px]">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email, username, or role"
                className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Rows
            </label>
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p>Showing {visibleRangeText}</p>
          <p>
            Active on this page: {statusSummary.active} | Inactive:{' '}
            {statusSummary.inactive}
          </p>
        </div>
      </section>

      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading clients...
          </div>
        ) : clients.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <UserRound className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No clients found
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Try a different search or create a new client from this tenant.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-collapse">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="border-b border-slate-200 px-4 py-3">
                      Client
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Email
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Role
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Status
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Joined
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {clients.map((client, index) => {
                    const status = getClientStatus(client);

                    return (
                      <tr
                        key={client.id}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                      >
                        <td className="border-b border-slate-100 px-4 py-4">
                          <div className="font-semibold text-slate-900">
                            {getClientName(client)}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {client.username || 'No username'}
                          </div>
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                          {client.email || '-'}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                          {formatRoleLabel(client.role)}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              status
                            )}`}
                          >
                            {status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4 text-sm text-slate-700">
                          {formatDate(client.created_at)}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(client)}
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(client)}
                              disabled={deletingId === client.id}
                              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId === client.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {clients.map((client) => {
                const status = getClientStatus(client);

                return (
                  <article
                    key={client.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">
                          {getClientName(client)}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {client.email || '-'}
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                          status
                        )}`}
                      >
                        {status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-slate-600">
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <span className="text-xs uppercase tracking-wide text-slate-400">
                          Role
                        </span>
                        <p className="mt-1 font-medium text-slate-800">
                          {formatRoleLabel(client.role)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <span className="text-xs uppercase tracking-wide text-slate-400">
                          Joined
                        </span>
                        <p className="mt-1 font-medium text-slate-800">
                          {formatDate(client.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(client)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(client)}
                        disabled={deletingId === client.id}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === client.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {modalMode === 'create' ? 'Create Client' : 'Edit Client'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {modalMode === 'create'
                    ? 'Add a new tenant-linked account using the existing auth and membership flow.'
                    : 'Update the selected client without leaving the listing page.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close client form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto px-5 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    First name
                  </span>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(event) =>
                      updateForm('first_name', event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                    placeholder="Amina"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Last name
                  </span>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(event) =>
                      updateForm('last_name', event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                    placeholder="Namusoke"
                  />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">
                    Email address
                  </span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateForm('email', event.target.value)}
                    readOnly={modalMode === 'edit'}
                    required
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-slate-500 ${
                      modalMode === 'edit'
                        ? 'border-slate-200 bg-slate-100 text-slate-500'
                        : 'border-slate-300'
                    }`}
                    placeholder="client@example.com"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Username
                  </span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(event) =>
                      updateForm('username', event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                    placeholder="clientuser"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Role
                  </span>
                  <select
                    value={form.role}
                    onChange={(event) =>
                      updateForm(
                        'role',
                        event.target.value as ClientFormState['role']
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">
                    {modalMode === 'create'
                      ? 'Temporary password'
                      : 'Reset password'}
                  </span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      updateForm('password', event.target.value)
                    }
                    required={modalMode === 'create'}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                    placeholder={
                      modalMode === 'create'
                        ? 'At least 8 characters'
                        : 'Leave blank to keep the current password'
                    }
                  />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">
                    Tenant access
                  </span>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Keep this client active
                      </p>
                      <p className="text-xs text-slate-500">
                        Turning this off removes active access for this tenant.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(event) =>
                        updateForm('is_active', event.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-[#127D61] focus:ring-[#127D61]"
                    />
                  </div>
                </label>
              </div>

              {modalMode === 'edit' && editingClient?.user_is_active === false ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  This account is globally inactive. Re-activating tenant access
                  here will not override the account-level status.
                </div>
              ) : null}
            </div>

            <div className="flex gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-[#127D61] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f684f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : modalMode === 'create' ? (
                  'Create Client'
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
