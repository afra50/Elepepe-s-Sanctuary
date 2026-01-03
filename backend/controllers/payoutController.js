// backend/controllers/payoutController.js
const db = require("../config/db");
const payoutModel = require("../models/payoutModel");
const projectModel = require("../models/projectModel");
const { convertCurrency } = require("../utils/currencyService");
const Joi = require("joi");
const { Parser } = require("json2csv");

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
      // Dodano .max() dla amount, aby pasowało do DECIMAL(10,2)
      amount: Joi.number().positive().precision(2).max(99999999.99).required(),
      currency: Joi.string().length(3).uppercase().default("PLN"),
      // Dodano .max(255) dla recipient_name, aby pasowało do VARCHAR(255)
      recipient_name: Joi.string().max(255).required(),
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

const exportPayoutsCsv = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // 1. Fetch data from DB (applying filters)
    const payouts = await payoutModel.getPayoutsByDateRange(
      db,
      startDate,
      endDate
    );

    if (!payouts.length) {
      return res.status(404).json({
        message: "No data to export for the selected period.",
      });
    }

    // 2. CSV Columns definition (Mapping DB to nice English headers)
    const fields = [
      { label: "Transfer ID", value: "id" },
      {
        label: "Transfer Date",
        value: (row) => new Date(row.payout_date).toISOString().split("T")[0],
      }, // Format YYYY-MM-DD
      { label: "Recipient", value: "recipient_name" },
      { label: "Amount", value: "amount" },
      { label: "Currency", value: "currency" },
      { label: "Amount in Project Currency", value: "converted_amount" }, // optional
      { label: "Project (Source)", value: "project_title" },
      { label: "Note", value: "note" },
      {
        label: "Entry Created At",
        // Changed locale to en-US for consistency, or use ISO
        value: (row) => new Date(row.created_at).toLocaleString("en-US"),
      },
    ];

    // 3. Parser configuration
    const json2csvParser = new Parser({
      fields,
      delimiter: ";", // Excel usually works better with semicolons in some regions, but comma is standard for English CSV. You can keep ';' or change to ','
      withBOM: true, // KEY: Adds BOM so special characters display correctly in Excel
    });

    const csv = json2csvParser.parse(payouts);

    // 4. Set HTTP headers for file download
    const filename = `payouts_${startDate || "start"}_${endDate || "end"}.csv`;

    res.header("Content-Type", "text/csv");
    res.header("Content-Disposition", `attachment; filename="${filename}"`);

    // 5. Send data
    res.status(200).send(csv);
  } catch (error) {
    console.error("CSV Export Error:", error);
    res.status(500).json({ message: "Error generating CSV file." });
  }
};

module.exports = { getPayouts, addPayout, deletePayout, exportPayoutsCsv };
