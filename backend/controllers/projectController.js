// backend/controllers/projectController.js
const db = require("../config/db");
const ProjectModel = require("../models/projectModel");
const Joi = require("joi"); // Upewnij się, że masz zainstalowany 'joi'

// --- SCHEMAT WALIDACJI (Dla edycji projektu) ---
const updateProjectSchema = Joi.object({
  // Podstawowe dane
  applicantType: Joi.string()
    .valid("person", "organization", "vetClinic")
    .required(),
  fullName: Joi.string().min(2).max(100).required(),
  animalName: Joi.string().required(),
  animalsCount: Joi.number().integer().min(1).required(),
  species: Joi.string().valid("rat", "guineaPig", "other").required(),
  city: Joi.string().allow(null, ""),

  // Konfiguracja
  slug: Joi.string().required(),
  status: Joi.string()
    .valid("draft", "active", "completed", "cancelled")
    .required(),
  isUrgent: Joi.boolean().default(false),

  // Treści (Tłumaczenia - JSON strings)
  title: Joi.string().required(), // Oczekujemy JSON string z frontendu
  description: Joi.string().required(),
  country: Joi.string().required(),
  age: Joi.string().allow(null, ""),
  speciesOther: Joi.string().allow(null, ""),

  // Finanse
  amountTarget: Joi.number().positive().required(),
  amountCollected: Joi.number().min(0).default(0),
  currency: Joi.string().valid("EUR", "PLN").required(),
  deadline: Joi.string().required(), // YYYY-MM-DD

  // Opcjonalne (np. okładka)
  coverFileId: Joi.number().integer().allow(null),
}).unknown(true); // Pozwala na inne pola (np. files, które ignorujemy w walidacji głównej)

/**
 * GET /api/projects
 * Public – tylko aktywne projekty
 */
