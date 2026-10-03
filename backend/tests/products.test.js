const { after, before, describe, test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");

process.env.JWT_SECRET = "shopkart-test-secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";
process.env.CLIENT_URL = "http://localhost:5173";

const app = require("../app");
const Product = require("../models/product.model");

const keyboard = {
  name: "Mechanical Keyboard",
  description: "RGB mechanical keyboard with blue switches.",
  price: 2999,
  category: "Electronics",
  image: "https://example.com/keyboard.jpg",
  stock: 10,
};

const headphones = {
  name: "Noise Cancelling Headphones",
  description: "Wireless over-ear headphones.",
  price: 4999,
  category: "Electronics",
  image: "https://example.com/headphones.jpg",
  stock: 25,
};

const novel = {
  name: "Paperback Novel",
  description: "A pocket paperback.",
  price: 649,
  category: "Books",
  image: "https://example.com/novel.jpg",
  stock: 4,
};

before(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/shopkart_test");
  await Product.deleteMany({});
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("product catalog", { concurrency: false }, () => {
test("creates a product and stores createdAt", async () => {
  const response = await request(app).post("/products").send(keyboard);

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.product.name, keyboard.name);
  assert.equal(response.body.product.price, 2999);
  assert.equal(response.body.product.stock, 10);

  const stored = await Product.findById(response.body.product._id);
  assert.equal(stored.description, keyboard.description);
  assert.ok(stored.createdAt instanceof Date);
});

test("rejects a product when a required field is missing", async () => {
  const response = await request(app).post("/products").send({
    description: "Missing the name.",
    price: 100,
    category: "Electronics",
    image: "https://example.com/item.jpg",
    stock: 1,
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.message, "All fields are required");
});

test("rejects a price that is not greater than 0", async () => {
  const zero = await request(app).post("/products").send({ ...keyboard, price: 0 });
  const negative = await request(app).post("/products").send({ ...keyboard, price: -5 });
  const text = await request(app).post("/products").send({ ...keyboard, price: "2999" });

  assert.equal(zero.status, 400);
  assert.equal(negative.status, 400);
  assert.equal(text.status, 400);
  assert.equal(zero.body.message, "Price must be greater than 0");
});

test("rejects invalid stock and accepts zero", async () => {
  const negative = await request(app).post("/products").send({ ...keyboard, name: "Bad Stock", stock: -1 });
  const fraction = await request(app).post("/products").send({ ...keyboard, name: "Half Stock", stock: 1.5 });
  const empty = await request(app).post("/products").send({
    ...keyboard,
    name: "Empty Shelf",
    stock: 0,
  });

  assert.equal(negative.status, 400);
  assert.equal(fraction.status, 400);
  assert.equal(empty.status, 201);
  assert.equal(empty.body.product.stock, 0);
});

test("lists catalog fields and hides the description", async () => {
  await Product.deleteMany({});
  await Product.create(keyboard);

  const response = await request(app).get("/products");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.count, 1);
  assert.equal(response.body.products[0].name, keyboard.name);
  assert.equal(Object.hasOwn(response.body.products[0], "description"), false);
  assert.equal(Object.hasOwn(response.body.products[0], "image"), true);
});

test("searches product names without case sensitivity", async () => {
  await Product.deleteMany({});
  await Product.create([keyboard, novel]);

  const response = await request(app).get("/products").query({ search: "KEYBOARD" });

  assert.equal(response.status, 200);
  assert.equal(response.body.count, 1);
  assert.equal(response.body.products[0].name, "Mechanical Keyboard");
});

test("filters by category and combines the filter with search", async () => {
  await Product.deleteMany({});
  await Product.create([keyboard, headphones, novel]);

  const electronics = await request(app).get("/products").query({ category: "Electronics" });
  const combined = await request(app).get("/products").query({
    search: "keyboard",
    category: "Electronics",
  });
  const missed = await request(app).get("/products").query({
    search: "keyboard",
    category: "Books",
  });

  assert.equal(electronics.body.count, 2);
  assert.equal(combined.body.count, 1);
  assert.equal(combined.body.products[0].name, "Mechanical Keyboard");
  assert.equal(missed.body.count, 0);
  assert.deepEqual(missed.body.products, []);
});

test("treats search text as plain text", async () => {
  await Product.deleteMany({});
  await Product.create(keyboard);

  const response = await request(app).get("/products").query({ search: "key(" });

  assert.equal(response.status, 200);
  assert.equal(response.body.count, 0);
});

test("sorts by price ascending and descending", async () => {
  await Product.deleteMany({});
  await Product.create([keyboard, headphones, novel]);

  const ascending = await request(app).get("/products").query({ sort: "price_asc" });
  const descending = await request(app).get("/products").query({ sort: "price_desc" });

  assert.deepEqual(
    ascending.body.products.map((product) => product.price),
    [649, 2999, 4999]
  );
  assert.deepEqual(
    descending.body.products.map((product) => product.price),
    [4999, 2999, 649]
  );
});

test("returns one product with its description", async () => {
  const created = await Product.create(headphones);
  const response = await request(app).get(`/products/${created._id}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.product.name, headphones.name);
  assert.equal(response.body.product.description, headphones.description);
});

test("rejects an invalid product id and a missing product", async () => {
  const invalid = await request(app).get("/products/not-a-real-id");
  const missing = await request(app).get("/products/66d123abc4567890abc45678");

  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.message, "Invalid product ID");
  assert.equal(missing.status, 404);
  assert.equal(missing.body.message, "Product not found");
});
});
