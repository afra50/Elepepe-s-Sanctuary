// backend/models/internalDonationModel.js

/**
 * Dodaje nową wpłatę własną do bazy.
 */
const createInternalDonation = async (connection, data) => {
  const sql = `
    INSERT INTO internal_donations (
      project_id, amount, currency, converted_amount, donation_date, note
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.project_id,
    data.amount, // Oryginalna kwota (np. 100)
    data.currency || "PLN", // Oryginalna waluta (np. PLN)
    data.convertedAmount, // NOWE: Kwota przeliczona (np. 23.50 EUR)
    data.donation_date,
    data.note || null,
  ];

  const [result] = await connection.query(sql, values);
  return result.insertId;
};

/**
 * Pobiera listę wszystkich wpłat własnych wraz z tytułem projektu.
 * Potrzebne do wyświetlenia listy w panelu admina.
 */
const getAllInternalDonations = async (connection) => {
  const sql = `
    SELECT 
      id.*, 
      p.title as project_title 
    FROM internal_donations id
    LEFT JOIN projects p ON id.project_id = p.id
    ORDER BY id.donation_date DESC, id.created_at DESC
  `;

  const [rows] = await connection.query(sql);
  return rows;
};

/**
 * Pobiera pojedynczą wpłatę po ID.
 * Potrzebne przed usunięciem, aby wiedzieć jaką kwotę odjąć od projektu.
 */
const getInternalDonationById = async (connection, id) => {
  const sql = `SELECT * FROM internal_donations WHERE id = ?`;
  const [rows] = await connection.query(sql, [id]);
  return rows[0];
};

/**
 * Usuwa wpłatę własną.
 */
const deleteInternalDonation = async (connection, id) => {
  const sql = `DELETE FROM internal_donations WHERE id = ?`;
  const [result] = await connection.query(sql, [id]);
  return result.affectedRows > 0;
};

/**
 * POMOCNICZE: Aktualizuje stan zbiórki (amount_collected) o podaną kwotę.
 * Używamy tego przy dodawaniu (+) i usuwaniu (-) wpłaty.
 */
const updateProjectFunds = async (connection, projectId, amountChange) => {
  // amountChange może być dodatnie (dodanie wpłaty) lub ujemne (usunięcie wpłaty)
  const sql = `
    UPDATE projects 
    SET amount_collected = amount_collected + ? 
    WHERE id = ?
  `;
  await connection.query(sql, [amountChange, projectId]);
};

module.exports = {
  createInternalDonation,
  getAllInternalDonations,
  getInternalDonationById,
  deleteInternalDonation,
  updateProjectFunds,
};
