import assert from "node:assert/strict";
import test from "node:test";
import { validateShipping } from "../src/utils/validateShipping.js";

const complete = {
  fullName: "Amina Shah",
  phone: "9876543210",
  addressLine1: "22 MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
};

test("shipping accepts a complete address", () => {
  assert.deepEqual(validateShipping(complete), {});
});

test("shipping rejects a short pincode and a blank name", () => {
  const errors = validateShipping({ ...complete, fullName: " ", pincode: "5600" });
  assert.equal(errors.fullName, "Full name is required.");
  assert.equal(errors.pincode, "Pincode must contain 6 digits.");
});
