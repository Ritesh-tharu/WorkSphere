const Note = require("../models/Note");
const mongoose = require("mongoose");

// Get all notes for user with filtering and sorting
exports.getNotes = async (req, res) => {
  try {
    const userId = req.user._id;
    const { project, search, tags, pinnedOnly } = req.query;

    let query = { user: userId };

    if (project && project !== "all") {
      if (project === "null") {
        query.project = null;
      } else if (mongoose.Types.ObjectId.isValid(project)) {
        query.project = new mongoose.Types.ObjectId(project);
      }
    }

    if (pinnedOnly === "true") {
      query.isPinned = true;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    if (tags) {
      query.tags = { $in: tags.split(",") };
    }

    const notes = await Note.find(query)
      .populate("project", "name color")
      .sort({ isPinned: -1, updatedAt: -1 });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new note
exports.createNote = async (req, res) => {
  try {
    const { title, content, color, tags, project, isPinned } = req.body;
    const userId = req.user._id;

    // Check note limit for free users
    if (req.user.plan === "free") {
      const noteCount = await Note.countDocuments({ user: userId });
      if (noteCount >= 1) {
        return res.status(403).json({
          message: "Note limit reached. Free users can only create 1 note.",
          isLimitReached: true,
        });
      }
    }

    const note = new Note({
      title,
      content,
      color: color || "#ffffff",
      tags: tags || [],
      user: userId,
      project: project || null,
      isPinned: isPinned || false,
    });

    await note.save();
    
    // Populate project info if applicable
    if (project) {
        await note.populate("project", "name color");
    }

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an existing note
exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const note = await Note.findOneAndUpdate(
      { _id: id, user: userId },
      { ...updates, lastEditedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate("project", "name color");

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a note
exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const note = await Note.findOneAndDelete({ _id: id, user: userId });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle pin status
exports.togglePin = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const note = await Note.findOne({ _id: id, user: userId });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    note.isPinned = !note.isPinned;
    await note.save();

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};