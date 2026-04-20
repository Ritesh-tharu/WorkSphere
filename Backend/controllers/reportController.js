const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const mongoose = require("mongoose");

// Get productivity report
exports.getProductivityReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, projectId } = req.query;

    const matchQuery = { user: new mongoose.Types.ObjectId(userId) };
    if (projectId) matchQuery.project = new mongoose.Types.ObjectId(projectId);

    const dateRange = {};
    if (startDate || endDate) {
      dateRange.createdAt = {};
      if (startDate) dateRange.createdAt.$gte = new Date(startDate);
      if (endDate) dateRange.createdAt.$lte = new Date(endDate);
    }

    // Task completion trends
    const taskTrends = await Task.aggregate([
      { $match: { ...matchQuery, ...dateRange } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          statuses: {
            $push: {
              status: "$_id.status",
              count: "$count",
            },
          },
          total: { $sum: "$count" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Priority distribution
    const priorityDistribution = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
    ]);

    // Average completion time
    const avgCompletionTime = await Task.aggregate([
      {
        $match: {
          ...matchQuery,
          status: "completed",
          completedDate: { $exists: true },
        },
      },
      {
        $project: {
          completionTime: {
            $divide: [
              { $subtract: ["$completedDate", "$createdAt"] },
              1000 * 60 * 60, // Convert to hours
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          average: { $avg: "$completionTime" },
          min: { $min: "$completionTime" },
          max: { $max: "$completionTime" },
        },
      },
    ]);

    // User activity
    const userActivity = await Task.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          created: [
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            { $count: "count" },
          ],
          assigned: [
            { $match: { assignedTo: new mongoose.Types.ObjectId(userId) } },
            { $count: "count" },
          ],
          completed: [
            {
              $match: {
                status: "completed",
                user: new mongoose.Types.ObjectId(userId),
              },
            },
            { $count: "count" },
          ],
        },
      },
    ]);

    // Project breakdown
    const projectBreakdown = await Task.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$project",
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          doing: {
            $sum: { $cond: [{ $eq: ["$status", "doing"] }, 1, 0] },
          },
          todo: {
            $sum: { $cond: [{ $eq: ["$status", "todo"] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "_id",
          as: "projectInfo",
        },
      },
    ]);

    // Calculate productivity score
    const totalTasks = priorityDistribution.reduce(
      (acc, p) => acc + p.count,
      0,
    );
    const completedTasks = priorityDistribution.reduce(
      (acc, p) => acc + p.completed,
      0,
    );
    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const avgTime = avgCompletionTime[0]?.average || 0;
    const productivityScore = Math.round(
      completionRate * 0.6 +
        (avgTime < 24 ? 40 : avgTime < 48 ? 30 : avgTime < 72 ? 20 : 10),
    );

    res.json({
      period: { startDate, endDate },
      summary: {
        totalTasks,
        completedTasks,
        completionRate: Math.round(completionRate),
        productivityScore,
        avgCompletionTime: Math.round(avgTime * 10) / 10,
      },
      trends: taskTrends,
      priorityDistribution,
      userActivity: userActivity[0],
      projectBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get task completion forecast
exports.getForecast = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get historical data
    const historicalData = await Task.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
        },
      },
      {
        $group: {
          _id: {
            week: { $week: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          created: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    // Calculate average completion rate
    const avgWeeklyCompleted =
      historicalData.reduce((acc, d) => acc + d.completed, 0) /
        historicalData.length || 0;

    // Get current pending tasks
    const pendingTasks = await Task.countDocuments({
      user: userId,
      status: { $ne: "completed" },
    });

    // Forecast completion dates
    const weeksToComplete = pendingTasks / avgWeeklyCompleted;
    const estimatedCompletionDate = new Date();
    estimatedCompletionDate.setDate(
      estimatedCompletionDate.getDate() + weeksToComplete * 7,
    );

    // Get upcoming deadlines
    const upcomingDeadlines = await Task.find({
      user: userId,
      status: { $ne: "completed" },
      dueDate: { $exists: true, $ne: null },
    })
      .sort({ dueDate: 1 })
      .limit(10)
      .select("title dueDate priority");

    res.json({
      forecast: {
        pendingTasks,
        avgWeeklyCompletion: Math.round(avgWeeklyCompleted * 10) / 10,
        estimatedWeeks: Math.round(weeksToComplete * 10) / 10,
        estimatedCompletionDate,
      },
      upcomingDeadlines,
      historicalData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Export data
exports.exportData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { format, projectId } = req.query;

    const query = { user: userId };
    if (projectId) query.project = projectId;

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email")
      .populate("project", "name")
      .populate("comments.user", "name")
      .lean();

    const projects = await Project.find({
      $or: [{ owner: userId }, { teamMembers: userId }],
    }).lean();

    const data = {
      exportedAt: new Date(),
      user: req.user,
      summary: {
        totalTasks: tasks.length,
        totalProjects: projects.length,
        completedTasks: tasks.filter((t) => t.status === "completed").length,
      },
      tasks: tasks.map((t) => ({
        ...t,
        _id: t._id.toString(),
        user: t.user.toString(),
        assignedTo: t.assignedTo?._id.toString(),
        project: t.project?.name,
      })),
      projects: projects.map((p) => ({
        ...p,
        _id: p._id.toString(),
        owner: p.owner.toString(),
      })),
    };

    if (format === "csv") {
      // Generate CSV
      const csv = generateCSV(data);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=export.csv");
      res.send(csv);
    } else {
      // Generate JSON
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=export.json");
      res.json(data);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function generateCSV(data) {
  const headers = [
    "Task ID",
    "Title",
    "Status",
    "Priority",
    "Due Date",
    "Project",
    "Assigned To",
    "Created At",
  ];
  const rows = data.tasks.map((t) => [
    t._id,
    `"${t.title.replace(/"/g, '""')}"`,
    t.status,
    t.priority,
    t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "",
    t.project || "",
    t.assignedTo?.name || "",
    new Date(t.createdAt).toLocaleDateString(),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}