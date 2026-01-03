// backend/controllers/payoutController.js
const db = require("../config/db");
const payoutModel = require("../models/payoutModel");
const projectModel = require("../models/projectModel");
const { convertCurrency } = require("../utils/currencyService");
const Joi = require("joi");

const getPayouts = async (req, res) => {
  try {
    const payouts = await payoutModel.getAllPayouts(db);
    res.json(payouts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching payouts." });
  }
};

const addPayout = async (req, res) => {
  try {
    // 1. Walidacja Joi
    const schema = Joi.object({
      project_id: Joi.number().integer().required(),
      amount: Joi.number().positive().precision(2).required(),
      currency: Joi.string().length(3).uppercase().default("PLN"),
      recipient_name: Joi.string().required(),
      payout_date: Joi.date().iso().required(),
      note: Joi.string().max(1000).allow("", null),
    });

    const { error, value } = schema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { project_id, amount, currency, recipient_name, payout_date, note } =
      value;

    // 2. Pobierz projekt (potrzebna waluta bazowa)
    const project = await projectModel.getProjectById(db, project_id);
    if (!project)
      return res.status(404).json({ message: "Project not found." });

    const projectCurrency = project.currency;

    // 3. Przeliczanie waluty
    let finalAmountForProject = amount; // Domyślnie 1:1

    if (currency !== projectCurrency) {
      finalAmountForProject = await convertCurrency(
        amount,
        currency,
        projectCurrency
      );
    }

    // 4. Zapisz wypłatę
    const newId = await payoutModel.createPayout(db, {
      project_id,
      amount, // np. 1000 PLN (co wyszło z konta)
      currency,
      converted_amount: finalAmountForProject, // np. 230 EUR (co odjęto z salda projektu)
      recipient_name,
      payout_date,
      note,
    });

    // 5. Zaktualizuj amount_paid w projekcie
    await payoutModel.updateProjectPaidAmount(
      db,
      project_id,
      finalAmountForProject
    );

    res.status(201).json({
      id: newId,
      message: `Payout added. Added ${parseFloat(finalAmountForProject).toFixed(
        2
      )} ${projectCurrency} to paid total.`,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: error.message || "Server error adding payout." });
  }
};

const deletePayout = async (req, res) => {
  try {
    const { id } = req.params;
    const payout = await payoutModel.getPayoutById(db, id);

    if (!payout) return res.status(404).json({ message: "Payout not found." });

    const isDeleted = await payoutModel.deletePayout(db, id);

    if (isDeleted) {
      // Cofamy amount_paid w projekcie (używamy zapisanej przeliczonej kwoty)
      const valueToSubtract = payout.converted_amount
        ? parseFloat(payout.converted_amount)
        : parseFloat(payout.amount);

      // Odejmujemy (przekazujemy ujemną wartość do funkcji updateProjectPaidAmount)
      await payoutModel.updateProjectPaidAmount(
        db,
        payout.project_id,
        -Math.abs(valueToSubtract)
      );

      res.json({ message: "Payout deleted, project balance restored." });
    } else {
      res.status(400).json({ message: "Failed to delete payout." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error deleting payout." });
  }
};

module.exports = { getPayouts, addPayout, deletePayout };
