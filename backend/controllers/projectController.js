// backend/controllers/projectController.js
const db = require("../config/db");
const ProjectModel = require("../models/projectModel");

/**
 * GET /api/projects
 * Public – tylko aktywne projekty
 */
const getActiveProjects = async (req, res) => {
  const connection = await db.getConnection();
  try {
    // Pobieramy surowe dane z modelu
    const rows = await ProjectModel.getActiveProjects(connection);

    // Formatujemy dane dla frontendu
    const formattedProjects = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      isUrgent: !!row.is_urgent, // Konwersja 1/0 na true/false
      title: typeof row.title === "string" ? JSON.parse(row.title) : row.title, // Bezpieczne parsowanie
      amountTarget: Number(row.amount_target),
      amountCollected: Number(row.amount_collected),
      currency: row.currency,
      deadline: row.deadline,
      // Budowanie pełnego URL do zdjęcia
      image: row.cover_image
        ? `${req.protocol}://${req.get("host")}${row.cover_image}`
        : null,
    }));

    res.status(200).json(formattedProjects);
  } catch (error) {
    console.error("getActiveProjects error:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    connection.release();
  }
};

module.exports = {
  getActiveProjects,
};
