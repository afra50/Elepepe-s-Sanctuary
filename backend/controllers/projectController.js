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

/**
 * GET /api/projects/admin
 * Admin Only – wszystkie projekty
 */
const getAdminProjects = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const rows = await ProjectModel.getAllProjects(connection);

    // Formatowanie danych
    const projects = rows.map((row) => ({
      id: row.id,
      requestId: row.request_id,
      status: row.status, // active, draft, completed, cancelled
      slug: row.slug,
      isUrgent: !!row.is_urgent,

      // Dane podstawowe
      animalName: row.animal_name,
      animalsCount: row.animals_count,
      species: row.species,
      speciesOther: row.species_other ? JSON.parse(row.species_other) : null,
      applicantType: row.applicant_type,
      fullName: row.full_name,
      city: row.city,
      country: JSON.parse(row.country),

      // Finanse
      amountTarget: Number(row.amount_target),
      amountCollected: Number(row.amount_collected),
      currency: row.currency,
      deadline: row.deadline,
      createdAt: row.created_at,

      // Treści (JSON)
      title: row.title, // Zwracamy jako surowy JSON string (frontend sobie parsuje) lub obiekt
      description: row.description,
      age: row.age,

      // Pliki (na liście tylko okładka w formacie tablicy dla spójności z frontendem)
      files: row.cover_image
        ? [
            {
              id: "cover",
              url: `${req.protocol}://${req.get("host")}${row.cover_image}`,
              isCover: 1,
              type: "photo",
            },
          ]
        : [],
    }));

    res.status(200).json(projects);
  } catch (error) {
    console.error("getAdminProjects error:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    connection.release();
  }
};

/**
 * GET /api/projects/admin/:id
 * Szczegóły projektu dla admina (wraz ze wszystkimi plikami)
 */
const getProjectDetails = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;

    // 1. Pobierz projekt (możemy użyć getAllProjects z filtrem w pamięci lub dodać getProjectById w modelu)
    // Dla optymalizacji lepiej dodać getProjectById, ale tutaj użyjemy szybkiego zapytania
    const [projectRows] = await connection.query(
      "SELECT * FROM projects WHERE id = ?",
      [id]
    );
    if (projectRows.length === 0)
      return res.status(404).json({ message: "Project not found" });
    const project = projectRows[0];

    // 2. Pobierz pliki
    const files = await ProjectModel.getProjectFiles(connection, id);

    // 3. Formatowanie
    const response = {
      ...project,
      isUrgent: !!project.is_urgent,
      amountTarget: Number(project.amount_target),
      amountCollected: Number(project.amount_collected),
      // Parsowanie pól JSON, jeśli w bazie są stringami
      title: project.title,
      description: project.description,
      country: project.country, // frontend oczekuje stringa JSON czy obiektu?
      // W AdminProjects.js używasz JSON.parse(p.title), więc wyślij stringa.
      age: project.age,
      speciesOther: project.species_other,

      // Mapowanie camelCase
      animalName: project.animal_name,
      animalsCount: project.animals_count,
      applicantType: project.applicant_type,
      fullName: project.full_name,
      requestId: project.request_id,
      createdAt: project.created_at,

      files: files.map((f) => ({
        id: f.id,
        url: `${req.protocol}://${req.get("host")}${f.file_path}`,
        isCover: !!f.is_cover,
        type: f.file_type,
        originalName: f.original_name,
      })),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("getProjectDetails error:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    connection.release();
  }
};

module.exports = {
  getActiveProjects,
  getAdminProjects,
  getProjectDetails,
};
