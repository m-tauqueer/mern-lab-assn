import api from "./api";

export async function fetchCart() {
  const response = await api.get("/cart");
  return response.data;
}

export async function addCartItem(productId) {
  const response = await api.post(`/cart/${productId}`);
  return response.data;
}

export async function updateCartItem(productId, quantity) {
  const response = await api.patch(`/cart/${productId}`, { quantity });
  return response.data;
}

export async function removeCartItem(productId) {
  const response = await api.delete(`/cart/${productId}`);
  return response.data;
}
