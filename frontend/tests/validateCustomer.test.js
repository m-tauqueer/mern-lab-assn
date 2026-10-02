import assert from "node:assert/strict";
import test from "node:test";
import { validateLogin, validateRegistration } from "../src/utils/validateCustomer.js";

test("registration requires every field", () => {
  const errors = validateRegistration({
    fullName: " ",
    email: "",
    password: "",
    phone: " ",
  });

  assert.equal(errors.fullName, "Full name is required.");
  assert.equal(errors.email, "Email is required.");
  assert.equal(errors.password, "Password is required.");
  assert.equal(errors.phone, "Phone number is required.");
});

test("registration rejects a short password", () => {
  const errors = validateRegistration({
    fullName: "John Doe",
    email: "john@gmail.com",
    password: "123",
    phone: "9876543210",
  });

  assert.equal(errors.password, "Password must contain at least 6 characters.");
});

test("registration accepts a complete form", () => {
  const errors = validateRegistration({
    fullName: "John Doe",
    email: "john@gmail.com",
    password: "john123",
    phone: "9876543210",
  });

  assert.deepEqual(errors, {});
});

test("login requires email and password", () => {
  const errors = validateLogin({ email: " ", password: "" });

  assert.equal(errors.email, "Email is required.");
  assert.equal(errors.password, "Password is required.");
  assert.deepEqual(validateLogin({ email: "john@gmail.com", password: "john123" }), {});
});
