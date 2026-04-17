'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function AccountOverviewPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="inline-flex rounded-full bg-[#127D61]/10 px-3 py-1 text-sm font-bold text-[#127D61]">
          Account overview
        </p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">
          Welcome back{user?.first_name ? `, ${user.first_name}` : ''}.
        </h1>
        <p className="mt-2 text-slate-600">
          Manage your profile, security, orders, saved addresses, and notifications.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/account/profile"
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#127D61]"
        >
          <h2 className="text-xl font-black text-slate-900">Profile</h2>
          <p className="mt-2 text-sm text-slate-600">
            Update your username and personal details.
          </p>
        </Link>

        <Link
          href="/account/security"
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#127D61]"
        >
          <h2 className="text-xl font-black text-slate-900">Security</h2>
          <p className="mt-2 text-sm text-slate-600">
            Change password and manage email verification.
          </p>
        </Link>

        <Link
          href="/account/orders"
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#127D61]"
        >
          <h2 className="text-xl font-black text-slate-900">Orders</h2>
          <p className="mt-2 text-sm text-slate-600">
            View your order history and tracking details.
          </p>
        </Link>

        <Link
          href="/account/addresses"
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#127D61]"
        >
          <h2 className="text-xl font-black text-slate-900">Addresses</h2>
          <p className="mt-2 text-sm text-slate-600">
            Manage delivery locations and default address.
          </p>
        </Link>
      </div>
    </div>
  );
}