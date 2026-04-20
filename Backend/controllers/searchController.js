const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const Note = require("../models/Note");

// Unified Global Search
exports.unifiedSearch = async (req, res) => {
  try {
    const userId = req.user._id;
    const { q } = req.query;

    if (!q) {
      return res.json({ tasks: [], projects: [], users: [], notes: [] });
    }

    const searchRegex = { $regex: q, $options: "i" };

    // 1. Projects - Match name
    const projectsPromise = Project.find({
      $and: [
        { $or: [{ owner: userId }, { teamMembers: userId }] },
        { name: searchRegex }
      ]
    }).select("name color description");

    // 2. Tasks - Match title or description
    const tasksPromise = Task.find({
      $and: [
        {
          $or: [
            { user: userId },
            { project: { $in: await Project.find({
                $or: [{ owner: userId }, { teamMembers: userId }]
              }).distinct("_id") } 
            }
          ]
        },
        { $or: [{ title: searchRegex }, { description: searchRegex }] }
      ]
    }).populate("project", "name color").limit(20);

    // 3. Team Members - Match name or email
    const usersPromise = User.find({
      $or: [{ name: searchRegex }, { email: searchRegex }]
    }).select("name email profilePhoto").limit(10);

    // 4. Notes - Match title or content
    const notesPromise = Note.find({
      user: userId,
      $or: [{ title: searchRegex }, { content: searchRegex }]
    }).limit(10);

    const [projects, tasks, users, notes] = await Promise.all([
      projectsPromise,
      tasksPromise,
      usersPromise,
      notesPromise
    ]);

    res.json({
      projects,
      tasks,
      users,
      notes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
