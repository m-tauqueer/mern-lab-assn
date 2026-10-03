import api from "./api";

export async function fetchProducts({ search = "", category = "", sort = "" } = {}) {
  const params = {};
  const trimmedSearch = search.trim();

  if (trimmedSearch) {
    params.search = trimmedSearch;
  }

  if (category) {
    params.category = category;
  }

  if (sort) {
    params.sort = sort;
  }

  const response = await api.get("/products", { params });
  return response.data;
}

export async function fetchProduct(id) {
  const response = await api.get(`/products/${id}`);
  return response.data.product;
}
