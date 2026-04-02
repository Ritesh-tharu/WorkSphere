const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const checklistItemSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  completedAt: Date,
});

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  editedAt: Date,
  attachments: [String],
});

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  action: String,
  details: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const labelSchema = new mongoose.Schema({
  text: String,
  color: String,
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    dueDate: {
      type: Date,
    },
    startDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
    estimatedHours: {
      type: Number,
      min: 0,
      default: 0,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    pendingAssigneeEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    labels: [labelSchema],
    checklist: [checklistItemSchema],
    attachments: [attachmentSchema], // Fixed: Using proper subschema
    comments: [commentSchema],
    activity: [activitySchema],
    watchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    coverImage: {
      type: String,
    },
    position: {
      type: Number,
      default: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    recurring: {
      isRecurring: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "custom"],
      },
      interval: Number,
      endDate: Date,
      nextOccurrence: Date,
    },
  },
  { timestamps: true },
);

// Indexes for better performance
taskSchema.index({ user: 1, status: 1, position: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ isArchived: 1 });

// Auto-update completedDate when status changes to completed
taskSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "completed" && !this.completedDate) {
      this.completedDate = new Date();
    } else if (this.status !== "completed") {
      this.completedDate = null;
    }
  }
  next();
});

module.exports = mongoose.model("Task", taskSchema);
