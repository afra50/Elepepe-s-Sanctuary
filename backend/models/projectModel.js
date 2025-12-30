// backend/models/projectModel.js

const createProject = async (connection, data) => {
  // 1. Dodałem 'amount_collected' do listy kolumn
  // 2. Dodałem jeden znak zapytania '?' więcej w VALUES
  const sql = `
    INSERT INTO projects (
      request_id, status, slug, is_urgent,
      applicant_type, full_name, animal_name, animals_count, species, city,
      amount_target, amount_collected, currency, deadline,
      title, description, country, species_other, age
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    data.amountCollected, // <--- DODAŁEM TO POLE (musi pasować kolejnością do SQL)
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

const getAllProjects = async (connection) => {
  const sql = `
    SELECT 
      p.*, 
      pf.file_path AS cover_image
    FROM projects p
    LEFT JOIN project_files pf ON pf.project_id = p.id AND pf.is_cover = 1
    ORDER BY p.created_at DESC
  `;

  const [rows] = await connection.query(sql);
  return rows;
};

const getProjectFiles = async (connection, projectId) => {
  const sql = `SELECT * FROM project_files WHERE project_id = ?`;
  const [rows] = await connection.query(sql, [projectId]);
  return rows;
};

// Dodatkowo: Jeśli potrzebujesz pobrać pojedynczy projekt do edycji w adminie (AdminProjectDetails),
// będziesz potrzebował takiej funkcji (jeśli jej jeszcze nie masz):
const getProjectById = async (connection, id) => {
  const sql = `SELECT * FROM projects WHERE id = ?`;
  const [rows] = await connection.query(sql, [id]);
  return rows[0];
};

/**
 * Pobiera aktualności dla danego projektu wraz z plikami.
 * Zwraca tablicę obiektów aktualności, gdzie każda aktualność ma tablicę 'files'.
 */
const getProjectUpdates = async (connection, projectId) => {
  // 1. Pobierz same aktualności
  // Możesz dodać warunek WHERE is_visible = 1, jeśli to endpoint publiczny,
  // ale dla admina chcemy widzieć wszystkie. Obsłużymy to w kontrolerze lub zapytaniu.
  const updatesSql = `
    SELECT * FROM project_updates 
    WHERE project_id = ? 
    ORDER BY created_at DESC
  `;
  const [updates] = await connection.query(updatesSql, [projectId]);

  if (updates.length === 0) return [];

  // 2. Pobierz pliki dla tych aktualności
  // Pobieramy ID znalezionych aktualności
  const updateIds = updates.map((u) => u.id);

  let files = [];
  if (updateIds.length > 0) {
    // Używamy składni IN (?)
    const filesSql = `
      SELECT * FROM project_update_files 
      WHERE project_update_id IN (?)
    `;
    const [filesRows] = await connection.query(filesSql, [updateIds]);
    files = filesRows;
  }

  // 3. Połącz aktualności z ich plikami
  // Dla każdej aktualności filtrujemy pasujące pliki
  const updatesWithFiles = updates.map((update) => {
    return {
      ...update,
      files: files.filter((f) => f.project_update_id === update.id),
    };
  });

  return updatesWithFiles;
};

/**
 * Tworzy nową aktualizację (news) dla projektu.
 * Bez plików - same dane tekstowe.
 */
const createProjectUpdate = async (connection, data) => {
  // Jeśli wpis jest widoczny, ustawiamy published_at na teraz, w przeciwnym razie NULL
  const publishedAt = data.isVisible ? new Date() : null;

  const sql = `
    INSERT INTO project_updates (project_id, title, content, is_visible, published_at)
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [
    data.projectId,
    data.title,
    data.content,
    data.isVisible ? 1 : 0,
    publishedAt,
  ];

  const [result] = await connection.query(sql, values);
  return result.insertId;
};

/**
 * Usuwa wpis z tabeli project_updates
 */
const deleteProjectUpdate = async (connection, id) => {
  const sql = `DELETE FROM project_updates WHERE id = ?`;
  const [result] = await connection.query(sql, [id]);
  return result.affectedRows > 0;
};

/**
 * Dodaje pliki do aktualności
 */
const addUpdateFiles = async (connection, filesData) => {
  if (!filesData || filesData.length === 0) return;
  // Zakładam tabelę: project_update_files (id, project_update_id, file_path, file_type, original_name)
  const sql = `
    INSERT INTO project_update_files (project_update_id, file_path, file_type, original_name) 
    VALUES ?
  `;
  await connection.query(sql, [filesData]);
};

/**
 * Pobiera pliki dla konkretnej aktualności
 */
