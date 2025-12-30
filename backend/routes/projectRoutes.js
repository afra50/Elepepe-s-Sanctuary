// backend/routes/projectRoutes.js
const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { auth, adminOnly } = require("../middleware/authMiddleware");

// 1. ZAIMPORTUJ MULTER (to jest to, czego brakowało)
const upload = require("../middleware/uploadMiddleware");

// 2. Skonfiguruj pola, których spodziewa się backend przy edycji
// (Frontend wysyła "newPhotos" i "newDocuments")
const projectUploads = upload.fields([
  { name: "newPhotos", maxCount: 10 },
  { name: "newDocuments", maxCount: 10 },
]);

// === TRASY PUBLICZNE ===
router.get("/", projectController.getActiveProjects);

// === TRASY ADMINA ===

router.get("/admin", auth, adminOnly, projectController.getAdminProjects);
router.get("/admin/:id", auth, adminOnly, projectController.getProjectDetails);

// --- TU JEST NAPRAWA ---
// Dodajemy middleware 'projectUploads' przed kontrolerem.
// Dzięki temu req.body zostanie wypełnione danymi tekstowymi, a req.files plikami.
router.put(
  "/admin/:id",
  auth,
  adminOnly,
  projectUploads, // <--- KLUCZOWY ELEMENT
  projectController.updateProject
);
// -----------------------

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
