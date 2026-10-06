const listeners = new Set();

export function onWishlistChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitWishlistChange() {
  listeners.forEach((listener) => listener());
}
