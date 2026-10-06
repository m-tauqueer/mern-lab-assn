const crypto = require("crypto");

const createRazorpayOrder = async ({ amount, receipt }) => {
  if (process.env.NODE_ENV === "test") {
    return {
      id: `order_test_${receipt}`,
      amount,
      currency: "INR",
    };
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const error = new Error("Razorpay test keys are not configured");
    error.statusCode = 503;
    throw error;
  }

  const Razorpay = require("razorpay");
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  return razorpay.orders.create({
    amount,
    currency: "INR",
    receipt,
  });
};

const signPayment = (orderId, paymentId) =>
  crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

const signaturesMatch = (expected, received) => {
  if (typeof received !== "string" || expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
};

module.exports = {
  createRazorpayOrder,
  signPayment,
  signaturesMatch,
};
