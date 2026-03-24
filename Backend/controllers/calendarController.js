const CalendarEvent = require("../models/CalendarEvent");
const Task = require("../models/Task");
const Project = require("../models/Project");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");

// Get all calendar events for date range
exports.getEvents = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    const query = {
      user: userId,
      $or: [
        {
          startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
        {
          endDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      ],
    };

    const events = await CalendarEvent.find(query)
      .populate("project", "name color")
      .populate("task", "title status")
      .populate("attendees", "name email")
      .sort({ startDate: 1 });

    // Also get tasks with due dates
    const tasks = await Task.find({
      user: userId,
      dueDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
    })
      .populate("project", "name color")
      .select("title dueDate priority status project");

    // Format tasks as events
    const taskEvents = tasks.map((task) => ({
      _id: `task-${task._id}`,
      title: task.title,
      startDate: task.dueDate,
      endDate: task.dueDate,
      isAllDay: true,
      type: "task",
      color: task.project?.color || "#10b981",
      project: task.project,
      task: task,
      priority: task.priority,
      status: task.status,
    }));

    res.json([...events, ...taskEvents]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create calendar event
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      isAllDay,
      project,
      task,
      attendees,
      location,
      color,
      reminders,
      recurrence,
    } = req.body;

    const event = new CalendarEvent({
      title,
      description,
      startDate,
      endDate,
      isAllDay,
      user: req.user.id,
      project,
      task,
      attendees,
      location,
      color,
      reminders,
      recurrence,
      createdBy: req.user.id,
    });

    await event.save();

    // Send notifications to attendees
    if (attendees && attendees.length > 0) {
      attendees.forEach(async (attendeeId) => {
        await Notification.create({
          user: attendeeId,
          title: "New Calendar Event",
          message: `You've been invited to: ${title}`,
          type: "reminder",
          metadata: { eventId: event._id },
        });
      });
    }

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update event
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await CalendarEvent.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    Object.assign(event, req.body);
    await event.save();

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await CalendarEvent.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ message: "Event deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get upcoming events/reminders
exports.getUpcoming = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const events = await CalendarEvent.find({
      user: userId,
      startDate: { $gte: now, $lte: nextWeek },
    })
      .sort({ startDate: 1 })
      .limit(10);

    const tasks = await Task.find({
      user: userId,
      dueDate: { $gte: now, $lte: nextWeek },
      status: { $ne: "completed" },
    })
      .sort({ dueDate: 1 })
      .limit(10);

    res.json({
      events,
      tasks,
      count: events.length + tasks.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sync with external calendar (Google Calendar, etc.)
exports.syncExternalCalendar = async (req, res) => {
  try {
    const { provider, token } = req.body;
    const userId = req.user.id;

    // This would integrate with Google Calendar API, etc.
    // For now, return a placeholder
    res.json({
      message: `Sync with ${provider} initiated`,
      status: "processing",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
