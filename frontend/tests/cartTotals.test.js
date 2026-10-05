import assert from "node:assert/strict";
import test from "node:test";
import { cartItemCount, cartSubtotal } from "../src/utils/cartTotals.js";

const cart = [
  { product: { price: 2999 }, quantity: 2 },
  { product: { price: 899 }, quantity: 1 },
];

test("counts units rather than rows", () => {
  assert.equal(cartItemCount(cart), 3);
  assert.equal(cartItemCount([]), 0);
});

test("derives the subtotal from the current price and quantity", () => {
  assert.equal(cartSubtotal(cart), 6897);
  assert.equal(cartSubtotal([]), 0);
});
