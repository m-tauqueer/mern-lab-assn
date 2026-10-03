const Product = require("../models/product.model");

const catalogFields = "name price category image stock";

const isObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const readProductInput = (body) => {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const image = typeof body.image === "string" ? body.image.trim() : "";
  const { price, stock } = body;

  const missing =
    !name ||
    !description ||
    !category ||
    !image ||
    price === undefined ||
    price === null ||
    price === "" ||
    stock === undefined ||
    stock === null ||
    stock === "";

  if (missing) {
    return { error: "All fields are required" };
  }

  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    return { error: "Price must be greater than 0" };
  }

  if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0) {
    return { error: "Stock must be a whole number that is 0 or more" };
  }

  return {
    value: { name, description, price, category, image, stock },
  };
};

const createProduct = async (req, res) => {
  try {
    const input = readProductInput(req.body || {});

    if (input.error) {
      return res.status(400).json({
        success: false,
        message: input.error,
      });
    }

    const product = await Product.create(input.value);

    return res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const filter = {};
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";

    if (search) {
      filter.name = { $regex: escapeRegex(search), $options: "i" };
    }

    if (category) {
      filter.category = category;
    }

    let sort = { createdAt: -1 };

    if (req.query.sort === "price_asc") {
      sort = { price: 1, name: 1 };
    } else if (req.query.sort === "price_desc") {
      sort = { price: -1, name: 1 };
    }

    const products = await Product.find(filter).select(catalogFields).sort(sort);

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const getProduct = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
};
