// backend/models/projectModel.js

const createProject = async (connection, data) => {
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
    data.status,
    data.slug,
    data.isUrgent,
    data.applicantType,
    data.fullName,
    data.animalName,
    data.animalsCount,
    data.species,
    data.city,
    data.amountTarget,
    data.currency,
    data.deadline,
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

// --- NOWA FUNKCJA ---
const getActiveProjects = async (connection) => {
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
  return rows;
};

module.exports = {
  createProject,
  addProjectFiles,
  getActiveProjects, // Eksportujemy nową funkcję
};
