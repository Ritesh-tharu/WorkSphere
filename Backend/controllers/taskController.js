const Task = require("../models/Task");
const User = require("../models/User");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");

// Get all tasks for user with filters
exports.getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, project, assignedTo, priority, search, archived } =
      req.query;

    let query = { user: userId, isArchived: archived === "true" };

    if (status) query.status = status;
    if (project) query.project = project;
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email profilePhoto")
      .populate("user", "name email")
      .populate("project", "name color")
      .populate("comments.user", "name email profilePhoto")
      .populate("activity.user", "name email profilePhoto")
      .sort({ position: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

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
      user: req.user.id,
      status: status || "todo",
      isArchived: false,
    }).sort({ position: -1 });

    const position = lastTask ? lastTask.position + 1 : 0;

    const task = new Task({
      title,
      description,
      status: status || "todo",
      priority: priority || "Medium",
      dueDate,
      project,
      assignedTo,
      labels: labels || [],
      user: req.user.id,
      position,
      activity: [
        {
          user: req.user.id,
          action: "created",
          details: "Task created",
          timestamp: new Date(),
        },
      ],
    });

    await task.save();

    // Create notification
    await Notification.create({
      user: req.user.id,
      title: "New Task Created",
      message: `Task "${title}" has been created`,
      type: "task",
      metadata: { taskId: task._id },
    });

    // If assigned to someone else, notify them
    if (assignedTo && assignedTo !== req.user.id) {
      await Notification.create({
        user: assignedTo,
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
    const userId = req.user.id;

    const task = await Task.findOne({ _id: id, user: userId });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
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
      updates.assignedTo &&
      updates.assignedTo !== task.assignedTo?.toString()
    ) {
      const assignedUser = await User.findById(updates.assignedTo);
      task.activity.push({
        user: userId,
        action: "assigned",
        details: `Assigned to ${assignedUser?.name || "someone"}`,
        timestamp: new Date(),
      });

      // Notify newly assigned user
      if (updates.assignedTo !== userId) {
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
    const userId = req.user.id;

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
    const userId = req.user.id;

    const task = await Task.findOne({ _id: id, user: userId });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.deleteOne();

    res.json({ message: "Task deleted successfully" });
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
    const userId = req.user.id;
    const now = new Date();

    const stats = await Task.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          isArchived: false,
        },
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
    const statusMap = { todo: 0, doing: 0, completed: 0 };
    const priorityMap = { Low: 0, Medium: 0, High: 0, Urgent: 0 };

    result.statusCounts.forEach((item) => {
      statusMap[item._id] = item.count;
    });

    result.priorityCounts.forEach((item) => {
      priorityMap[item._id] = item.count;
    });

    const totalTasks = result.totalCount[0]?.count || 0;
    const completedTasks = statusMap.completed || 0;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      totalTasks,
      completedTasks: statusMap.completed || 0,
      inProgressTasks: statusMap.doing || 0,
      todoTasks: statusMap.todo || 0,
      overdueTasks: result.overdueCount[0]?.count || 0,
      completionRate,
      priorityCounts: priorityMap,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
