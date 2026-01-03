// backend/routes/internalDonationRoutes.js

const express = require("express");
const router = express.Router();

const internalDonationController = require("../controllers/internalDonationController");
const { auth, adminOnly } = require("../middleware/authMiddleware");

// Wszystkie operacje na wpłatach własnych są chronione (tylko dla admina)

router.get(
  "/export",
  auth,
  adminOnly,
  internalDonationController.exportInternalDonationsCsv
);

// GET - Pobieranie listy wpłat
router.get(
  "/",
  auth,
  adminOnly,
  internalDonationController.getInternalDonations
);

// POST - Dodawanie nowej wpłaty (zaktualizuje też saldo projektu)
router.post(
  "/",
  auth,
  adminOnly,
  internalDonationController.addInternalDonation
);

// DELETE - Usuwanie wpłaty (cofnie saldo projektu)
router.delete(
  "/:id",
  auth,
  adminOnly,
  internalDonationController.deleteInternalDonation
);

module.exports = router;
