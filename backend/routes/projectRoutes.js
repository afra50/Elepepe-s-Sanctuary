const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { auth, adminOnly } = require("../middleware/authMiddleware");

// PUBLIC
router.get("/", projectController.getActiveProjects);

// ADMIN ONLY
router.get("/admin", auth, adminOnly, projectController.getAdminProjects);
router.get("/admin/:id", auth, adminOnly, projectController.getProjectDetails);
router.put("/admin/:id", auth, adminOnly, projectController.updateProject);
router.post(
  "/:id/updates",
  auth,
  adminOnly,
  projectController.addProjectUpdate
);
router.delete(
  "/:id/updates/:updateId",
  auth,
  adminOnly,
  projectController.deleteProjectUpdate
);

module.exports = router;
