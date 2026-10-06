import api from "./api";

export async function createPaymentOrder(shippingAddress) {
  const response = await api.post("/orders/create-payment-order", { shippingAddress });
  return response.data;
}

export async function verifyPayment(payload) {
  const response = await api.post("/orders/verify-payment", payload);
  return response.data;
}

export async function fetchOrders() {
  const response = await api.get("/orders");
  return response.data;
}

export async function fetchOrder(id) {
  const response = await api.get(`/orders/${id}`);
  return response.data.order;
}
