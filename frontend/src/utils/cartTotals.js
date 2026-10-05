export function cartItemCount(cart) {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartSubtotal(cart) {
  return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}
