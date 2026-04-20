const mongoose = require("mongoose");

const calendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isAllDay: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    location: String,
    color: {
      type: String,
      default: "#6366f1",
    },
    reminders: [
      {
        time: { type: Number, min: 0 }, // minutes before
        sent: { type: Boolean, default: false },
      },
    ],
    recurrence: {
      pattern: {
        type: String,
        enum: ["none", "daily", "weekly", "monthly", "yearly"],
        default: "none",
      },
      interval: Number,
      endDate: Date,
      occurrences: Number,
    },
    attachments: [
      {
        filename: String,
        url: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

calendarEventSchema.index({ user: 1, startDate: 1 });
calendarEventSchema.index({ project: 1, startDate: 1 });
calendarEventSchema.index({ task: 1 });

module.exports = mongoose.model("CalendarEvent", calendarEventSchema);