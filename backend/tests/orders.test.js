const { after, before, describe, test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");

process.env.JWT_SECRET = "shopkart-test-secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.RAZORPAY_KEY_ID = "rzp_test_shopkart";
process.env.RAZORPAY_KEY_SECRET = "test-secret";

const app = require("../app");
const Customer = require("../models/customer.model");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const { signPayment } = require("../utils/razorpay");

const shippingAddress = {
  fullName: "Amina Shah",
  phone: "9876543210",
  addressLine1: "22 MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
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
  await Order.deleteMany({});
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("orders", { concurrency: false }, () => {
  test("rejects an order when the cart is empty or the address is incomplete", async () => {
    const agent = await registerAndLogin("order@shopkart.test");
    const empty = await agent.post("/orders/create-payment-order").send({ shippingAddress });
    const badPin = await agent.post("/orders/create-payment-order").send({
      shippingAddress: { ...shippingAddress, pincode: "5600" },
    });

    assert.equal(empty.status, 400);
    assert.equal(empty.body.message, "Your cart is empty");
    assert.equal(badPin.status, 400);
    assert.equal(badPin.body.message, "Pincode must contain 6 digits");
  });

  test("prices the order on the server and leaves the cart until payment is verified", async () => {
    const product = await Product.create({
      name: "Mechanical Keyboard",
      description: "RGB mechanical keyboard.",
      price: 2999,
      category: "Electronics",
      image: "https://example.com/keyboard.jpg",
      stock: 2,
    });
    const agent = request.agent(app);
    await agent.post("/customers/login").send({ email: "order@shopkart.test", password: "john123" });
    await agent.post(`/cart/${product._id}`);
    await agent.post(`/cart/${product._id}`);

    const created = await agent.post("/orders/create-payment-order").send({
      shippingAddress,
      totalAmount: 1,
    });
    const cart = await agent.get("/cart");

    assert.equal(created.status, 201);
    assert.equal(created.body.order.totalAmount, 5998);
    assert.equal(created.body.amount, 599800);
    assert.equal(created.body.currency, "INR");
    assert.equal(created.body.key, "rzp_test_shopkart");
    assert.equal(Object.hasOwn(created.body, "key_secret"), false);
    assert.equal(JSON.stringify(created.body).includes("test-secret"), false);
    assert.equal(created.body.order.items[0].price, 2999);
    assert.equal(created.body.order.items[0].quantity, 2);
    assert.equal(created.body.order.status, "PENDING_PAYMENT");
    assert.equal(cart.body.cart[0].quantity, 2);

    product.price = 3499;
    await product.save();
    const stored = await Order.findById(created.body.shopKartOrderId);
    assert.equal(stored.items[0].price, 2999);
  });

  test("keeps the cart when the signature is wrong and clears it after a valid payment", async () => {
    const agent = request.agent(app);
    await agent.post("/customers/login").send({ email: "order@shopkart.test", password: "john123" });
    const pending = await Order.findOne({ customer: (await Customer.findOne({ email: "order@shopkart.test" }))._id });

    const forged = await agent.post("/orders/verify-payment").send({
      shopKartOrderId: pending._id.toString(),
      razorpay_order_id: pending.razorpayOrderId,
      razorpay_payment_id: "pay_test_1",
      razorpay_signature: "not-the-signature",
    });
    const stillThere = await agent.get("/cart");

    assert.equal(forged.status, 400);
    assert.equal(forged.body.message, "Invalid payment signature");
    assert.equal(stillThere.body.cart.length, 1);

    const signature = signPayment(pending.razorpayOrderId, "pay_test_1");
    const verified = await agent.post("/orders/verify-payment").send({
      shopKartOrderId: pending._id.toString(),
      razorpay_order_id: pending.razorpayOrderId,
      razorpay_payment_id: "pay_test_1",
      razorpay_signature: signature,
    });
    const cleared = await agent.get("/cart");
    const orders = await agent.get("/orders");

    assert.equal(verified.status, 200);
    assert.equal(verified.body.order.status, "PLACED");
    assert.equal(verified.body.order.paymentStatus, "PAID");
    assert.deepEqual(cleared.body.cart, []);
    assert.equal(orders.body.orders.length, 1);
    assert.equal(orders.body.orders[0].items[0].name, "Mechanical Keyboard");
  });

  test("hides an order from a different customer", async () => {
    const owner = request.agent(app);
    await owner.post("/customers/login").send({ email: "order@shopkart.test", password: "john123" });
    const orderId = (await owner.get("/orders")).body.orders[0]._id;
    const other = await registerAndLogin("order-other@shopkart.test");
    const hidden = await other.get(`/orders/${orderId}`);
    const ownList = await other.get("/orders");
    const lowStock = await Product.findOne({ name: "Mechanical Keyboard" });
    lowStock.stock = 5;
    await lowStock.save();
    await other.post(`/cart/${lowStock._id}`);
    await other.post(`/cart/${lowStock._id}`);
    lowStock.stock = 1;
    await lowStock.save();
    const rejected = await other.post("/orders/create-payment-order").send({ shippingAddress });

    assert.equal(hidden.status, 404);
    assert.equal(ownList.body.orders.length, 0);
    assert.equal(rejected.status, 400);
    assert.match(rejected.body.message, /Insufficient stock/);
  });
});
