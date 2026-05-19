// Backend/middleware/adminMiddleware.js

const adminProtect = (req, res, next) => {
  if (req.user && req.user.role === "superadmin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Superadmin authorization required." });
  }
};

module.exports = { adminProtect };
