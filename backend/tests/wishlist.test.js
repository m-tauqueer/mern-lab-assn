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

describe("wishlist", { concurrency: false }, () => {
  test("rejects wishlist requests without a session", async () => {
    const response = await request(app).get("/wishlist");
    assert.equal(response.status, 401);
  });

  test("saves a product once and rejects a duplicate", async () => {
    const product = await Product.create({
      name: "Paperback Novel",
      description: "A pocket paperback.",
      price: 649,
      category: "Books",
      image: "https://example.com/novel.jpg",
      stock: 4,
    });
    const agent = await registerAndLogin("wish@shopkart.test");
    const added = await agent.post(`/wishlist/${product._id}`);
    const duplicate = await agent.post(`/wishlist/${product._id}`);
    const listed = await agent.get("/wishlist");

    assert.equal(added.status, 200);
    assert.equal(added.body.message, "Product added to wishlist");
    assert.equal(duplicate.status, 409);
    assert.equal(listed.body.count, 1);
    assert.equal(listed.body.wishlist[0].name, "Paperback Novel");
    assert.equal(Object.hasOwn(listed.body.wishlist[0], "description"), false);

    const stored = await Customer.findOne({ email: "wish@shopkart.test" });
    assert.equal(stored.wishlist.length, 1);
    assert.equal(Object.hasOwn(stored.wishlist[0].toObject?.() || {}, "price"), false);
  });

  test("toggles a product off and on, and keeps another customer's list separate", async () => {
    const product = await Product.findOne({ name: "Paperback Novel" });
    const owner = request.agent(app);
    await owner.post("/customers/login").send({ email: "wish@shopkart.test", password: "john123" });
    const other = await registerAndLogin("wish-other@shopkart.test");

    const removed = await owner.patch(`/wishlist/${product._id}/toggle`);
    const saved = await owner.patch(`/wishlist/${product._id}/toggle`);
    const otherList = await other.get("/wishlist");

    assert.equal(removed.body.saved, false);
    assert.equal(saved.body.saved, true);
    assert.equal(otherList.body.count, 0);
  });

  test("removes a saved product and rejects a missing one", async () => {
    const product = await Product.findOne({ name: "Paperback Novel" });
    const agent = request.agent(app);
    await agent.post("/customers/login").send({ email: "wish@shopkart.test", password: "john123" });

    const removed = await agent.delete(`/wishlist/${product._id}`);
    const missing = await agent.delete(`/wishlist/${product._id}`);
    const invalid = await agent.post("/wishlist/not-an-id");

    assert.equal(removed.status, 200);
    assert.equal(missing.status, 404);
    assert.equal(invalid.status, 400);
    assert.equal((await agent.get("/wishlist")).body.count, 0);
  });
});
