const Task = require("../models/Task");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Invitation = require("../models/Invitation");
const Project = require("../models/Project");
const CalendarEvent = require("../models/CalendarEvent");
const { sendInvitationEmail } = require("../config/emailService");
const crypto = require("crypto");
const mongoose = require("mongoose");
 
// Helper to resolve assignee from ID or Email
const resolveAssignee = async (assignedTo, inviterId) => {
  if (!assignedTo) return { assignedTo: null, pendingAssigneeEmail: null };

  // Check if it's a valid MongoDB ID
  if (mongoose.Types.ObjectId.isValid(assignedTo)) {
    return { assignedTo: assignedTo, pendingAssigneeEmail: null };
  }

  // Treat as email - validate format first
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(assignedTo)) {
    return { assignedTo: null, pendingAssigneeEmail: null };
  }

  const email = assignedTo.toLowerCase();
  const user = await User.findOne({ email });
  if (user) {
    return { assignedTo: user._id, pendingAssigneeEmail: null };
  }

  // Handle Invitation for new user
  try {
    const existingInvite = await Invitation.findOne({ email, status: "pending" });
    if (!existingInvite) {
      const token = crypto.randomBytes(32).toString("hex");
      const inviter = await User.findById(inviterId);
      
      await Invitation.create({
        email,
        invitedBy: inviterId,
        token,
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // Async email sending (don't block task creation)
      sendInvitationEmail(email, token, inviter?.name || "A team member").catch(err => 
        console.error("Secondary invitation email failed:", err)
      );
    }
  } catch (err) {
    console.error("Failed to handle automated invitation:", err);
  }

  return { assignedTo: null, pendingAssigneeEmail: email };
};

// Get all tasks for user with filters
exports.getTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, project, assignedTo, priority, search, archived, limit, dueDate, tags } =
      req.query;

    // First identify all projects the user has access to
    const userProjects = await Project.find({
      $or: [{ owner: userId }, { teamMembers: userId }]
    }).distinct("_id");

    let query = { isArchived: archived === "true" };

    if (status) {
      query.status = status.includes(",") ? { $in: status.split(",") } : status;
    }
    
    // Improved Project/Access Filtering
    if (project && project !== "all") {
      if (project === "null" || project === "undefined") {
        query.project = null;
        query.user = userId; // Global tasks are private to the creator
      } else if (mongoose.Types.ObjectId.isValid(project)) {
        const targetProjId = new mongoose.Types.ObjectId(project);
        // Verify access before filtering
        if (!userProjects.some(id => id.toString() === project)) {
           return res.status(403).json({ message: "Access denied to requested project scope" });
        }
        query.project = targetProjId;
      }
    } else if (project === "all" || search) {
      // Global Search or "All Projects" view: include user's projects + user's global tasks
      query.$or = [
        { project: { $in: userProjects } },
        { project: null, user: userId }
      ];
    } else {
      // Default isolation (e.g. initial load of workspace)
      query.project = null;
      query.user = userId;
    }
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) {
      query.priority = priority.includes(",") ? { $in: priority.split(",") } : priority;
    }

    if (dueDate) {
      const now = new Date();
      if (dueDate === "today") {
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        query.dueDate = { $lte: endOfDay, $gte: new Date(now.setHours(0,0,0,0)) };
      } else if (dueDate === "this-week") {
        const endOfWeek = new Date();
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        query.dueDate = { $lte: endOfWeek, $gte: new Date(now.setHours(0,0,0,0)) };
      } else if (dueDate === "overdue") {
        query.dueDate = { $lt: new Date() };
      }
    }
    if (tags) {
      query["labels.text"] = { $in: tags.split(",") };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let tasksQuery = Task.find(query)
      .populate("assignedTo", "name email profilePhoto")
      .populate("user", "name email")
      .populate("project", "name color")
      .populate("comments.user", "name email profilePhoto")
      .populate("activity.user", "name email profilePhoto")
      .sort({ createdAt: -1, position: 1 });

    if (limit) {
      tasksQuery = tasksQuery.limit(parseInt(limit));
    }

    const tasks = await tasksQuery;

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.findOne({ _id: id, user: userId })
      .populate("assignedTo", "name email profilePhoto")
      .populate("user", "name email")
      .populate("project", "name color")
      .populate("comments.user", "name email profilePhoto")
      .populate("activity.user", "name email profilePhoto")
      .populate("checklist.completedBy", "name")
      .populate("attachments.uploadedBy", "name")
      .populate("watchers", "name email profilePhoto");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create task
exports.createTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      project,
      assignedTo,
      labels,
    } = req.body;

    // Get the highest position for the status column
    const lastTask = await Task.findOne({
      user: req.user._id,
      project: project || null, // Scope to project
      status: status || "todo",
      isArchived: false,
    }).sort({ position: -1 });

    const position = lastTask ? lastTask.position + 1 : 0;

    const { assignedTo: resolvedId, pendingAssigneeEmail } = await resolveAssignee(assignedTo, req.user._id);

    const task = new Task({
      title,
      description,
      status: status || "todo",
      priority: priority || "Medium",
      dueDate,
      project,
      assignedTo: resolvedId,
      pendingAssigneeEmail,
      labels: labels || [],
      user: req.user._id,
      position,
      activity: [
        {
          user: req.user._id,
          action: "created",
          details: "Task created",
          timestamp: new Date(),
        },
      ],
    });

    await task.save();

    // Create notification
    await Notification.create({
      user: req.user._id,
      title: "New Task Created",
      message: `Task "${title}" has been created`,
      type: "task",
      metadata: { taskId: task._id },
    });

    // If assigned to someone else, notify them
    if (resolvedId && resolvedId.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: resolvedId,
        title: "Task Assigned",
        message: `You have been assigned to task: "${title}"`,
        type: "task",
        metadata: { taskId: task._id },
      });
    }

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email profilePhoto")
      .populate("user", "name email")
      .populate("project", "name color");

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user._id;

    const task = await Task.findOne({ _id: id, user: userId });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Resolve assignment early to avoid CastErrors with emails
    if (updates.assignedTo !== undefined) {
      const { assignedTo: resolvedId, pendingAssigneeEmail } = await resolveAssignee(updates.assignedTo, userId);
      updates.assignedTo = resolvedId;
      updates.pendingAssigneeEmail = pendingAssigneeEmail;
    }

    // Track changes for activity log
    const changes = [];
    Object.keys(updates).forEach((key) => {
      if (
        key !== "activity" &&
        JSON.stringify(task[key]) !== JSON.stringify(updates[key])
      ) {
        changes.push({
          field: key,
          from: task[key],
          to: updates[key],
        });
      }
    });

    // Add activity for status change
    if (updates.status && updates.status !== task.status) {
      task.activity.push({
        user: userId,
        action: "status_changed",
        details: `Moved from ${task.status} to ${updates.status}`,
        timestamp: new Date(),
      });

      // Create notification for status change if assigned
      if (task.assignedTo && task.assignedTo.toString() !== userId) {
        await Notification.create({
          user: task.assignedTo,
          title: "Task Status Updated",
          message: `Task "${task.title}" moved to ${updates.status}`,
          type: "task",
          metadata: { taskId: task._id },
        });
      }
    }

    // Add activity for assignment change
    if (
      (updates.assignedTo !== undefined && updates.assignedTo !== task.assignedTo?.toString()) ||
      (updates.pendingAssigneeEmail !== undefined && updates.pendingAssigneeEmail !== task.pendingAssigneeEmail)
    ) {
      let details = "Assigned to someone";
      if (updates.assignedTo) {
        const assignedUser = await User.findById(updates.assignedTo);
        details = `Assigned to ${assignedUser?.name || "Member"}`;
      } else if (updates.pendingAssigneeEmail) {
        details = `Assigned to ${updates.pendingAssigneeEmail}`;
      } else {
        details = "Task unassigned";
      }

      task.activity.push({
        user: userId,
        action: "assigned",
        details,
        timestamp: new Date(),
      });

      // Notify newly assigned user
      if (updates.assignedTo && updates.assignedTo.toString() !== userId) {
        await Notification.create({
          user: updates.assignedTo,
          title: "Task Assigned",
          message: `You have been assigned to task: "${task.title}"`,
          type: "task",
          metadata: { taskId: task._id },
        });
      }
    }

    // Apply updates
    Object.assign(task, updates);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email profilePhoto")
      .populate("user", "name email")
      .populate("project", "name color")
      .populate("comments.user", "name email profilePhoto")
      .populate("activity.user", "name email profilePhoto");

    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update task positions (for drag and drop)
