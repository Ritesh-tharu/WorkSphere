const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const fs = require("fs");

// Load Config
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create uploads directories if they don't exist (local development only)
if (process.env.NODE_ENV !== "production") {
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
}

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==================== ROUTES ====================
// Admin Routes
app.use("/api/admin", require("./routes/adminRoutes"));

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
    environment: process.env.NODE_ENV || "development",
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

// For Vercel serverless deployment - export app
module.exports = app;

// Only listen if not on Vercel (local development)
if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
  });
}
