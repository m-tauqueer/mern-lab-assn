const { before, after, test } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const request = require("supertest");

process.env.JWT_SECRET = "shopkart-test-secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";
process.env.CLIENT_URL = "http://localhost:5173";

const app = require("../app");
const Customer = require("../models/customer.model");

const customerInput = {
  fullName: "John Doe",
  email: "john@shopkart.test",
  password: "john123",
  phone: "9876543210",
};

before(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/shopkart_test");
  await Customer.deleteMany({});
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("rejects registration when a field is missing", async () => {
  const response = await request(app).post("/customers/register").send({
    fullName: "John Doe",
    email: "missing@shopkart.test",
    password: "john123",
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
});

test("rejects a password shorter than 6 characters", async () => {
  const response = await request(app).post("/customers/register").send({
    ...customerInput,
    email: "short@shopkart.test",
    password: "12345",
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Password must contain at least 6 characters");
});

test("registers a customer and stores a bcrypt hash", async () => {
  const response = await request(app).post("/customers/register").send(customerInput);

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.message, "Customer registered successfully");
  assert.equal(response.body.customer.email, "john@shopkart.test");
  assert.equal(Object.hasOwn(response.body.customer, "password"), false);
  assert.equal(JSON.stringify(response.body).includes(customerInput.password), false);

  const stored = await Customer.findOne({ email: customerInput.email }).select("+password");
  assert.ok(stored.createdAt instanceof Date);
  assert.notEqual(stored.password, customerInput.password);
  assert.match(stored.password, /^\$2[aby]\$/);
  assert.equal(await bcrypt.compare(customerInput.password, stored.password), true);
});

test("rejects a duplicate email without revealing a new account", async () => {
  const response = await request(app).post("/customers/register").send({
    ...customerInput,
    email: "JOHN@shopkart.test",
  });

  assert.equal(response.status, 409);
  assert.equal(response.body.message, "Email already exists");
  assert.equal(await Customer.countDocuments({ email: "john@shopkart.test" }), 1);
});

test("uses the same error for a bad email and a bad password", async () => {
  const unknownEmail = await request(app).post("/customers/login").send({
    email: "nobody@shopkart.test",
    password: "john123",
  });
  const wrongPassword = await request(app).post("/customers/login").send({
    email: customerInput.email,
    password: "wrongpass",
  });

  assert.equal(unknownEmail.status, 401);
  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownEmail.body.message, "Invalid credentials");
  assert.equal(wrongPassword.body.message, "Invalid credentials");
  assert.equal(unknownEmail.headers["set-cookie"], undefined);
});

test("login sets an HttpOnly cookie and profile hides the password", async () => {
  const agent = request.agent(app);
  const loginResponse = await agent.post("/customers/login").send({
    email: "John@Shopkart.test",
    password: customerInput.password,
  });

  assert.equal(loginResponse.status, 200);
  assert.equal(loginResponse.body.message, "Login successful");
  assert.equal(Object.hasOwn(loginResponse.body.customer, "password"), false);

  const cookie = loginResponse.headers["set-cookie"].join(";");
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /token=/);
  assert.equal(cookie.includes(customerInput.password), false);

  const profile = await agent.get("/customers/me");
  assert.equal(profile.status, 200);
  assert.equal(profile.body.fullName, "John Doe");
  assert.equal(profile.body.email, "john@shopkart.test");
  assert.equal(profile.body.phone, "9876543210");
  assert.equal(Object.hasOwn(profile.body, "password"), false);
});

test("profile and logout reject a missing or invalid token", async () => {
  const missing = await request(app).get("/customers/me");
  const invalid = await request(app).get("/customers/me").set("Cookie", "token=not-a-jwt");
  const logout = await request(app).post("/customers/logout");

  assert.equal(missing.status, 401);
  assert.equal(invalid.status, 401);
  assert.equal(logout.status, 401);
});

test("logout clears the cookie", async () => {
  const agent = request.agent(app);
  await agent.post("/customers/login").send({
    email: customerInput.email,
    password: customerInput.password,
  });

  const logoutResponse = await agent.post("/customers/logout");
  assert.equal(logoutResponse.status, 200);
  assert.equal(logoutResponse.body.message, "Logged out successfully");

  const cookie = logoutResponse.headers["set-cookie"].join(";");
  assert.match(cookie, /token=/);
  assert.match(cookie, /HttpOnly/i);

  const profile = await agent.get("/customers/me");
  assert.equal(profile.status, 401);
});

test("change password checks the old password and stores a new hash", async () => {
  const agent = request.agent(app);
  await agent.post("/customers/login").send({
    email: customerInput.email,
    password: customerInput.password,
  });

  const wrongOld = await agent.patch("/customers/change-password").send({
    oldPassword: "wrongpass",
    newPassword: "john456",
  });
  assert.equal(wrongOld.status, 401);

  const tooShort = await agent.patch("/customers/change-password").send({
    oldPassword: customerInput.password,
    newPassword: "123",
  });
  assert.equal(tooShort.status, 400);

  const changed = await agent.patch("/customers/change-password").send({
    oldPassword: customerInput.password,
    newPassword: "john456",
  });
  assert.equal(changed.status, 200);
  assert.equal(JSON.stringify(changed.body).includes("john456"), false);

  const stored = await Customer.findOne({ email: customerInput.email }).select("+password");
  assert.match(stored.password, /^\$2[aby]\$/);
  assert.equal(await bcrypt.compare("john123", stored.password), false);
  assert.equal(await bcrypt.compare("john456", stored.password), true);

  const oldLogin = await request(app).post("/customers/login").send({
    email: customerInput.email,
    password: "john123",
  });
  const newLogin = await request(app).post("/customers/login").send({
    email: customerInput.email,
    password: "john456",
  });

  assert.equal(oldLogin.status, 401);
  assert.equal(newLogin.status, 200);
});
