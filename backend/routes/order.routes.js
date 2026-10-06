const express = require("express");
const { createPaymentOrder, verifyPayment, getOrders, getOrder } = require("../controllers/order.controller");
const protect = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);
router.post("/create-payment-order", createPaymentOrder);
router.post("/verify-payment", verifyPayment);
router.get("/", getOrders);
router.get("/:id", getOrder);

module.exports = router;
