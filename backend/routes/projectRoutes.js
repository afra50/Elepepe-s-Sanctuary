const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");

// PUBLIC
router.get("/", projectController.getActiveProjects);

module.exports = router;
