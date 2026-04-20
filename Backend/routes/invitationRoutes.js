// Backend/routes/invitationRoutes.js
const express = require("express");
const router = express.Router();
const {
  sendInvite,
  acceptInvite,
  getInvitations,
  getTeamMembers,
  cancelInvite,
  removeMember,
} = require("../controllers/invitationController");
const { protect } = require("../middleware/authMiddleware");

router.post("/send", protect, sendInvite);
router.get("/accept/:token", acceptInvite);
router.get("/list", protect, getInvitations);
router.get("/team", protect, getTeamMembers);
router.delete("/team/:id", protect, removeMember);
router.delete("/:id", protect, cancelInvite);

module.exports = router;