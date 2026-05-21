// Backend/middleware/adminMiddleware.js

const adminProtect = (req, res, next) => {
  // Allow both 'superadmin' and 'admin' to access admin routes
  if (
    req.user &&
    (req.user.role === "superadmin" || req.user.role === "admin")
  ) {
    next();
  } else {
    res
      .status(403)
      .json({
        message: "Access denied. Superadmin or admin authorization required.",
      });
  }
};

module.exports = { adminProtect };
