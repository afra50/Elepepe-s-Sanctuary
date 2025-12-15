const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");
const upload = require("../middleware/uploadMiddleware");

// 1. Importujemy Twoje middleware
const { auth, adminOnly } = require("../middleware/authMiddleware");

// Konfiguracja Multera dla tworzenia ZGŁOSZENIA (publiczne)
const uploadRequestFields = upload.fields([
  { name: "petPhotos", maxCount: 10 },
  { name: "documents", maxCount: 10 },
]);

// Konfiguracja Multera dla TWORZENIA PROJEKTU (admin)
// React wysyła wszystko pod kluczem 'newFiles'
const uploadProjectFields = upload.array("newFiles", 20);

// === TRASY PUBLICZNE ===

// POST /api/requests - Każdy może wysłać zgłoszenie (bez logowania)
router.post("/", uploadRequestFields, requestController.createRequest);

// === TRASY CHRONIONE (TYLKO ADMIN) ===

// GET /api/requests - Lista zgłoszeń
router.get("/", auth, adminOnly, requestController.getRequests);

// GET /api/requests/:id - Szczegóły zgłoszenia
router.get("/:id", auth, adminOnly, requestController.getRequestDetails);

// PATCH /api/requests/:id/status - Zmiana statusu + Tworzenie projektu (z plikami)
router.patch(
  "/:id/status",
  auth,
  adminOnly,
  uploadProjectFields, // <--- DODANO MIDDLEWARE OBSŁUGUJĄCY PLIKI
  requestController.updateRequestStatus
);

module.exports = router;
