const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(process.cwd(), 'lib/api/services.ts'),
  'utf8'
);

for (const exportName of [
  'authApi',
  'tenantApi',
  'catalogApi',
  'variantApi',
  'cartApi',
  'checkoutApi',
  'orderApi',
  'paymentApi',
  'couponApi',
  'addressApi',
  'wishlistApi',
  'reviewApi',
  'notificationApi',
  'supportApi',
  'dashboardApi',
  'adminApi',
]) {
  assert.match(source, new RegExp(`export const ${exportName}\\b`));
}

for (const snippet of [
  'getPaginatedList',
  'productsPage',
  'categoriesPage',
  'listPage',
  'summary: async',
  'validate: async',
  'submit: async',
  'cancel: async',
  'requestRefund',
  'refund: async',
  'dashboardSummary',
  '/variants/',
  '/checkout/validate/',
  '/checkout/summary/',
  '/admin/dashboard/summary/',
]) {
  assert.ok(
    source.includes(snippet),
    `Expected API contract snippet missing: ${snippet}`
  );
}

console.log('API contract tests passed.');
