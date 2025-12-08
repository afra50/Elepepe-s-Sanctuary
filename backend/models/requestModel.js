// backend/models/requestModel.js

const createRequest = async (connection, data) => {
  const sql = `
    INSERT INTO requests (
      full_name, email, phone, country, city,
      species, species_other, animal_name, age, animals_count,
      description, amount, currency, amount_type, deadline,
      treatment_ongoing, needs_installments, other_fundraiser_link, other_help,
      payout_name, payout_iban, payout_bank_name, payout_bank_country, payout_swift, payout_address,
      consent_data_processing, consent_truth, consent_public_story
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
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

module.exports = {
  createRequest,
  addFiles,
};
