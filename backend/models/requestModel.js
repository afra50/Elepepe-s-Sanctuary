// backend/models/requestModel.js

const createRequest = async (connection, data) => {
  const sql = `
    INSERT INTO requests (
      applicant_type,
      full_name, email, phone, country, city,
      species, species_other, animal_name, age, animals_count,
      description, amount, currency, amount_type, deadline,
      treatment_ongoing, needs_installments, other_fundraiser_link, other_help,
      payout_name, payout_iban, payout_bank_name, payout_bank_country, payout_swift, payout_address,
      consent_data_processing, consent_truth, consent_public_story,
      submission_language
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.applicantType,
    data.fullName,
    data.email,
    data.phone,
    data.country,
    data.city,
    data.species,
    data.speciesOther,
    data.animalName,
    data.age,
    data.animalsCount,
    data.description,
    data.amount,
    data.currency,
    data.amountType,
    data.deadline,
    data.treatmentOngoing,
    data.needsInstallments,
    data.otherFundraiserLink,
    data.otherHelp,
    data.payoutName,
    data.payoutIban,
    data.payoutBankName,
    data.payoutBankCountry,
    data.payoutSwift,
    data.payoutAddress,
    data.consentDataProcessing,
    data.consentTruth,
    data.consentPublicStory,
    data.submissionLanguage,
  ];

  const [result] = await connection.query(sql, values);
  return result.insertId;
};

const addFiles = async (connection, filesData) => {
  // filesData should be an array of arrays: [[requestId, filePath, fileType, originalName], ...]
  const sql = `
    INSERT INTO request_files (request_id, file_path, file_type, original_name) 
    VALUES ?
  `;

  const [result] = await connection.query(sql, [filesData]);
  return result;
};

const getRequests = async (connection, filters = {}) => {
  let sql = `
    SELECT 
      id, 
      applicant_type AS applicantType, 
      full_name AS fullName, 
      amount, 
      currency, 
      deadline, 
      species, 
      species_other AS speciesOther,
      animals_count AS animalsCount, 
      submission_language AS submissionLanguage, 
      created_at AS createdAt, 
      status,
      country
    FROM requests
  `;

  const values = [];
  const whereClauses = [];

  // Filter by status if provided (pending, approved, rejected)
  if (filters.status) {
    whereClauses.push("status = ?");
    values.push(filters.status);
  }

  if (whereClauses.length > 0) {
    sql += " WHERE " + whereClauses.join(" AND ");
  }

  // Order by newest first
  sql += " ORDER BY created_at DESC";

  const [rows] = await connection.query(sql, values);
  return rows;
};

const getRequestById = async (connection, id) => {
  const sql = `SELECT * FROM requests WHERE id = ?`;
  const [rows] = await connection.query(sql, [id]);
  return rows[0];
};

const getFilesByRequestId = async (connection, requestId) => {
  const sql = `
    SELECT id, file_path, file_type, original_name, created_at 
    FROM request_files 
    WHERE request_id = ?
  `;
  const [rows] = await connection.query(sql, [requestId]);
  return rows;
};

module.exports = {
  createRequest,
  addFiles,
  getRequests,
  getRequestById,
  getFilesByRequestId,
};
