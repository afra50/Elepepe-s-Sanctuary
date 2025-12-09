const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");
const upload = require("../middleware/uploadMiddleware");

// 1. Importujemy Twoje middleware (zakładam, że plik nazywa się authMiddleware.js)
const { auth, adminOnly } = require("../middleware/authMiddleware");

// Konfiguracja Multera
const uploadFields = upload.fields([
  { name: "petPhotos", maxCount: 10 },
  { name: "documents", maxCount: 10 },
]);

// === TRASY PUBLICZNE ===

// POST /api/requests - Każdy może wysłać zgłoszenie (bez logowania)
router.post("/", uploadFields, requestController.createRequest);

// === TRASY CHRONIONE (TYLKO ADMIN) ===

// GET /api/requests - Lista zgłoszeń
// Najpierw sprawdzamy token (auth), potem rolę (adminOnly), na końcu wykonujemy kontroler
router.get("/", auth, adminOnly, requestController.getRequests);

// GET /api/requests/:id - Szczegóły zgłoszenia
router.get("/:id", auth, adminOnly, requestController.getRequestDetails);

module.exports = router;