exports.updateTaskPositions = async (req, res) => {
  try {
    const { tasks } = req.body; // Array of { id, status, position }
    const userId = req.user._id;

    const updates = tasks.map(({ id, status, position }) => ({
      updateOne: {
        filter: { _id: id, user: userId },
        update: { $set: { status, position } },
      },
    }));

    await Task.bulkWrite(updates);

    res.json({ message: "Task positions updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const task = await Task.findOne({ _id: id, user: userId });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 1. Delete associated entities
    await Promise.all([
      CalendarEvent.deleteMany({ task: id }),
      Notification.deleteMany({
        $or: [
          { "metadata.taskId": id },
          { "metadata.taskId": id.toString() }
        ]
      })
    ]);

    // 2. Delete task itself
    await task.deleteOne();

    res.json({ message: "Task and all associated data (events, notifications) deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Archive/Unarchive task
exports.archiveTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { archive } = req.body;

    const task = await Task.findOne({ _id: id, user: req.user.id });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.isArchived = archive;
    task.activity.push({
      user: req.user.id,
      action: archive ? "archived" : "restored",
      details: archive ? "Task archived" : "Task restored",
      timestamp: new Date(),
    });

    await task.save();

    res.json({ message: archive ? "Task archived" : "Task restored", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add comment to task
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const task = await Task.findOne({ _id: id, user: req.user.id });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.comments.push({
      user: req.user.id,
      content,
      createdAt: new Date(),
    });

    task.activity.push({
      user: req.user.id,
      action: "commented",
      details: "Added a comment",
      timestamp: new Date(),
    });

    await task.save();

    const updatedTask = await Task.findById(task._id).populate(
      "comments.user",
      "name email profilePhoto",
    );

    res.json(updatedTask.comments[updatedTask.comments.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add checklist item
exports.addChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const task = await Task.findOne({ _id: id, user: req.user.id });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.checklist.push({
      text,
      completed: false,
    });

    await task.save();

    res.json(task.checklist[task.checklist.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle checklist item
exports.toggleChecklistItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;

    const task = await Task.findOne({ _id: id, user: req.user.id });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const item = task.checklist.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Checklist item not found" });
    }

    item.completed = !item.completed;
    if (item.completed) {
      item.completedBy = req.user.id;
      item.completedAt = new Date();
    } else {
      item.completedBy = null;
      item.completedAt = null;
    }

    await task.save();

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get task stats
exports.getTaskStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const matchQuery = {
      user: new mongoose.Types.ObjectId(userId),
      isArchived: false,
    };

    // Apply project filter to stats if provided
    const { project } = req.query;
    if (project) {
      if (project === "null" || project === "undefined") {
        matchQuery.project = null;
      } else if (mongoose.Types.ObjectId.isValid(project)) {
        matchQuery.project = new mongoose.Types.ObjectId(project);
      }
    }

    const stats = await Task.aggregate([
      {
        $match: matchQuery,
      },
      {
        $facet: {
          statusCounts: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          priorityCounts: [
            {
              $group: {
                _id: "$priority",
                count: { $sum: 1 },
              },
            },
          ],
          overdueCount: [
            {
              $match: {
                dueDate: { $lt: now },
                status: { $ne: "completed" },
              },
            },
            { $count: "count" },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const result = stats[0];
    const statusMap = {};
    const priorityMap = { Low: 0, Medium: 0, High: 0, Urgent: 0 };

    result.statusCounts.forEach((item) => {
      statusMap[item._id] = item.count;
    });

    result.priorityCounts.forEach((item) => {
      priorityMap[item._id] = item.count;
    });

    const totalTasks = result.totalCount[0]?.count || 0;
    const completedTasks = statusMap.completed || 0;
    const inProgressTasks = (statusMap.doing || 0) + (statusMap.doing === undefined ? Object.keys(statusMap).reduce((acc, k) => (k !== 'todo' && k !== 'completed' ? acc + statusMap[k] : acc), 0) : 0);
    
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks: statusMap.todo || 0,
      allStatuses: statusMap,
      overdueTasks: result.overdueCount[0]?.count || 0,
      completionRate,
      priorityCounts: priorityMap,
      // Dashboard specific aliases
      totalActiveTasks: totalTasks - completedTasks,
      totalCompletedTasks: completedTasks,
      totalCompletionRate: completionRate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get recent tasks for dashboard
exports.getRecentTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const tasks = await Task.find({ user: userId, isArchived: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("project", "name color");
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get recent activity (sorted by activity timestamp)
exports.getRecentActivity = async (req, res) => {
  try {
    const userId = req.user._id;
    const tasks = await Task.find({ user: userId })
      .sort({ "activity.timestamp": -1 })
      .limit(10);

    const activities = [];
    tasks.forEach((task) => {
      task.activity.forEach((act) => {
        activities.push({
          ...act.toObject(),
          taskTitle: task.title,
          taskId: task._id,
        });
      });
    });

    res.json(activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get unique tags/labels for user
exports.getTags = async (req, res) => {
  try {
    const userId = req.user._id;
    const tags = await Task.distinct("labels.text", { user: userId });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
