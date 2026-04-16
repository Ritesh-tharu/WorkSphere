const Project = require("../models/Project");
const Task = require("../models/Task");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Note = require("../models/Note");
const CalendarEvent = require("../models/CalendarEvent");
const mongoose = require("mongoose");

// Get all projects for user
exports.getProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const projects = await Project.find({
      $or: [{ owner: userId }, { teamMembers: userId }],
    })
      .populate("owner", "name email profilePhoto")
      .populate("teamMembers", "name email profilePhoto")
      .sort({ updatedAt: -1 });

    // Get task counts for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id, isArchived: false } }, // Changed to 'project' field matching my recent task move
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]);

        const stats = { total: 0, completed: 0 };
        taskCounts.forEach((item) => {
          stats.total += item.count;
          if (item._id === 'completed' || item._id === 'done') {
            stats.completed += item.count;
          }
          stats[item._id] = item.count; // Store any dynamic status too
        });

        // Calculate progress automatically
        const progress = stats.total > 0 
          ? Math.round((stats.completed / stats.total) * 100) 
          : 0;

        return {
          ...project.toObject(),
          taskStats: stats,
          progress: progress, // Override model field with real-time calc
        };
      }),
    );

    res.json(projectsWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single project with all details
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findOne({
      _id: id,
      $or: [{ owner: userId }, { teamMembers: userId }],
    })
      .populate("owner", "name email profilePhoto")
      .populate("teamMembers", "name email profilePhoto jobTitle");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Get all tasks for this project
    const tasks = await Task.find({ project: id })
      .populate("assignedTo", "name email profilePhoto")
      .populate("user", "name email")
      .sort({ dueDate: 1, priority: -1 });

    // Get activity timeline
    const activities = await Notification.find({
      "metadata.projectId": id,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      project,
      tasks,
      activities,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create project
exports.createProject = async (req, res) => {
  try {
    const { name, description, color, startDate, dueDate, teamMembers } =
      req.body;

    const project = new Project({
      name,
      description,
      color: color || "#6366f1",
      startDate,
      dueDate,
      owner: req.user.id,
      teamMembers: teamMembers || [],
    });

    await project.save();

    // Create notification
    await Notification.create({
      user: req.user.id,
      title: "Project Created",
      message: `Project "${name}" has been created`,
      type: "team",
      metadata: { projectId: project._id },
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const project = await Project.findOne({
      _id: id,
      $or: [{ owner: req.user.id }, { teamMembers: req.user.id }],
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only owner can update certain fields
    if (project.owner.toString() !== req.user.id) {
      delete updates.owner;
      delete updates.teamMembers;
    }

    Object.assign(project, updates);
    await project.save();

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findOne({ _id: id, owner: req.user.id });

    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found or unauthorized" });
    }

    // 1. Find all task IDs for this project to delete related notifications/events
    const taskIds = await Task.find({ project: id }).distinct("_id");

    // 2. Delete all associated entities
    await Promise.all([
      Task.deleteMany({ project: id }),
      Note.deleteMany({ project: id }),
      CalendarEvent.deleteMany({ 
        $or: [
          { project: id },
          { task: { $in: taskIds } }
        ]
      }),
      Notification.deleteMany({
        $or: [
          { "metadata.projectId": id },
          { "metadata.projectId": id.toString() },
          { "metadata.taskId": { $in: taskIds } },
          { "metadata.taskId": { $in: taskIds.map(tid => tid.toString()) } }
        ]
      })
    ]);

    // 3. Delete project itself
    await project.deleteOne();

    res.json({ message: "Project and all associated data (tasks, notes, events, notifications) deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add team member to project
exports.addTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const project = await Project.findOne({ _id: id, owner: req.user.id });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.teamMembers.includes(userId)) {
      return res.status(400).json({ message: "User already in project" });
    }

    project.teamMembers.push(userId);
    await project.save();

    // Notify the added user
    await Notification.create({
      user: userId,
      title: "Added to Project",
      message: `You have been added to project "${project.name}"`,
      type: "team",
      metadata: { projectId: project._id },
    });

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get project timeline for calendar
exports.getProjectTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findOne({
      _id: id,
      $or: [{ owner: userId }, { teamMembers: userId }],
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const tasks = await Task.find({ project: id })
      .select("title dueDate startDate status priority assignedTo")
      .populate("assignedTo", "name");

    const timeline = {
      project: {
        name: project.name,
        startDate: project.startDate,
        dueDate: project.dueDate,
        progress: project.progress,
      },
      tasks: tasks.map((task) => ({
        id: task._id,
        title: task.title,
        start: task.startDate || task.dueDate,
        end: task.dueDate,
        status: task.status,
        priority: task.priority,
        assignee: task.assignedTo?.name,
      })),
    };

    res.json(timeline);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update project columns
exports.updateProjectColumns = async (req, res) => {
  try {
    const { id } = req.params;
    const { columns } = req.body;
    const userId = req.user.id;

    const project = await Project.findOne({
      _id: id,
      $or: [{ owner: userId }, { teamMembers: userId }],
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.columns = columns;
    await project.save();

    res.json(project.columns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
