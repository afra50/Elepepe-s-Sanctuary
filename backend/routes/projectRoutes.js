const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { auth, adminOnly } = require("../middleware/authMiddleware");

// PUBLIC
router.get("/", projectController.getActiveProjects);
// ADMIN ONLY
router.get("/admin", auth, adminOnly, projectController.getAdminProjects);
router.get("/admin/:id", auth, adminOnly, projectController.getProjectDetails);

module.exports = router;
