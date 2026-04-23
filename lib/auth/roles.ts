import type { TenantMembership, TenantMembershipRole, User } from '@/lib/types';

const ROLE_WEIGHT: Record<TenantMembershipRole, number> = {
  customer: 0,
  staff: 1,
  tenant_staff: 1,
  manager: 2,
  tenant_admin: 3,
  tenant_owner: 4,
  super_admin: 5,
  platform_admin: 5,
};

export function getActiveMembership(user: User | null | undefined): TenantMembership | null {
  if (!user?.memberships?.length) return null;
  const slug = user.active_tenant_slug;
  return user.memberships.find((m) => m.is_active && (!slug || m.tenant_slug === slug)) ?? user.memberships.find((m) => m.is_active) ?? null;
}

export function getCurrentRole(user: User | null | undefined): TenantMembershipRole | null {
  return getActiveMembership(user)?.role ?? null;
}

export function isPlatformAdmin(user: User | null | undefined): boolean {
  return (
    user?.user_type === 'ADMIN' ||
    user?.user_type === 'PLATFORM_ADMIN' ||
    getCurrentRole(user) === 'platform_admin' ||
    getCurrentRole(user) === 'super_admin'
  );
}

export function canAccessDashboardUser(user: User | null | undefined): boolean {
  if (!user) return false;
  if (isPlatformAdmin(user)) return true;

  const current = getCurrentRole(user);
  if (!current) return false;

  return ROLE_WEIGHT[current] >= ROLE_WEIGHT.staff;
}

export function canUseStorefrontShopping(user: User | null | undefined): boolean {
  if (!user) return true;
  return !canAccessDashboardUser(user);
}

export function hasTenantRole(user: User | null | undefined, minimum: TenantMembershipRole): boolean {
  if (!user) return false;
  if (isPlatformAdmin(user)) return true;
  const current = getCurrentRole(user);
  if (!current) return false;
  return ROLE_WEIGHT[current] >= ROLE_WEIGHT[minimum];
}
