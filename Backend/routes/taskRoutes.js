const express = require("express");
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskPositions,
  archiveTask,
  addComment,
  addChecklistItem,
  toggleChecklistItem,
  getTaskStats,
} = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// Task statistics
router.get("/stats", getTaskStats);
router.get("/search", getTasks);

// Bulk update positions (for drag and drop)
router.post("/positions", updateTaskPositions);

// Main task routes
router.route("/").get(getTasks).post(createTask);

// Individual task routes
router.route("/:id").get(getTaskById).put(updateTask).delete(deleteTask);

// Archive task
router.put("/:id/archive", archiveTask);

// Comments
router.post("/:id/comments", addComment);

// Checklist
router.post("/:id/checklist", addChecklistItem);
router.put("/:id/checklist/:itemId/toggle", toggleChecklistItem);

module.exports = router;
