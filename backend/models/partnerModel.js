// backend/models/partnerModel.js
//
// Tabela: partners
// kolumny: id, name_pl, name_en, name_es,
//          description_pl, description_en, description_es,
//          country_pl, country_en, country_es,
//          logo_path

const createPartner = async (connection, data) => {
  const sql = `
    INSERT INTO partners (
      name_pl, name_en, name_es,
      description_pl, description_en, description_es,
      country_pl, country_en, country_es
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.namePl,
    data.nameEn,
    data.nameEs,
    data.descriptionPl,
    data.descriptionEn,
    data.descriptionEs,
    data.countryPl,
    data.countryEn,
    data.countryEs,
  ];

  const [result] = await connection.query(sql, values);
  return result.insertId;
};

const updatePartner = async (connection, id, data) => {
  const sql = `
    UPDATE partners
    SET
      name_pl = ?,
      name_en = ?,
      name_es = ?,
      description_pl = ?,
      description_en = ?,
      description_es = ?,
      country_pl = ?,
      country_en = ?,
      country_es = ?
    WHERE id = ?
  `;

  const values = [
    data.namePl,
    data.nameEn,
    data.nameEs,
    data.descriptionPl,
    data.descriptionEn,
    data.descriptionEs,
    data.countryPl,
    data.countryEn,
    data.countryEs,
    id,
  ];

  const [result] = await connection.query(sql, values);
  return result.affectedRows;
};

const updateLogoPath = async (connection, id, logoPath) => {
  const sql = `UPDATE partners SET logo_path = ? WHERE id = ?`;
  const [result] = await connection.query(sql, [logoPath, id]);
  return result.affectedRows;
};

const getPartners = async (connection) => {
  const sql = `
    SELECT
      id,
      name_pl AS namePl,
      name_en AS nameEn,
      name_es AS nameEs,
      description_pl AS descriptionPl,
      description_en AS descriptionEn,
      description_es AS descriptionEs,
      country_pl AS countryPl,
      country_en AS countryEn,
      country_es AS countryEs,
      logo_path AS logoPath
    FROM partners
    ORDER BY id DESC
  `;

  const [rows] = await connection.query(sql);
  return rows;
};

const getPartnerById = async (connection, id) => {
  const sql = `
    SELECT
      id,
      name_pl AS namePl,
      name_en AS nameEn,
      name_es AS nameEs,
      description_pl AS descriptionPl,
      description_en AS descriptionEn,
      description_es AS descriptionEs,
      country_pl AS countryPl,
      country_en AS countryEn,
      country_es AS countryEs,
      logo_path AS logoPath
    FROM partners
    WHERE id = ?
  `;
  const [rows] = await connection.query(sql, [id]);
  return rows[0];
};

const deletePartner = async (connection, id) => {
  const sql = `DELETE FROM partners WHERE id = ?`;
  const [result] = await connection.query(sql, [id]);
  return result.affectedRows;
};

module.exports = {
  createPartner,
  updatePartner,
  updateLogoPath,
  getPartners,
  getPartnerById,
  deletePartner,
};
