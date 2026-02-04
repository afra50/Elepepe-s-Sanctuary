// backend/routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// POST /api/payments/create-checkout-session
router.post(
  "/create-checkout-session",
  paymentController.createCheckoutSession,
);

module.exports = router;
