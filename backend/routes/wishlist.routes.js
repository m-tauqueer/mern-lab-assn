const express = require("express");
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
} = require("../controllers/wishlist.controller");
const protect = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);
router.get("/", getWishlist);
router.post("/:productId", addToWishlist);
router.patch("/:productId/toggle", toggleWishlist);
router.delete("/:productId", removeFromWishlist);

module.exports = router;
