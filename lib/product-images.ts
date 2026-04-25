import { toAbsoluteMediaUrl } from '@/lib/env';

type StorefrontImageRecord = {
  hero_image?: unknown;
  image_urls?: unknown;
  image?: unknown;
  image_url?: unknown;
  thumbnail?: unknown;
  thumbnail_url?: unknown;
  featured_image?: unknown;
  featured_image_url?: unknown;
  photo?: unknown;
  photo_url?: unknown;
  product_image?: unknown;
  product_image_url?: unknown;
};

type CartImageRecord = StorefrontImageRecord & {
  product?: unknown;
  product_variant?: unknown;
  variant?: unknown;
};

function getFirstString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getPrimaryImageCandidate(value: unknown) {
  if (!value || typeof value !== 'object') return null;

  const record = value as StorefrontImageRecord;
  const imageUrls = Array.isArray(record.image_urls) ? record.image_urls : [];

  return (
    getFirstString(record.hero_image) ||
    imageUrls.map(getFirstString).find(Boolean) ||
    getFirstString(record.image) ||
    getFirstString(record.image_url) ||
    getFirstString(record.thumbnail) ||
    getFirstString(record.thumbnail_url) ||
    getFirstString(record.featured_image) ||
    getFirstString(record.featured_image_url) ||
    getFirstString(record.photo) ||
    getFirstString(record.photo_url) ||
    getFirstString(record.product_image) ||
    getFirstString(record.product_image_url) ||
    null
  );
}

export function resolveProductImage(value: unknown) {
  return toAbsoluteMediaUrl(getPrimaryImageCandidate(value));
}

export function resolveCartItemImage(value: unknown) {
  if (!value || typeof value !== 'object') return null;

  const item = value as CartImageRecord;
  const raw =
    getPrimaryImageCandidate(item.product_variant) ||
    getPrimaryImageCandidate(item.variant) ||
    getPrimaryImageCandidate(item.product) ||
    getPrimaryImageCandidate(
      (item.product_variant as { product?: unknown } | undefined)?.product
    ) ||
    getPrimaryImageCandidate((item.variant as { product?: unknown } | undefined)?.product) ||
    getPrimaryImageCandidate(item);

  return toAbsoluteMediaUrl(raw);
}
