const express = require("express");
const router = express.Router();
const {
  getProductivityReport,
  getForecast,
  exportData,
} = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/productivity", getProductivityReport);
router.get("/forecast", getForecast);
router.get("/export", exportData);

module.exports = router;