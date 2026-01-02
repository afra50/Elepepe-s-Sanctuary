// backend/controllers/internalDonationController.js
const db = require("../config/db");
const internalDonationModel = require("../models/internalDonationModel");
const projectModel = require("../models/projectModel");
const { convertCurrency } = require("../utils/currencyService");
const Joi = require("joi"); // <--- Import Joi

// GET /internal-donations
const getInternalDonations = async (req, res) => {
  try {
    const donations = await internalDonationModel.getAllInternalDonations(db);
    res.json(donations);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Server error while fetching internal donations." });
  }
};

// POST /internal-donations
const addInternalDonation = async (req, res) => {
  try {
    // 1. Definicja Schematu Walidacji
    const schema = Joi.object({
      project_id: Joi.number().integer().required().messages({
        "any.required": "Project is required.",
        "number.base": "Project ID must be a number.",
      }),
      amount: Joi.number()
        .positive()
        .precision(2)
        .max(99999999.99)
        .required()
        .messages({
          "number.base": "Amount must be a number.",
          "number.positive": "Amount must be a positive number.",
          "number.max": "Amount is too large (max 99,999,999.99).",
          "any.required": "Amount is required.",
        }),
      currency: Joi.string().length(3).uppercase().default("PLN"),
      donation_date: Joi.date().iso().required().messages({
        "any.required": "Date is required.",
      }),
      note: Joi.string().max(1000).allow("", null).messages({
        "string.max": "Note is too long (max 1000 characters).",
      }),
    });

    // 2. Walidacja danych
    // 'value' zawiera dane po konwersji (np. string "100" zamieni na liczbę 100)
    const { error, value } = schema.validate(req.body);

    if (error) {
      // Zwracamy pierwszy napotkany błąd walidacji
      return res.status(400).json({ message: error.details[0].message });
    }

    // Od teraz używamy 'value' zamiast 'req.body', bo 'value' jest bezpieczne i sformatowane
    const { project_id, amount, currency, donation_date, note } = value;

    // --- LOGIKA BIZNESOWA ---

    const project = await projectModel.getProjectById(db, project_id);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    const projectCurrency = project.currency;
    // Joi już ustawiło default na 'PLN' jeśli currency nie podano, ale dla pewności:
    const donationCurrency = currency || "PLN";

    let finalAmountForProject = amount;

    if (donationCurrency !== projectCurrency) {
      finalAmountForProject = await convertCurrency(
        amount,
        donationCurrency,
        projectCurrency
      );
    }

    const newId = await internalDonationModel.createInternalDonation(db, {
      project_id,
      amount,
      currency: donationCurrency,
      convertedAmount: finalAmountForProject,
      donation_date,
      note,
    });

    await internalDonationModel.updateProjectFunds(
      db,
      project_id,
      finalAmountForProject
    );

    res.status(201).json({
      id: newId,
      message: `Donation added. Converted ${amount} ${donationCurrency} to ${parseFloat(
        finalAmountForProject
      ).toFixed(2)} ${projectCurrency}.`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server error while adding donation.",
    });
  }
};

// DELETE /internal-donations/:id
const deleteInternalDonation = async (req, res) => {
  // ... (bez zmian)
  try {
    const { id } = req.params;
    const donation = await internalDonationModel.getInternalDonationById(
      db,
      id
    );

    if (!donation) {
      return res.status(404).json({ message: "Donation not found." });
    }

    const isDeleted = await internalDonationModel.deleteInternalDonation(
      db,
      id
    );

    if (isDeleted) {
      const valueToSubtract = donation.converted_amount
        ? parseFloat(donation.converted_amount)
        : parseFloat(donation.amount);

      const amountToSubtract = -Math.abs(valueToSubtract);

      await internalDonationModel.updateProjectFunds(
        db,
        donation.project_id,
        amountToSubtract
      );

      res.json({
        message: "Donation deleted, project funds adjusted correctly.",
      });
    } else {
      res.status(400).json({ message: "Failed to delete donation." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error while deleting donation." });
  }
};

module.exports = {
  getInternalDonations,
  addInternalDonation,
  deleteInternalDonation,
};
