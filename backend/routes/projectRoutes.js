const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { auth, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Konfiguracja dla PROJEKTU
const projectUploads = upload.fields([
  { name: "newPhotos", maxCount: 10 },
  { name: "newDocuments", maxCount: 10 },
]);

// Konfiguracja dla AKTUALNOŚCI
const newsUploads = upload.array("files", 10);

// === 1. TRASY ADMINA (Muszą być na górze!) ===
// "admin" to konkretne słowo, więc musi być sprawdzone przed :slug
router.get("/admin", auth, adminOnly, projectController.getAdminProjects);
router.get("/admin/:id", auth, adminOnly, projectController.getProjectDetails);
router.put(
  "/admin/:id",
  auth,
  adminOnly,
  projectUploads,
  projectController.updateProject
);

// === 2. TRASY AKTUALNOŚCI (Też specyficzne) ===
router.post(
  "/:id/updates",
  auth,
  adminOnly,
  newsUploads,
  projectController.addProjectUpdate
);

router.put(
  "/:id/updates/:updateId",
  auth,
  adminOnly,
  newsUploads,
  projectController.editProjectUpdate
);

router.delete(
  "/:id/updates/:updateId",
  auth,
  adminOnly,
  projectController.deleteProjectUpdate
);

// === 3. TRASY PUBLICZNE (Ogólne na końcu) ===
router.get("/", projectController.getActiveProjects);

// WAŻNE: Ta trasa musi być na samym dole, bo :slug łapie wszystko
router.get("/:slug", projectController.getPublicProjectBySlug);

module.exports = router;
