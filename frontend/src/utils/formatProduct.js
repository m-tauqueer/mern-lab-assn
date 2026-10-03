export function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number.isInteger(price) ? 0 : 2,
  }).format(price);
}

export function stockLabel(stock) {
  if (stock === 0) {
    return "Out of stock";
  }

  if (stock === 1) {
    return "1 unit left";
  }

  return `${stock} units left`;
}
