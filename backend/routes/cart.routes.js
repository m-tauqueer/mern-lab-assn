const express = require("express");
const { addToCart, getCart, updateQuantity, removeFromCart } = require("../controllers/cart.controller");
const protect = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);
router.post("/:productId", addToCart);
router.get("/", getCart);
router.patch("/:productId", updateQuantity);
router.delete("/:productId", removeFromCart);

module.exports = router;
