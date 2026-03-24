const express = require("express");
const router = express.Router();
const {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getUpcoming,
  syncExternalCalendar,
} = require("../controllers/calendarController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.route("/").get(getEvents).post(createEvent);

router.get("/upcoming", getUpcoming);
router.post("/sync", syncExternalCalendar);

router.route("/:id").put(updateEvent).delete(deleteEvent);

module.exports = router;
