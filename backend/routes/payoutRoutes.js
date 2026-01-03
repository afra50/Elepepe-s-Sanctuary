// backend/routes/payoutRoutes.js

const express = require("express");
const router = express.Router();

const payoutController = require("../controllers/payoutController");
const { auth, adminOnly } = require("../middleware/authMiddleware");

// Wszystkie operacje na wypłatach są chronione (tylko dla admina)

router.get("/export", auth, adminOnly, payoutController.exportPayoutsCsv);

// GET - Pobieranie listy wypłat (przelewów wychodzących)
router.get("/", auth, adminOnly, payoutController.getPayouts);

// POST - Dodawanie nowej wypłaty (zaktualizuje pole amount_paid w projekcie)
router.post("/", auth, adminOnly, payoutController.addPayout);

// DELETE - Usuwanie wypłaty (cofnie saldo wypłaconych środków w projekcie)
router.delete("/:id", auth, adminOnly, payoutController.deletePayout);

module.exports = router;
