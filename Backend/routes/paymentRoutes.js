const express = require("express");
const router = express.Router();
const {
  initiatePayment,
  verifyPayment,
  checkPaymentStatus,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// Route to initiate payment (requires auth)
router.post("/initiate", protect, initiatePayment);

// Route to verify payment (called by frontend after eSewa redirect — public)
router.get("/verify", verifyPayment);

// Route to check payment status (fallback, requires auth)
router.get("/status/:transactionUuid", protect, checkPaymentStatus);

module.exports = router;