const express = require("express");
const router = express.Router();
const { initiatePayment, verifyPayment } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// Route to initiate payment
router.post("/initiate", protect, initiatePayment);

// Route to verify payment
router.get("/verify", verifyPayment);

module.exports = router;