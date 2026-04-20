const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const fs = require("fs");
const { initReminderJob } = require("./utils/reminderJob");

// Load Config
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create uploads directories if they don't exist
const uploadDirs = [
  path.join(__dirname, "uploads"),
  path.join(__dirname, "uploads/tasks"),
  path.join(__dirname, "uploads/profiles"),
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==================== ROUTES ====================
// Auth Routes
app.use("/api/auth", require("./routes/authRoutes"));

// Task Routes
app.use("/api/tasks", require("./routes/taskRoutes"));

// Invitation Routes
app.use("/api/invitations", require("./routes/invitationRoutes"));

// Notification Routes
app.use("/api/notifications", require("./routes/notificationRoutes"));

// Project Routes
app.use("/api/projects", require("./routes/projectRoutes"));

// Calendar Routes
app.use("/api/calendar", require("./routes/calendarRoutes"));

// Upload Routes
app.use("/api/uploads", require("./routes/uploadRoutes"));

// Report Routes
app.use("/api/reports", require("./routes/reportRoutes"));

// Note Routes
app.use("/api/notes", require("./routes/noteRoutes"));

// Payment Routes
app.use("/api/payments", require("./routes/paymentRoutes"));

// Unified Search Route
app.use("/api/search", require("./routes/searchRoutes"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    routes: {
      auth: "/api/auth",
      tasks: "/api/tasks",
      invitations: "/api/invitations",
      notifications: "/api/notifications",
      projects: "/api/projects",
      calendar: "/api/calendar",
      uploads: "/api/uploads",
      reports: "/api/reports",
    },
  });
});

// 404 handler for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Initialize and start the background reminder job
initReminderJob();

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  console.log(`\n📋 Available Routes:`);
  console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
  console.log(`   - Tasks: http://localhost:${PORT}/api/tasks`);
  console.log(`   - Invitations: http://localhost:${PORT}/api/invitations`);
  console.log(`   - Notifications: http://localhost:${PORT}/api/notifications`);
  console.log(`   - Projects: http://localhost:${PORT}/api/projects`);
  console.log(`   - Calendar: http://localhost:${PORT}/api/calendar`);
  console.log(`   - Uploads: http://localhost:${PORT}/api/uploads`);
  console.log(`   - Reports: http://localhost:${PORT}/api/reports`);
  console.log(`   - Health: http://localhost:${PORT}/api/health\n`);
});