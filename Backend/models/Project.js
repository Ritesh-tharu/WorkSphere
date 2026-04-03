const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
    },
    color: {
      type: String,
      default: "#6366f1", // Primary accent color
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["active", "archived", "completed"],
      default: "active",
    },
    startDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    settings: {
      isPublic: { type: Boolean, default: false },
      allowComments: { type: Boolean, default: true },
      defaultTaskPriority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium",
      },
    },
    columns: [
      { id: { type: String, default: "todo" }, name: { type: String, default: "To Do" }, position: { type: Number, default: 0 } },
      { id: { type: String, default: "doing" }, name: { type: String, default: "Doing" }, position: { type: Number, default: 1 } },
      { id: { type: String, default: "completed" }, name: { type: String, default: "Done" }, position: { type: Number, default: 2 } },
    ],
  },
  { timestamps: true },
);

// Indexes for better query performance
projectSchema.index({ owner: 1, status: 1 });
projectSchema.index({ teamMembers: 1 });

module.exports = mongoose.model("Project", projectSchema);
