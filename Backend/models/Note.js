const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Untitled Note",
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: "#ffffff", // Default to white or a neutral color
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    lastEditedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for performance
noteSchema.index({ user: 1, isPinned: -1, lastEditedAt: -1 });
noteSchema.index({ project: 1 });

module.exports = mongoose.model("Note", noteSchema);
