const Task = require("../models/Task");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/tasks");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "attachments-" + uniqueSuffix + ext);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype || extname) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "File type not allowed. Please upload images, documents, or archives.",
      ),
    );
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter,
}).array("attachments", 5); // Max 5 files

// Upload attachments for a task
exports.uploadTaskAttachments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Validate taskId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    upload(req, res, async function (err) {
      if (err) {
        console.error("Upload error:", err);
        return res.status(400).json({
          message: err.message || "File upload failed",
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      // Find the task
      const task = await Task.findOne({ _id: taskId, user: userId });
      if (!task) {
        // Clean up uploaded files if task not found
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
        return res.status(404).json({ message: "Task not found" });
      }

      // Get uploader info
      const uploader = await User.findById(userId).select("name");
      if (!uploader) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create attachment objects
      const attachments = req.files.map((file) => ({
        filename: file.filename,
        originalName: file.originalname,
        url: `/uploads/tasks/${file.filename}`,
        path: file.path,
        size: file.size,
        mimeType: file.mimetype,
        uploadedBy: new mongoose.Types.ObjectId(userId),
        uploadedAt: new Date(),
      }));

      // Add attachments to task
      task.attachments.push(...attachments);

      // Add activity
      task.activity.push({
        user: new mongoose.Types.ObjectId(userId),
        action: "attachments_added",
        details: `Added ${attachments.length} file(s)`,
        timestamp: new Date(),
      });

      await task.save();

      // Populate uploader info for response
      const populatedAttachments = attachments.map((att) => ({
        ...att,
        uploadedBy: {
          _id: userId,
          name: uploader.name,
        },
      }));

      res.status(201).json({
        message: "Files uploaded successfully",
        attachments: populatedAttachments,
      });
    });
  } catch (error) {
    console.error("Error in uploadTaskAttachments:", error);
    res
      .status(500)
      .json({ message: "Failed to upload files. Please try again." });
  }
};

// Delete attachment
exports.deleteAttachment = async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params;
    const userId = req.user.id;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(taskId) ||
      !mongoose.Types.ObjectId.isValid(attachmentId)
    ) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const task = await Task.findOne({ _id: taskId, user: userId });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Find the attachment
    const attachment = task.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    // Delete file from disk
    const filePath = attachment.path;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("File deleted:", filePath);
    }

    // Remove attachment from array
    task.attachments.pull(attachmentId);

    // Add activity
    task.activity.push({
      user: new mongoose.Types.ObjectId(userId),
      action: "attachment_deleted",
      details: `Deleted file: ${attachment.originalName}`,
      timestamp: new Date(),
    });

    await task.save();

    res.json({
      message: "Attachment deleted successfully",
      attachmentId,
    });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    res.status(500).json({ message: "Failed to delete attachment" });
  }
};

// Download attachment
exports.downloadAttachment = async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params;
    const userId = req.user.id;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(taskId) ||
      !mongoose.Types.ObjectId.isValid(attachmentId)
    ) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const task = await Task.findOne({
      _id: taskId,
      $or: [
        { user: userId },
        { assignedTo: userId },
        { "attachments.uploadedBy": userId },
      ],
    });

    if (!task) {
      return res
        .status(404)
        .json({ message: "Task not found or access denied" });
    }

    const attachment = task.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const filePath = attachment.path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    // Set headers for download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(attachment.originalName)}"`,
    );
    res.setHeader(
      "Content-Type",
      attachment.mimeType || "application/octet-stream",
    );

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      console.error("Error streaming file:", error);
      res.status(500).json({ message: "Error downloading file" });
    });
  } catch (error) {
    console.error("Error downloading attachment:", error);
    res.status(500).json({ message: "Failed to download attachment" });
  }
};

// Get attachment info
exports.getAttachmentInfo = async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params;
    const userId = req.user.id;

    if (
      !mongoose.Types.ObjectId.isValid(taskId) ||
      !mongoose.Types.ObjectId.isValid(attachmentId)
    ) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const task = await Task.findOne({
      _id: taskId,
      $or: [{ user: userId }, { assignedTo: userId }],
    }).populate("attachments.uploadedBy", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const attachment = task.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    res.json(attachment);
  } catch (error) {
    console.error("Error getting attachment info:", error);
    res.status(500).json({ message: "Failed to get attachment info" });
  }
};