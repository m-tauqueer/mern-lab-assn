import assert from "node:assert/strict";
import test from "node:test";
import { formatPrice, stockLabel } from "../src/utils/formatProduct.js";

test("formats rupee prices for the catalog", () => {
  assert.equal(formatPrice(2999), "₹2,999");
  assert.equal(formatPrice(649.5), "₹649.50");
});

test("describes remaining stock", () => {
  assert.equal(stockLabel(0), "Out of stock");
  assert.equal(stockLabel(1), "1 unit left");
  assert.equal(stockLabel(10), "10 units left");
});
