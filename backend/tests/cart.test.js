const { after, before, describe, test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");

process.env.JWT_SECRET = "shopkart-test-secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";
process.env.CLIENT_URL = "http://localhost:5173";

const app = require("../app");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

const keyboard = {
  name: "Mechanical Keyboard",
  description: "RGB mechanical keyboard with blue switches.",
  price: 2999,
  category: "Electronics",
  image: "https://example.com/keyboard.jpg",
  stock: 2,
};

const mouse = {
  name: "Wireless Mouse",
  description: "Compact wireless mouse.",
  price: 899,
  category: "Electronics",
  image: "https://example.com/mouse.jpg",
  stock: 0,
};

async function registerAndLogin(email) {
  const agent = request.agent(app);
  await agent.post("/customers/register").send({
    fullName: "Amina Shah",
    email,
    password: "john123",
    phone: "9876543210",
  });
  await agent.post("/customers/login").send({ email, password: "john123" });
  return agent;
}

before(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/shopkart_test");
  await Customer.deleteMany({});
  await Product.deleteMany({});
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("shopping cart", { concurrency: false }, () => {
  test("rejects cart requests without a session", async () => {
    const missing = await request(app).get("/cart");
    const add = await request(app).post("/cart/66d123abc4567890abc45678");
    const update = await request(app).patch("/cart/66d123abc4567890abc45678").send({ quantity: 1 });
    const remove = await request(app).delete("/cart/66d123abc4567890abc45678");

    assert.equal(missing.status, 401);
    assert.equal(add.status, 401);
    assert.equal(update.status, 401);
    assert.equal(remove.status, 401);
  });

  test("adds a product once, then increments the same row", async () => {
    const product = await Product.create(keyboard);
    const agent = await registerAndLogin("cart-add@shopkart.test");

    const first = await agent.post(`/cart/${product._id}`);
    assert.equal(first.status, 200);
    assert.equal(first.body.message, "Cart updated");
    assert.equal(first.body.cart.length, 1);
    assert.equal(first.body.cart[0].quantity, 1);
    assert.equal(first.body.cart[0].product.name, "Mechanical Keyboard");
    assert.equal(first.body.cart[0].product.price, 2999);
    assert.equal(Object.hasOwn(first.body.cart[0], "price"), false);

    const second = await agent.post(`/cart/${product._id}`);
    assert.equal(second.status, 200);
    assert.equal(second.body.cart.length, 1);
    assert.equal(second.body.cart[0].quantity, 2);

    const stored = await Customer.findOne({ email: "cart-add@shopkart.test" });
    assert.equal(stored.cart.length, 1);
    assert.equal(stored.cart[0].quantity, 2);
    assert.equal(Object.hasOwn(stored.cart[0].toObject(), "price"), false);
  });

  test("rejects a missing product, a bad id, and stock that is too low", async () => {
    const empty = await Product.create(mouse);
    const limited = await Product.create({ ...keyboard, name: "Limited Keyboard", stock: 1 });
    const agent = await registerAndLogin("cart-stock@shopkart.test");

    const invalid = await agent.post("/cart/not-a-real-id");
    const missing = await agent.post("/cart/66d123abc4567890abc45678");
    const soldOut = await agent.post(`/cart/${empty._id}`);
    const added = await agent.post(`/cart/${limited._id}`);
    const overstock = await agent.post(`/cart/${limited._id}`);

    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.message, "Invalid product ID");
    assert.equal(missing.status, 404);
    assert.equal(missing.body.message, "Product not found");
    assert.equal(soldOut.status, 400);
    assert.equal(soldOut.body.message, "Quantity exceeds available stock");
    assert.equal(added.status, 200);
    assert.equal(overstock.status, 400);
    assert.equal((await Customer.findOne({ email: "cart-stock@shopkart.test" })).cart[0].quantity, 1);
  });

  test("returns the latest product price and keeps carts separate", async () => {
    const product = await Product.findOne({ name: "Mechanical Keyboard" });
    const owner = request.agent(app);
    await owner.post("/customers/login").send({
      email: "cart-add@shopkart.test",
      password: "john123",
    });
    const other = await registerAndLogin("cart-other@shopkart.test");

    product.price = 2599;
    await product.save();

    const cart = await owner.get("/cart");
    const otherCart = await other.get("/cart");

    assert.equal(cart.status, 200);
    assert.equal(cart.body.cart[0].product.price, 2599);
    assert.equal(cart.body.cart[0].quantity, 2);
    assert.deepEqual(otherCart.body.cart, []);
  });

  test("updates quantity inside the stock limit", async () => {
    const product = await Product.findOne({ name: "Mechanical Keyboard" });
    const agent = request.agent(app);
    await agent.post("/customers/login").send({
      email: "cart-add@shopkart.test",
      password: "john123",
    });

    const updated = await agent.patch(`/cart/${product._id}`).send({ quantity: 1 });
    const tooLow = await agent.patch(`/cart/${product._id}`).send({ quantity: 0 });
    const fraction = await agent.patch(`/cart/${product._id}`).send({ quantity: 1.5 });
    const tooHigh = await agent.patch(`/cart/${product._id}`).send({ quantity: 3 });
    const absent = await agent.patch(`/cart/${(await Product.create({ ...mouse, name: "Spare Mouse", stock: 4 }))._id}`).send({
      quantity: 1,
    });

    assert.equal(updated.status, 200);
    assert.equal(updated.body.cart[0].quantity, 1);
    assert.equal(tooLow.status, 400);
    assert.equal(fraction.status, 400);
    assert.equal(tooHigh.status, 400);
    assert.equal(tooHigh.body.message, "Quantity exceeds available stock");
    assert.equal(absent.status, 404);
    assert.equal(absent.body.message, "Product is not in the cart");
  });

  test("removes one product and keeps the other", async () => {
    const keyboardProduct = await Product.findOne({ name: "Mechanical Keyboard" });
    const novel = await Product.create({
      name: "Paperback Novel",
      description: "A pocket paperback.",
      price: 649,
      category: "Books",
      image: "https://example.com/novel.jpg",
      stock: 4,
    });
    const agent = request.agent(app);
    await agent.post("/customers/login").send({
      email: "cart-add@shopkart.test",
      password: "john123",
    });
    await agent.post(`/cart/${novel._id}`);

    const removed = await agent.delete(`/cart/${keyboardProduct._id}`);
    const missing = await agent.delete(`/cart/${keyboardProduct._id}`);

    assert.equal(removed.status, 200);
    assert.equal(removed.body.cart.length, 1);
    assert.equal(removed.body.cart[0].product.name, "Paperback Novel");
    assert.equal(missing.status, 404);
  });

  test("an older account with no cart field still loads an empty cart", async () => {
    await Customer.collection.insertOne({
      fullName: "Old Account",
      email: "old-cart@shopkart.test",
      password: "$2b$10$012345678901234567890u",
      phone: "9876543210",
      createdAt: new Date(),
    });

    const created = await Customer.findOne({ email: "old-cart@shopkart.test" });
    assert.deepEqual(created.cart, []);
  });
});
