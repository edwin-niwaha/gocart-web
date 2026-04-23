export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';

const IDEMPOTENCY_SCOPE_PATTERN = /^[a-z0-9-]{2,32}$/;

function normalizeScope(scope: string) {
  const normalized = scope.trim().toLowerCase();
  return IDEMPOTENCY_SCOPE_PATTERN.test(normalized)
    ? normalized
    : 'request';
}

function randomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 14)}`;
}

export function createIdempotencyKey(scope = 'request') {
  return `gocart-${normalizeScope(scope)}-${randomId()}`;
}
