const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");
const upload = require("../middleware/uploadMiddleware");

// Konfigurujemy, jakie pola z plikami przyjmujemy
// 'petPhotos' i 'documents' muszą zgadzać się z nazwą "name" w inputach na froncie!
const uploadFields = upload.fields([
  { name: "petPhotos", maxCount: 10 },
  { name: "documents", maxCount: 10 },
]);

// POST /api/requests
router.post("/", uploadFields, requestController.createRequest);

module.exports = router;
