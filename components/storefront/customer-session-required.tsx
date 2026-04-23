'use client';

import Link from 'next/link';
import { LayoutDashboard, LogIn, ShoppingBag } from 'lucide-react';
import { canAccessDashboardUser } from '@/lib/auth/roles';
import { useAuthStore } from '@/lib/stores/auth-store';

export function CustomerSessionRequired({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const user = useAuthStore((state) => state.user);
  const dashboardAllowed = canAccessDashboardUser(user);

  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-10 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        Customer Session Required
      </p>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900">{title}</h1>
      <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600">
        {description}
      </p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href={dashboardAllowed ? '/dashboard' : '/auth/login'}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          {dashboardAllowed ? (
            <LayoutDashboard className="h-4 w-4" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          {dashboardAllowed ? 'Open dashboard' : 'Sign in as customer'}
        </Link>

        <Link
          href="/products"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <ShoppingBag className="h-4 w-4" />
          Browse products
        </Link>
      </div>
    </div>
  );
}