const getActiveProjects = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const rows = await ProjectModel.getActiveProjects(connection);
    const formattedProjects = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      isUrgent: !!row.is_urgent,
      title: typeof row.title === "string" ? JSON.parse(row.title) : row.title,
      amountTarget: Number(row.amount_target),
      amountCollected: Number(row.amount_collected),
      currency: row.currency,
      deadline: row.deadline,
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
    const projects = rows.map((row) => ({
      id: row.id,
      requestId: row.request_id,
      status: row.status,
      slug: row.slug,
      isUrgent: !!row.is_urgent,
      animalName: row.animal_name,
      animalsCount: row.animals_count,
      species: row.species,
      speciesOther: row.species_other ? JSON.parse(row.species_other) : null,
      applicantType: row.applicant_type,
      fullName: row.full_name,
      city: row.city,
      country: JSON.parse(row.country),
      amountTarget: Number(row.amount_target),
      amountCollected: Number(row.amount_collected),
      currency: row.currency,
      deadline: row.deadline,
      createdAt: row.created_at,
      title: row.title,
      description: row.description,
      age: row.age,
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
 * Szczegóły projektu dla admina
 */
const getProjectDetails = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const [projectRows] = await connection.query(
      "SELECT * FROM projects WHERE id = ?",
      [id]
    );
    if (projectRows.length === 0)
      return res.status(404).json({ message: "Project not found" });
    const project = projectRows[0];

    const files = await ProjectModel.getProjectFiles(connection, id);
    const updatesRaw = await ProjectModel.getProjectUpdates(connection, id);

    const formattedUpdates = updatesRaw.map((u) => ({
      id: u.id,
      title: typeof u.title === "string" ? JSON.parse(u.title) : u.title,
      content:
        typeof u.content === "string" ? JSON.parse(u.content) : u.content,
      isVisible: !!u.is_visible,
      publishedAt: u.published_at,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      files: u.files.map((f) => ({
        id: f.id,
        url: `${req.protocol}://${req.get("host")}${f.file_path}`,
        type: f.file_type,
        originalName: f.original_name,
      })),
    }));

    // === TU JEST KLUCZOWA ZMIANA ===
    const response = {
      // 1. Jawne przypisanie pól snake_case z bazy do camelCase dla frontendu
      id: project.id,
      requestId: project.request_id,
      slug: project.slug,
      status: project.status,
      createdAt: project.created_at,

      // Te pola powodowały błąd (były NULL przy zapisie):
      applicantType: project.applicant_type, // Baza: applicant_type -> API: applicantType
      fullName: project.full_name, // Baza: full_name -> API: fullName
      animalName: project.animal_name, // Baza: animal_name -> API: animalName
      animalsCount: project.animals_count, // Baza: animals_count -> API: animalsCount

      // Reszta pól
      species: project.species,
      speciesOther: project.species_other,
      city: project.city,
      country: project.country,
      age: project.age,
      isUrgent: !!project.is_urgent,
      amountTarget: Number(project.amount_target),
      amountCollected: Number(project.amount_collected),
      currency: project.currency,
      deadline: project.deadline,
      title: project.title,
      description: project.description,

      // Pliki i newsy
      files: files.map((f) => ({
        id: f.id,
        url: `${req.protocol}://${req.get("host")}${f.file_path}`,
        isCover: !!f.is_cover,
        type: f.file_type,
        originalName: f.original_name,
      })),
      news: formattedUpdates,
    };
    // ================================

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
 */
const addProjectUpdate = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const { title, content, isVisible } = req.body;

    if (!title || !title.pl || !content || !content.pl) {
      return res
        .status(400)
        .json({ error: "Tytuł i treść (wersja PL) są wymagane." });
    }

    const titleJson = JSON.stringify(title);
    const contentJson = JSON.stringify(content);

    const newUpdateId = await ProjectModel.createProjectUpdate(connection, {
      projectId: id,
      title: titleJson,
      content: contentJson,
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
    const { updateId } = req.params;
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

/**
 * PUT /api/projects/admin/:id
 * Aktualizuje dane projektu
 */
const updateProject = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;

    // 1. Walidacja Joi
    const { error, value: data } = updateProjectSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }

    await connection.beginTransaction();

    // 1.5 Walidacja unikalności Sluga
    const isSlugTaken = await ProjectModel.checkSlugExists(
      connection,
      data.slug,
      id
    );

    if (isSlugTaken) {
      await connection.rollback();
      return res.status(409).json({
        code: "SLUG_EXISTS",
        message: "Slug already exists",
      });
    }

    // --- NAPRAWA DATY ---
    let formattedDeadline = data.deadline;
    if (
      formattedDeadline &&
      typeof formattedDeadline === "string" &&
      formattedDeadline.includes("T")
    ) {
      formattedDeadline = formattedDeadline.split("T")[0];
    }

    // --- LOGIKA CZYSZCZENIA SPECIES_OTHER ---
    // Jeśli gatunek to NIE jest 'other', to musimy wyczyścić pole speciesOther (ustawić na null)
    // Niezależnie od tego, co przysłał frontend.
    const finalSpeciesOther =
      data.species === "other" ? data.speciesOther : null;

    // 2. Aktualizacja w bazie
    await ProjectModel.updateProject(connection, id, {
      status: data.status,
      slug: data.slug,
      isUrgent: data.isUrgent,

      applicantType: data.applicantType,
      fullName: data.fullName,
      animalName: data.animalName,
      animalsCount: data.animalsCount,
      species: data.species,
      city: data.city,

      amountTarget: data.amountTarget,
      amountCollected: data.amountCollected,
      currency: data.currency,
      deadline: formattedDeadline,

      title: data.title,
      description: data.description,
      country: data.country,

      // TU UŻYWAMY PRZELICZONEJ WARTOŚCI:
      speciesOther: finalSpeciesOther,

      age: data.age,
    });

    // 3. Obsługa okładki
    if (data.coverFileId !== undefined) {
      await ProjectModel.setProjectCover(connection, id, data.coverFileId);
    }

    await connection.commit();
    res.status(200).json({ message: "Project updated successfully." });
  } catch (error) {
    await connection.rollback();
    console.error("updateProject error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Slug must be unique." });
    }

    res.status(500).json({ error: "Server error during update." });
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
  updateProject,
};
