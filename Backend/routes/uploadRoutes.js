const express = require("express");
const router = express.Router();
const {
  uploadTaskAttachments,
  deleteAttachment,
  downloadAttachment,
  getAttachmentInfo,
} = require("../controllers/uploadController");
const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// Upload attachments to task
router.post("/task/:taskId", uploadTaskAttachments);

// Get attachment info
router.get("/task/:taskId/:attachmentId", getAttachmentInfo);

// Download attachment
router.get("/task/:taskId/:attachmentId/download", downloadAttachment);

// Delete attachment
router.delete("/task/:taskId/:attachmentId", deleteAttachment);

module.exports = router;