const getUpdateFiles = async (connection, updateId) => {
  const sql = `SELECT * FROM project_update_files WHERE project_update_id = ?`;
  const [rows] = await connection.query(sql, [updateId]);
  return rows;
};

/**
 * Usuwa pliki aktualności z bazy na podstawie listy ID
 */
const deleteUpdateFiles = async (connection, fileIds) => {
  if (!fileIds || fileIds.length === 0) return;
  const sql = `DELETE FROM project_update_files WHERE id IN (?)`;
  await connection.query(sql, [fileIds]);
};

/**
 * Aktualizuje sam tekst newsa
 */
const updateProjectUpdate = async (connection, updateId, data) => {
  const publishedAt = data.isVisible ? new Date() : null;
  // Uwaga: Jeśli news był już opublikowany, może nie chcemy zmieniać daty publikacji?
  // W prostej wersji nadpisujemy:
  const sql = `
    UPDATE project_updates 
    SET title = ?, content = ?, is_visible = ?
    WHERE id = ?
  `;
  await connection.query(sql, [
    data.title,
    data.content,
    data.isVisible ? 1 : 0,
    updateId,
  ]);
};

/**
 * Aktualizuje dane projektu w bazie.
 */
const updateProject = async (connection, id, data) => {
  const sql = `
    UPDATE projects 
    SET 
      status = ?, 
      slug = ?, 
      is_urgent = ?,
      applicant_type = ?, 
      full_name = ?, 
      animal_name = ?, 
      animals_count = ?, 
      species = ?, 
      city = ?,
      amount_target = ?, 
      amount_collected = ?, 
      currency = ?, 
      deadline = ?,
      title = ?, 
      description = ?, 
      country = ?, 
      species_other = ?, 
      age = ?
    WHERE id = ?
  `;

  const values = [
    data.status,
    data.slug,
    data.isUrgent ? 1 : 0,
    data.applicantType,
    data.fullName,
    data.animalName,
    data.animalsCount,
    data.species,
    data.city,
    data.amountTarget,
    data.amountCollected,
    data.currency,
    data.deadline,
    data.title, // string JSON
    data.description, // string JSON
    data.country, // string JSON
    data.speciesOther, // string JSON (lub null)
    data.age, // string JSON (lub null)
    id,
  ];

  const [result] = await connection.query(sql, values);
  return result.affectedRows > 0;
};

/**
 * Sprawdza czy slug jest zajęty przez INNY projekt
 */
const checkSlugExists = async (connection, slug, excludeId) => {
  const sql = `SELECT id FROM projects WHERE slug = ? AND id != ? LIMIT 1`;
  const [rows] = await connection.query(sql, [slug, excludeId]);
  return rows.length > 0;
};

/**
 * Pobiera ścieżki plików na podstawie listy ID (do usunięcia z dysku)
 */
const getFilesByIds = async (connection, fileIds, projectId) => {
  if (!fileIds || fileIds.length === 0) return [];
  const sql = `SELECT file_path FROM project_files WHERE id IN (?) AND project_id = ?`;
  const [rows] = await connection.query(sql, [fileIds, projectId]);
  return rows;
};

/**
 * Usuwa rekordy plików z bazy
 */
const deleteFiles = async (connection, fileIds, projectId) => {
  if (!fileIds || fileIds.length === 0) return;
  const sql = `DELETE FROM project_files WHERE id IN (?) AND project_id = ?`;
  await connection.query(sql, [fileIds, projectId]);
};

/**
 * Resetuje flagę okładki dla wszystkich plików projektu
 */
const resetProjectCovers = async (connection, projectId) => {
  const sql = `UPDATE project_files SET is_cover = 0 WHERE project_id = ?`;
  await connection.query(sql, [projectId]);
};

/**
 * Ustawia flagę okładki dla konkretnego pliku
 */
const setFileAsCover = async (connection, fileId, projectId) => {
  const sql = `UPDATE project_files SET is_cover = 1 WHERE id = ? AND project_id = ?`;
  await connection.query(sql, [fileId, projectId]);
};

module.exports = {
  createProject,
  addProjectFiles,
  getActiveProjects,
  getAllProjects,
  getProjectFiles,
  getProjectById,
  getProjectUpdates,
  createProjectUpdate,
  deleteProjectUpdate,
  updateProject,
  checkSlugExists,
  getFilesByIds,
  deleteFiles,
  resetProjectCovers,
  setFileAsCover,
  addUpdateFiles,
  getUpdateFiles,
  deleteUpdateFiles,
  updateProjectUpdate,
};
