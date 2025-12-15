// backend/models/projectModel.js

const createProject = async (connection, data) => {
  // Dodałem 'is_urgent' do zapytania SQL
  const sql = `
    INSERT INTO projects (
      request_id, status, slug, is_urgent,
      applicant_type, full_name, animal_name, animals_count, species, city,
      amount_target, currency, deadline,
      title, description, country, species_other, age
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.requestId,
    data.status, // Teraz dynamicznie: 'draft' lub 'active' z formularza
    data.slug, // Teraz dynamicznie: slug z formularza
    data.isUrgent, // Nowe pole: 1 lub 0

    data.applicantType,
    data.fullName,
    data.animalName,
    data.animalsCount,
    data.species,
    data.city,

    data.amountTarget,
    data.currency,
    data.deadline,

    // JSONy (już przygotowane jako stringi w kontrolerze)
    data.title,
    data.description,
    data.country,
    data.speciesOther,
    data.age,
  ];

  const [result] = await connection.query(sql, values);
  return result.insertId;
};

const addProjectFiles = async (connection, filesData) => {
  const sql = `
    INSERT INTO project_files (project_id, file_path, file_type, original_name, is_cover) 
    VALUES ?
  `;

  if (!filesData || filesData.length === 0) return;

  const [result] = await connection.query(sql, [filesData]);
  return result;
};

module.exports = {
  createProject,
  addProjectFiles,
};
