const express = require("express");
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addTeamMember,
  getProjectTimeline,
  updateProjectColumns,
} = require("../controllers/projectController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect); // All routes require authentication

router.route("/").get(getProjects).post(createProject);

router
  .route("/:id")
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

router.post("/:id/team", addTeamMember);
router.put("/:id/columns", updateProjectColumns);
router.get("/:id/timeline", getProjectTimeline);

module.exports = router;
     