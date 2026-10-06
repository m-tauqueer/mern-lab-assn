const Product = require("../models/product.model");

const isObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

const presentWishlist = (customer) =>
  customer.wishlist
    .filter((product) => product && product._id)
    .map((product) => ({
      _id: product._id,
      name: product.name,
      price: product.price,
      category: product.category,
      image: product.image,
      stock: product.stock,
    }));

const loadWishlist = async (customer) => {
  await customer.populate({
    path: "wishlist",
    select: "name price category image stock",
  });

  return presentWishlist(customer);
};

const rejectId = (res) =>
  res.status(400).json({
    success: false,
    message: "Invalid product ID",
  });

const getWishlist = async (req, res) => {
  try {
    const wishlist = await loadWishlist(req.user);

    return res.status(200).json({
      success: true,
      count: wishlist.length,
      wishlist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const findSavedIndex = (customer, productId) =>
  customer.wishlist.findIndex((id) => id.toString() === productId);

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isObjectId(productId)) {
      return rejectId(res);
    }

    const product = await Product.findById(productId).select("_id");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const customer = req.user;

    if (findSavedIndex(customer, productId) !== -1) {
      return res.status(409).json({
        success: false,
        message: "Product is already in the wishlist",
      });
    }

    customer.wishlist.push(product._id);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isObjectId(productId)) {
      return rejectId(res);
    }

    const customer = req.user;
    const index = findSavedIndex(customer, productId);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Product is not in the wishlist",
      });
    }

    customer.wishlist.splice(index, 1);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isObjectId(productId)) {
      return rejectId(res);
    }

    const customer = req.user;
    const index = findSavedIndex(customer, productId);

    if (index === -1) {
      const product = await Product.findById(productId).select("_id");

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      customer.wishlist.push(product._id);
      await customer.save();

      return res.status(200).json({
        success: true,
        saved: true,
        message: "Product added to wishlist",
      });
    }

    customer.wishlist.splice(index, 1);
    await customer.save();

    return res.status(200).json({
      success: true,
      saved: false,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
};
