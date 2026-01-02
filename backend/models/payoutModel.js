// backend/models/payoutModel.js

const createPayout = async (connection, data) => {
  const sql = `
    INSERT INTO payouts (
      project_id, amount, currency, converted_amount, recipient_name, payout_date, note
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.project_id,
    data.amount,
    data.currency,
    data.converted_amount,
    data.recipient_name,
    data.payout_date,
    data.note,
  ];

  const [result] = await connection.query(sql, values);
  return result.insertId;
};

const getAllPayouts = async (connection) => {
  const sql = `
    SELECT 
      py.*, 
      p.title as project_title,
      p.amount_collected as project_collected,
      p.amount_paid as project_paid,
      p.currency as project_currency
    FROM payouts py
    LEFT JOIN projects p ON py.project_id = p.id
    ORDER BY py.payout_date DESC, py.created_at DESC
  `;
  const [rows] = await connection.query(sql);
  return rows;
};

const getPayoutById = async (connection, id) => {
  const sql = `SELECT * FROM payouts WHERE id = ?`;
  const [rows] = await connection.query(sql, [id]);
  return rows[0];
};

const deletePayout = async (connection, id) => {
  const sql = `DELETE FROM payouts WHERE id = ?`;
  const [result] = await connection.query(sql, [id]);
  return result.affectedRows > 0;
};

/**
 * Aktualizuje sumę wypłaconą w projekcie.
 * amountChange może być dodatnie (dodanie wypłaty) lub ujemne (usunięcie).
 */
const updateProjectPaidAmount = async (connection, projectId, amountChange) => {
  const sql = `
    UPDATE projects 
    SET amount_paid = amount_paid + ? 
    WHERE id = ?
  `;
  await connection.query(sql, [amountChange, projectId]);
};

module.exports = {
  createPayout,
  getAllPayouts,
  getPayoutById,
  deletePayout,
  updateProjectPaidAmount,
};
