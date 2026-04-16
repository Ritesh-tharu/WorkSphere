// Backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  updateProfile,
  changePassword,
  googleLogin,
  verifyOTP,
  resendOTP,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/signup", registerUser);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.put(
  "/update-profile",
  protect,
  upload.single("profilePhoto"),
  updateProfile,
);
router.put("/change-password", protect, changePassword);

module.exports = router;
