// backend/routes/partnerRoutes.js

const express = require("express");
const router = express.Router();

const partnerController = require("../controllers/partnerController");
const upload = require("../middleware/uploadMiddleware");
const { auth, adminOnly } = require("../middleware/authMiddleware");

// PUBLICZNE – do wyświetlania logotypów na stronie
router.get("/", partnerController.getPartners);

// ADMIN – dodawanie / edycja / usuwanie
router.post(
  "/",
  auth,
  adminOnly,
  upload.imageOnly.single("logo"), // pole "logo" w FormData
  partnerController.createPartner
);

router.put(
  "/:id",
  auth,
  adminOnly,
  upload.imageOnly.single("logo"),
  partnerController.updatePartner
);

router.delete("/:id", auth, adminOnly, partnerController.deletePartner);

module.exports = router;
