'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Heart, MapPin, Package, Wallet } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';

const links = [
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/notifications', label: 'Notifications', icon: Bell },
  { href: '/account/payments', label: 'Payments', icon: Wallet },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, hydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated && !user) {
      router.replace('/auth/login');
    }
  }, [hydrated, user, router]);

  if (!hydrated) {
    return <div className="py-16 text-center text-slate-500">Loading account...</div>;
  }

  if (!user) return null;

  return (
    <div className="grid gap-6 py-8 lg:grid-cols-[280px_1fr]">
      <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-[#127D61]">My account</p>
        <h2 className="mt-2 text-2xl font-black text-slate-900">{user.username || user.email}</h2>
        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        <div className="mt-5 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} className="flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </div>
      </aside>
      <main>{children}</main>
    </div>
  );
}
