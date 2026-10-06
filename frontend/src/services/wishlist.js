import api from "./api";

export async function fetchWishlist() {
  const response = await api.get("/wishlist");
  return response.data;
}

export async function toggleWishlist(productId) {
  const response = await api.patch(`/wishlist/${productId}/toggle`);
  return response.data;
}

export async function removeWishlistItem(productId) {
  const response = await api.delete(`/wishlist/${productId}`);
  return response.data;
}
