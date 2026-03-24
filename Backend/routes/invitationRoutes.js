// Backend/routes/invitationRoutes.js
const express = require("express");
const router = express.Router();
const {
  sendInvite,
  acceptInvite,
  getInvitations,
  getTeamMembers,
} = require("../controllers/invitationController");
const { protect } = require("../middleware/authMiddleware");

router.post("/send", protect, sendInvite);
router.get("/accept/:token", acceptInvite);
router.get("/list", protect, getInvitations);
router.get("/team", protect, getTeamMembers);

module.exports = router;
