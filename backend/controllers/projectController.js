const db = require("../config/db");

/**
 * GET /api/projects
 * Public – tylko aktywne projekty
 */
const getActiveProjects = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const sql = `
      SELECT 
        p.id,
        p.slug,
        p.is_urgent,
        p.amount_target,
        p.amount_collected,
        p.currency,
        p.deadline,
        p.title,
        pf.file_path AS cover_image
      FROM projects p
      LEFT JOIN project_files pf 
        ON pf.project_id = p.id AND pf.is_cover = 1
      WHERE p.status = 'active'
      ORDER BY p.is_urgent DESC, p.created_at DESC
    `;

    const [rows] = await connection.query(sql);

    res.status(200).json(
      rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        isUrgent: !!row.is_urgent,
        title: JSON.parse(row.title),
        amountTarget: Number(row.amount_target),
        amountCollected: Number(row.amount_collected),
        currency: row.currency,
        deadline: row.deadline,
        image: row.cover_image
          ? `${req.protocol}://${req.get("host")}${row.cover_image}`
          : null,
      }))
    );
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
