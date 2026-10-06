const Customer = require("../models/customer.model");
const Order = require("../models/order.model");
const { readShippingAddress } = require("../utils/shipping");
const { createRazorpayOrder, signPayment, signaturesMatch } = require("../utils/razorpay");

const isObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

const presentOrder = (order) => ({
  _id: order._id,
  items: order.items.map((item) => ({
    product: item.product,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: item.quantity,
  })),
  shippingAddress: order.shippingAddress,
  totalAmount: order.totalAmount,
  paymentStatus: order.paymentStatus,
  status: order.status,
  razorpayOrderId: order.razorpayOrderId,
  razorpayPaymentId: order.razorpayPaymentId,
  createdAt: order.createdAt,
});

const createPaymentOrder = async (req, res) => {
  try {
    const shipping = readShippingAddress(req.body || {});

    if (shipping.error) {
      return res.status(400).json({
        success: false,
        message: shipping.error,
      });
    }

    const customer = await Customer.findById(req.user._id);

    if (!customer.cart.length) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    await customer.populate({
      path: "cart.product",
      select: "name price image stock",
    });

    const items = [];

    for (const entry of customer.cart) {
      const product = entry.product;

      if (!product || !product._id) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart is no longer available",
        });
      }

      if (entry.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: entry.quantity,
      });
    }

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await Order.create({
      customer: customer._id,
      items,
      shippingAddress: shipping.value,
      totalAmount,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    try {
      const razorpayOrder = await createRazorpayOrder({
        amount: totalAmount * 100,
        receipt: `sk_${order._id}`,
      });

      order.razorpayOrderId = razorpayOrder.id;
      await order.save();

      return res.status(201).json({
        success: true,
        key: process.env.RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: "INR",
        shopKartOrderId: order._id,
        razorpayOrderId: razorpayOrder.id,
        order: presentOrder(order),
      });
    } catch (error) {
      await Order.deleteOne({ _id: order._id });

      return res.status(error.statusCode || 502).json({
        success: false,
        message: error.statusCode === 503 ? error.message : "Payment could not be started",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { shopKartOrderId, razorpay_order_id: razorpayOrderId, razorpay_payment_id: paymentId, razorpay_signature: signature } =
      req.body || {};

    if (!isObjectId(shopKartOrderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: shopKartOrderId,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        order: presentOrder(order),
      });
    }

    const expected = signPayment(order.razorpayOrderId, paymentId);
    const matches =
      razorpayOrderId === order.razorpayOrderId &&
      typeof paymentId === "string" &&
      paymentId &&
      signaturesMatch(expected, signature);

    if (!matches) {
      order.paymentStatus = "FAILED";
      await order.save();

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = paymentId;
    await order.save();

    await Customer.updateOne({ _id: req.user._id }, { $set: { cart: [] } });

    return res.status(200).json({
      success: true,
      message: "Payment verified",
      order: presentOrder(order),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders: orders.map(presentOrder),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const getOrder = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order: presentOrder(order),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getOrders,
  getOrder,
};
