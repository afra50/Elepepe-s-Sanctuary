// backend/controllers/internalDonationController.js
const db = require("../config/db"); // Twoja konfiguracja połączenia z bazą
const internalDonationModel = require("../models/internalDonationModel");

// GET /internal-donations
const getInternalDonations = async (req, res) => {
  try {
    const donations = await internalDonationModel.getAllInternalDonations(db);
    res.json(donations);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Błąd serwera podczas pobierania wpłat własnych." });
  }
};

// POST /internal-donations
const addInternalDonation = async (req, res) => {
  try {
    const { project_id, amount, currency, donation_date, note } = req.body;

    if (!project_id || !amount) {
      return res.status(400).json({ message: "Projekt i kwota są wymagane." });
    }

    // 1. Dodaj wpłatę do tabeli internal_donations
    const newId = await internalDonationModel.createInternalDonation(db, {
      project_id,
      amount,
      currency,
      donation_date,
      note,
    });

    // 2. Zaktualizuj amount_collected w tabeli projects (dodajemy kwotę)
    await internalDonationModel.updateProjectFunds(db, project_id, amount);

    res.status(201).json({
      id: newId,
      message: "Wpłata dodana i saldo projektu zaktualizowane.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Błąd serwera podczas dodawania wpłaty." });
  }
};

// DELETE /internal-donations/:id
const deleteInternalDonation = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Pobierz dane wpłaty, żeby wiedzieć jaką kwotę i któremu projektowi odjąć
    const donation = await internalDonationModel.getInternalDonationById(
      db,
      id
    );

    if (!donation) {
      return res.status(404).json({ message: "Wpłata nie znaleziona." });
    }

    // 2. Usuń wpłatę
    const isDeleted = await internalDonationModel.deleteInternalDonation(
      db,
      id
    );

    if (isDeleted) {
      // 3. Odejmij kwotę od salda projektu (przekazujemy kwotę z minusem)
      // Uwaga: Parsujemy na float, żeby upewnić się, że to liczba
      const amountToSubtract = -Math.abs(parseFloat(donation.amount));
      await internalDonationModel.updateProjectFunds(
        db,
        donation.project_id,
        amountToSubtract
      );

      res.json({ message: "Wpłata usunięta, saldo projektu skorygowane." });
    } else {
      res.status(400).json({ message: "Nie udało się usunąć wpłaty." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Błąd serwera podczas usuwania wpłaty." });
  }
};

module.exports = {
  getInternalDonations,
  addInternalDonation,
  deleteInternalDonation,
};
