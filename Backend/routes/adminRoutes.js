// Backend/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAdminStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getPricing,
  updatePricing,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { adminProtect } = require("../middleware/adminMiddleware");

// All admin routes require authentication and superadmin authorization
router.use(protect);
router.use(adminProtect);

router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/pricing", getPricing);
router.put("/pricing", updatePricing);

module.exports = router;
