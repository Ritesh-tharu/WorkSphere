const express = require("express");
const router = express.Router();
const noteController = require("../controllers/noteController");

// Use an auth middleware (assuming it exists based on other routes)
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// CRUD Endpoints
router.get("/", noteController.getNotes);
router.post("/", noteController.createNote);
router.put("/:id", noteController.updateNote);
router.delete("/:id", noteController.deleteNote);

// Specific actions or toggles
router.put("/:id/toggle-pin", noteController.togglePin);

module.exports = router;
