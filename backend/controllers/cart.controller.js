const Product = require("../models/product.model");

const isObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

const presentCart = (customer) =>
  customer.cart
    .filter((item) => item.product && item.product._id)
    .map((item) => ({
      product: {
        _id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image,
        stock: item.product.stock,
      },
      quantity: item.quantity,
    }));

const loadCart = async (customer) => {
  await customer.populate({
    path: "cart.product",
    select: "name price image stock",
  });

  return presentCart(customer);
};

const findCartItem = (customer, productId) =>
  customer.cart.find((item) => item.product.toString() === productId);

const rejectId = (res) =>
  res.status(400).json({
    success: false,
    message: "Invalid product ID",
  });

const sendCart = async (res, customer, status, message) => {
  await customer.save();
  const cart = await loadCart(customer);
  const body = { success: true, cart };

  if (message) {
    body.message = message;
  }

  return res.status(status).json(body);
};

const getCart = async (req, res) => {
  try {
    const cart = await loadCart(req.user);

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isObjectId(productId)) {
      return rejectId(res);
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const customer = req.user;
    const existing = findCartItem(customer, productId);
    const nextQuantity = existing ? existing.quantity + 1 : 1;

    if (nextQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: "Quantity exceeds available stock",
      });
    }

    if (existing) {
      existing.quantity = nextQuantity;
    } else {
      customer.cart.push({ product: product._id, quantity: 1 });
    }

    return sendCart(res, customer, 200, "Cart updated");
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body || {};

    if (!isObjectId(productId)) {
      return rejectId(res);
    }

    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a whole number of at least 1",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const customer = req.user;
    const existing = findCartItem(customer, productId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Product is not in the cart",
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: "Quantity exceeds available stock",
      });
    }

    existing.quantity = quantity;
    return sendCart(res, customer, 200, "Cart updated");
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isObjectId(productId)) {
      return rejectId(res);
    }

    const customer = req.user;
    const index = customer.cart.findIndex((item) => item.product.toString() === productId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Product is not in the cart",
      });
    }

    customer.cart.splice(index, 1);
    return sendCart(res, customer, 200, "Cart updated");
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
};
