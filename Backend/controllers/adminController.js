// Backend/controllers/adminController.js
const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");

// @desc    Get dashboard metrics for superadmin
// @route   GET /api/admin/stats
// @access  Private/Superadmin
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({ plan: "premium" });
    const freeUsers = await User.countDocuments({ plan: { $ne: "premium" } });
    
    const totalProjects = await Project.countDocuments();
    const totalTasks = await Task.countDocuments();
    
    // Calculate Conversion Rate
    const conversionRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : 0;

    res.json({
      totalUsers,
      premiumUsers,
      freeUsers,
      totalProjects,
      totalTasks,
      conversionRate: Number(conversionRate),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users with search, filter, and pagination
// @route   GET /api/admin/users
// @access  Private/Superadmin
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Search filter (Name or Email)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex }
      ];
    }

    // Plan Filter
    if (req.query.plan && req.query.plan !== "all") {
      query.plan = req.query.plan;
    }

    // Role Filter
    if (req.query.role && req.query.role !== "all") {
      query.role = req.query.role;
    }

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password -otp -otpExpires")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      users,
      page,
      pages: Math.ceil(totalUsers / limit),
      totalUsers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a user's role, plan, and premium subscription details
// @route   PUT /api/admin/users/:id
// @access  Private/Superadmin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { role, plan, subscriptionExpires } = req.body;

    if (role) {
      user.role = role;
    }

    if (plan) {
      user.plan = plan;
      
      // If upgraded to premium and no specific expiry date is sent, set to 30 days from now
      if (plan === "premium") {
        if (subscriptionExpires) {
          user.subscriptionExpires = new Date(subscriptionExpires);
        } else if (!user.subscriptionExpires || user.subscriptionExpires < new Date()) {
          const defaultExpiry = new Date();
          defaultExpiry.setDate(defaultExpiry.getDate() + 30);
          user.subscriptionExpires = defaultExpiry;
        }
      } else if (plan === "free") {
        user.subscriptionExpires = undefined;
      }
    }

    const updatedUser = await user.save();
    
    // Remove sensitive fields
    const responseUser = updatedUser.toObject();
    delete responseUser.password;
    delete responseUser.otp;
    delete responseUser.otpExpires;

    res.json(responseUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a user account
// @route   DELETE /api/admin/users/:id
// @access  Private/Superadmin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Do not allow deleting yourself!
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own superadmin account." });
    }

    await User.deleteOne({ _id: user._id });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  updateUser,
  deleteUser,
};
