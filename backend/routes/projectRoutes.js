const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { auth, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Konfiguracja dla PROJEKTU (edycja główna)
const projectUploads = upload.fields([
  { name: "newPhotos", maxCount: 10 },
  { name: "newDocuments", maxCount: 10 },
]);

// Konfiguracja dla AKTUALNOŚCI (Newsy)
// Używamy .array('files'), bo formularz newsa wyśle wszystkie pliki w jednym polu
const newsUploads = upload.array("files", 10);

// === TRASY PUBLICZNE ===
router.get("/", projectController.getActiveProjects);
router.get("/:slug", projectController.getPublicProjectBySlug);

// === TRASY ADMINA ===
router.get("/admin", auth, adminOnly, projectController.getAdminProjects);
router.get("/admin/:id", auth, adminOnly, projectController.getProjectDetails);
router.put(
  "/admin/:id",
  auth,
  adminOnly,
  projectUploads,
  projectController.updateProject
);

// --- TRASY AKTUALNOŚCI ---

// Dodawanie newsa z plikami
router.post(
  "/:id/updates",
  auth,
  adminOnly,
  newsUploads, // <--- Middleware Multer dla tablicy plików
  projectController.addProjectUpdate
);

// Edycja newsa
router.put(
  "/:id/updates/:updateId",
  auth,
  adminOnly,
  newsUploads, // <--- Middleware Multer dla tablicy plików
  projectController.editProjectUpdate
);

// Usuwanie newsa
router.delete(
  "/:id/updates/:updateId",
  auth,
  adminOnly,
  projectController.deleteProjectUpdate
);

module.exports = router;
