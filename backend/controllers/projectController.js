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

    // 1. Pobierz dane projektu
    const [projectRows] = await connection.query(
      "SELECT * FROM projects WHERE id = ?",
      [id]
    );
    if (projectRows.length === 0)
      return res.status(404).json({ message: "Project not found" });
    const project = projectRows[0];

    // 2. Pobierz pliki projektu (galeria/dokumenty zbiórki)
    const files = await ProjectModel.getProjectFiles(connection, id);

    // 3. Pobierz aktualności (newsy) --- NOWOŚĆ
    const updatesRaw = await ProjectModel.getProjectUpdates(connection, id);

    // Formatowanie aktualności dla frontendu
    const formattedUpdates = updatesRaw.map((u) => ({
      id: u.id,
      title: u.title, // tu zakładam, że w bazie jest tekst, jeśli JSON to JSON.parse(u.title)
      content: u.content,
      isVisible: !!u.is_visible,
      publishedAt: u.published_at,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      // Formatowanie plików aktualności
      files: u.files.map((f) => ({
        id: f.id,
        url: `${req.protocol}://${req.get("host")}${f.file_path}`,
        type: f.file_type,
        originalName: f.original_name,
      })),
    }));

    // 4. Formatowanie głównego obiektu odpowiedzi
    const response = {
      ...project,
      isUrgent: !!project.is_urgent,
      amountTarget: Number(project.amount_target),
      amountCollected: Number(project.amount_collected),
      title: project.title,
      description: project.description,
      country: project.country,
      age: project.age,
      speciesOther: project.species_other,
      animalName: project.animal_name,
      animalsCount: project.animals_count,
      applicantType: project.applicant_type,
      fullName: project.full_name,
      requestId: project.request_id,
      createdAt: project.created_at,

      // Pliki główne projektu
      files: files.map((f) => ({
        id: f.id,
        url: `${req.protocol}://${req.get("host")}${f.file_path}`,
        isCover: !!f.is_cover,
        type: f.file_type,
        originalName: f.original_name,
      })),

      // Aktualności --- NOWOŚĆ
      news: formattedUpdates,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("getProjectDetails error:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    connection.release();
  }
};

/**
 * POST /api/projects/:id/updates
 * Tworzy nową aktualność dla projektu
 */
const addProjectUpdate = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    // Oczekujemy, że title i content to obiekty: { pl: "...", en: "...", es: "..." }
    const { title, content, isVisible } = req.body;

    // Prosta walidacja - sprawdzamy czy istnieje wersja PL (jako domyślna)
    if (!title || !title.pl || !content || !content.pl) {
      return res
        .status(400)
        .json({ error: "Tytuł i treść (wersja PL) są wymagane." });
    }

    // KONWERSJA NA STRING JSON DLA BAZY DANYCH
    // Baza przyjmuje LONGTEXT, więc musimy zamienić obiekt na string
    const titleJson = JSON.stringify(title);
    const contentJson = JSON.stringify(content);

    const newUpdateId = await ProjectModel.createProjectUpdate(connection, {
      projectId: id,
      title: titleJson, // <-- Przekazujemy string JSON
      content: contentJson, // <-- Przekazujemy string JSON
      isVisible,
    });

    res.status(201).json({
      message: "Aktualność dodana",
      id: newUpdateId,
    });
  } catch (error) {
    console.error("addProjectUpdate error:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    connection.release();
  }
};

/**
 * DELETE /api/projects/:id/updates/:updateId
 */
const deleteProjectUpdate = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { updateId } = req.params; // ID newsa do usunięcia

    const deleted = await ProjectModel.deleteProjectUpdate(
      connection,
      updateId
    );

    if (!deleted) {
      return res.status(404).json({ error: "Nie znaleziono aktualności." });
    }

    res.status(200).json({ message: "Aktualność usunięta." });
  } catch (error) {
    console.error("deleteProjectUpdate error:", error);
    res.status(500).json({ error: "Błąd serwera." });
  } finally {
    connection.release();
  }
};

module.exports = {
  getActiveProjects,
  getAdminProjects,
  getProjectDetails,
  addProjectUpdate,
  deleteProjectUpdate,
};
