export const CART_UPDATED_EVENT = 'cart:updated';

export function notifyCartUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
  }
}