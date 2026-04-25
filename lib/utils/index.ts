import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: Array<string | undefined | false | null>) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: string | number) {
  const num = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(num || 0);
}

export function getImage(productImage?: string | null, images?: string[]) {
  return productImage || images?.[0] || 'https://placehold.co/600x400?text=GoCart';
}
