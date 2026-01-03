// backend/controllers/projectController.js
const db = require("../config/db");
const ProjectModel = require("../models/projectModel");
const Joi = require("joi");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs"); // Do sprawdzenia istnienia pliku
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

// --- HELPERY ---

/**
 * Sprawdza czy string jest poprawnym JSONem i czy ma wymaganą strukturę (np. klucz 'pl')
 */
const validateJsonString = (value, helpers) => {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || !parsed.pl || !parsed.pl.trim()) {
      return helpers.message("Pole (PL) jest wymagane w tłumaczeniach.");
    }
    return value; // Zwracamy oryginalny string (lub obiekt, backend sobie poradzi)
  } catch (e) {
    return helpers.message("Niepoprawny format JSON dla pól tłumaczonych.");
  }
};

// --- SCHEMATY WALIDACJI (JOI) ---

// 1. Walidacja edycji projektu
const updateProjectSchema = Joi.object({
  applicantType: Joi.string()
    .valid("person", "organization", "vetClinic")
    .required(),
  fullName: Joi.string().min(2).max(100).required(),
  animalName: Joi.string().required(),
  animalsCount: Joi.number().integer().min(1).required(),
  species: Joi.string().valid("rat", "guineaPig", "other").required(),
  city: Joi.string().allow(null, ""),

  slug: Joi.string().required(),
  status: Joi.string()
    .valid("draft", "active", "completed", "cancelled")
    .required(),
  isUrgent: Joi.boolean().default(false), // Frontend może przysłać "true" string, Joi to przekonwertuje

  // Pola JSON (Frontend wysyła JSON stringi)
  title: Joi.custom(validateJsonString).required(),
  description: Joi.custom(validateJsonString).required(),
  country: Joi.custom(validateJsonString).required(),
  age: Joi.string().allow(null, ""), // Tu też przychodzi JSON string, ale jest opcjonalny
  speciesOther: Joi.string().allow(null, ""), // JSON string lub null

  amountTarget: Joi.number().positive().required(),
  amountCollected: Joi.number().min(0).default(0),
  currency: Joi.string().valid("EUR", "PLN").required(),
  deadline: Joi.string().required(),

  // Opcjonalne
  coverFileId: Joi.alternatives()
    .try(Joi.number(), Joi.string())
    .allow(null, ""),
}).unknown(true); // Pozwala na pola plików (newPhotos, itp.)

// 2. Walidacja aktualności (News)
const projectUpdateSchema = Joi.object({
  title: Joi.custom(validateJsonString).required(),
  content: Joi.custom(validateJsonString).required(),
  isVisible: Joi.boolean().default(true), // Joi zamieni string "true" na bool
  filesToDelete: Joi.string().allow(null, ""), // JSON string tablicy ID
}).unknown(true); // Pozwala na req.files

// --- KONTROLERY ---

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
 * GET /api/projects/completed
 * Public – zakończone projekty
 */
const getCompletedProjects = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const rows = await ProjectModel.getCompletedProjects(connection);
    const formatted = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: JSON.parse(row.title),
      amountTarget: Number(row.amount_target),
      amountCollected: Number(row.amount_collected),
      currency: row.currency,
      deadline: row.deadline,
      image: row.cover_image
        ? `${req.protocol}://${req.get("host")}${row.cover_image}`
        : null,
    }));
    res.status(200).json(formatted);
  } catch (e) {
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
      title: row.title, // Tutaj zwracamy raw string JSON z bazy
      description: row.description, // Tutaj zwracamy raw string JSON z bazy
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
      files: u.files.map((f) => ({
        id: f.id,
        url: `${req.protocol}://${req.get("host")}${f.file_path}`,
        type: f.file_type,
        originalName: f.original_name,
      })),
    }));

    const response = {
      id: project.id,
      requestId: project.request_id,
      slug: project.slug,
      status: project.status,
      createdAt: project.created_at,
      applicantType: project.applicant_type,
      fullName: project.full_name,
      animalName: project.animal_name,
      animalsCount: project.animals_count,
      species: project.species,
      speciesOther: project.species_other, // raw JSON string
      city: project.city,
      country: project.country, // raw JSON string
      age: project.age, // raw JSON string
      isUrgent: !!project.is_urgent,
      amountTarget: Number(project.amount_target),
      amountCollected: Number(project.amount_collected),
      currency: project.currency,
      deadline: project.deadline,
      title: project.title, // raw JSON string
      description: project.description, // raw JSON string
      files: files.map((f) => ({
        id: f.id,
        url: `${req.protocol}://${req.get("host")}${f.file_path}`,
        isCover: !!f.is_cover,
        type: f.file_type,
        originalName: f.original_name,
      })),
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
 * Dodaje aktualność wraz z plikami
 */
const addProjectUpdate = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;

    // 1. Walidacja danych wejściowych
    const { error, value: data } = projectUpdateSchema.validate(req.body, {
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

    // 2. Zapisz tekst aktualności
    // UWAGA: data.title jest stringiem JSON otrzymanym z frontendu.
    // Nie robimy tu ponownego JSON.stringify, bo zrobilibyśmy podwójne kodowanie.
    const newUpdateId = await ProjectModel.createProjectUpdate(connection, {
      projectId: id,
      title: data.title,
      content: data.content,
      isVisible: data.isVisible,
    });

    // 3. Obsługa plików
    if (req.files && req.files.length > 0) {
      const filesToInsert = [];
      const baseDir = path.join(
        process.cwd(),
        "uploads",
        "projects",
        String(id),
        "updates"
      );
      const photosDir = path.join(baseDir, "photos");
      const docsDir = path.join(baseDir, "documents");

      await fs.mkdir(photosDir, { recursive: true });
      await fs.mkdir(docsDir, { recursive: true });

      for (const file of req.files) {
        let filePath;
        let fileType;
        const uniqueId = uuidv4();

        if (file.mimetype.startsWith("image/")) {
          const filename = `${uniqueId}.webp`;
          await sharp(file.buffer)
            .resize({ width: 1000, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(path.join(photosDir, filename));

          filePath = `/uploads/projects/${id}/updates/photos/${filename}`;
          fileType = "photo";
        } else {
          let ext = path.extname(file.originalname) || ".bin";
          const filename = `${uniqueId}${ext}`;
          await fs.writeFile(path.join(docsDir, filename), file.buffer);

          filePath = `/uploads/projects/${id}/updates/documents/${filename}`;
          fileType = "document";
        }

        // Dekodowanie nazwy pliku (jeśli przyszła zakodowana, choć multer zazwyczaj radzi sobie w utf8)
        const originalName = Buffer.from(file.originalname, "latin1").toString(
          "utf8"
        );

        filesToInsert.push([
          newUpdateId,
          filePath,
          fileType,
          originalName || file.originalname,
        ]);
      }

      await ProjectModel.addUpdateFiles(connection, filesToInsert);
    }

    await connection.commit();
    res
      .status(201)
      .json({ message: "Update added successfully", id: newUpdateId });
  } catch (error) {
    await connection.rollback();
    console.error("addProjectUpdate error:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    connection.release();
  }
};

/**
 * PUT /api/projects/:id/updates/:updateId
 * Edycja aktualności
 */
const editProjectUpdate = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id, updateId } = req.params;

    // 1. Walidacja
    const { error, value: data } = projectUpdateSchema.validate(req.body, {
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

    // 2. Aktualizacja tekstu
    await ProjectModel.updateProjectUpdate(connection, updateId, {
      title: data.title,
      content: data.content,
      isVisible: data.isVisible,
    });

    // 3. Usuwanie plików
    if (data.filesToDelete) {
      let idsToDelete = [];
      try {
        idsToDelete = JSON.parse(data.filesToDelete);
      } catch (e) {}

      if (idsToDelete.length > 0) {
        const [filesRows] = await connection.query(
          "SELECT file_path FROM project_update_files WHERE id IN (?)",
          [idsToDelete]
        );

        for (const file of filesRows) {
          try {
            const fullPath = path.join(process.cwd(), file.file_path);
            // Sprawdzenie czy plik istnieje przed usunięciem
            if (fsSync.existsSync(fullPath)) {
              await fs.unlink(fullPath);
            }
          } catch (e) {
            console.warn("File delete error:", e.message);
          }
        }

        await ProjectModel.deleteUpdateFiles(connection, idsToDelete);
      }
    }

    // 4. Dodawanie nowych plików
    if (req.files && req.files.length > 0) {
      const filesToInsert = [];
      const baseDir = path.join(
        process.cwd(),
        "uploads",
        "projects",
        String(id),
        "updates"
      );
      const photosDir = path.join(baseDir, "photos");
      const docsDir = path.join(baseDir, "documents");

      await fs.mkdir(photosDir, { recursive: true });
      await fs.mkdir(docsDir, { recursive: true });

      for (const file of req.files) {
        let filePath;
        let fileType;
        const uniqueId = uuidv4();

        if (file.mimetype.startsWith("image/")) {
          const filename = `${uniqueId}.webp`;
          await sharp(file.buffer)
            .resize({ width: 1000, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(path.join(photosDir, filename));

          filePath = `/uploads/projects/${id}/updates/photos/${filename}`;
          fileType = "photo";
        } else {
          let ext = path.extname(file.originalname) || ".bin";
          const filename = `${uniqueId}${ext}`;
          await fs.writeFile(path.join(docsDir, filename), file.buffer);

          filePath = `/uploads/projects/${id}/updates/documents/${filename}`;
          fileType = "document";
        }

        const originalName = Buffer.from(file.originalname, "latin1").toString(
          "utf8"
        );

        filesToInsert.push([
          updateId,
          filePath,
          fileType,
          originalName || file.originalname,
        ]);
      }
      await ProjectModel.addUpdateFiles(connection, filesToInsert);
    }

    await connection.commit();
    res.status(200).json({ message: "Update edited successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("editProjectUpdate error:", error);
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

    const files = await ProjectModel.getUpdateFiles(connection, updateId);

    for (const file of files) {
      try {
        const fullPath = path.join(process.cwd(), file.file_path);
        if (fsSync.existsSync(fullPath)) {
          await fs.unlink(fullPath);
        }
      } catch (e) {
        console.warn(`Could not delete file ${file.file_path}`, e.message);
      }
    }

    if (files.length > 0) {
      const ids = files.map((f) => f.id);
      await ProjectModel.deleteUpdateFiles(connection, ids);
    }

    const deleted = await ProjectModel.deleteProjectUpdate(
      connection,
      updateId
    );

    if (!deleted) return res.status(404).json({ error: "Update not found." });

    res.status(200).json({ message: "Update deleted." });
  } catch (error) {
    console.error("deleteProjectUpdate error:", error);
    res.status(500).json({ error: "Server error." });
  } finally {
    connection.release();
  }
};

/**
 * PUT /api/projects/admin/:id
 * Aktualizuje dane projektu oraz zarządza plikami
 */
const updateProject = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;

    // 1. Walidacja
    const { error, value: data } = updateProjectSchema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }

    await connection.beginTransaction();

    // 2. Slug check
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

    // 3. Formatowanie danych
    let formattedDeadline = data.deadline;
    if (formattedDeadline && formattedDeadline.includes("T")) {
      formattedDeadline = formattedDeadline.split("T")[0];
    }

    // Jeśli gatunek nie jest 'other', czyścimy pole speciesOther
    const finalSpeciesOther =
      data.species === "other" ? data.speciesOther : null;

    // 4. Update tekstowy (Model)
    await ProjectModel.updateProject(connection, id, {
      status: data.status,
      slug: data.slug,
      isUrgent: data.isUrgent === "true" || data.isUrgent === true,
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
      speciesOther: finalSpeciesOther,
      age: data.age,
    });

    // =========================================================
    // 5. OBSŁUGA PLIKÓW
    // =========================================================

    // A. USUWANIE PLIKÓW
    if (req.body.filesToDelete) {
      let filesToDeleteIds = [];
      try {
        filesToDeleteIds = JSON.parse(req.body.filesToDelete);
      } catch (e) {}

      if (Array.isArray(filesToDeleteIds) && filesToDeleteIds.length > 0) {
        const filesRows = await ProjectModel.getFilesByIds(
          connection,
          filesToDeleteIds,
          id
        );

        for (const file of filesRows) {
          // Bezpieczeństwo: nie usuwamy plików z requests
          if (file.file_path.includes("/uploads/requests/")) {
            continue;
          }

          try {
            const filePath = path.join(process.cwd(), file.file_path);
            if (fsSync.existsSync(filePath)) {
              await fs.unlink(filePath);
            }
          } catch (err) {
            console.warn(
              `Could not delete file ${file.file_path}:`,
              err.message
            );
          }
        }

        await ProjectModel.deleteFiles(connection, filesToDeleteIds, id);
      }
    }

    // B. ZARZĄDZANIE OKŁADKĄ
    if (req.body.coverFileId !== undefined) {
      await ProjectModel.resetProjectCovers(connection, id);
      if (req.body.coverFileId && !isNaN(req.body.coverFileId)) {
        await ProjectModel.setFileAsCover(connection, req.body.coverFileId, id);
      }
    }

    // C. DODAWANIE NOWYCH PLIKÓW
    const filesToInsert = [];
    let newFileNamesMap = {};
    if (req.body.newFileNames) {
      try {
        newFileNamesMap = JSON.parse(req.body.newFileNames);
      } catch (e) {}
    }

    const baseProjectDir = path.join(
      process.cwd(),
      "uploads",
      "projects",
      String(id)
    );
    const photosDir = path.join(baseProjectDir, "photos");
    const documentsDir = path.join(baseProjectDir, "documents");

    if (req.files && (req.files["newPhotos"] || req.files["newDocuments"])) {
      if (req.files["newPhotos"]?.length > 0)
        await fs.mkdir(photosDir, { recursive: true });
      if (req.files["newDocuments"]?.length > 0)
        await fs.mkdir(documentsDir, { recursive: true });
    }

    // --- Zdjęcia ---
    if (req.files && req.files["newPhotos"]) {
      for (const file of req.files["newPhotos"]) {
        const tempId = path.parse(file.originalname).name;
        // Sprawdź czy mamy oryginalną nazwę z mapy, jeśli nie to weź z pliku
        // Pamiętaj o dekodowaniu polskich znaków jeśli multer nie ogarnął
        let originalRealName = newFileNamesMap[tempId] || file.originalname;
        originalRealName = Buffer.from(originalRealName, "latin1").toString(
          "utf8"
        );

        const uniqueName = `${uuidv4()}.webp`;

        await sharp(file.buffer)
          .resize({ width: 1200, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(path.join(photosDir, uniqueName));

        // Jeśli nowy plik jest okładką (przekazany jako ID tymczasowe)
        const isCover = req.body.coverFileId === tempId ? 1 : 0;

        filesToInsert.push([
          id,
          `/uploads/projects/${id}/photos/${uniqueName}`,
          "photo",
          originalRealName,
          isCover,
        ]);
      }
    }

    // --- Dokumenty ---
    if (req.files && req.files["newDocuments"]) {
      for (const file of req.files["newDocuments"]) {
        const tempId = path.parse(file.originalname).name;
        let originalRealName = newFileNamesMap[tempId] || file.originalname;
        originalRealName = Buffer.from(originalRealName, "latin1").toString(
          "utf8"
        );

        let ext = path.extname(originalRealName);
        if (!ext) ext = ".bin";
        const uniqueName = `${uuidv4()}${ext}`;

        await fs.writeFile(path.join(documentsDir, uniqueName), file.buffer);

        filesToInsert.push([
          id,
          `/uploads/projects/${id}/documents/${uniqueName}`,
          "document",
          originalRealName,
          0,
        ]);
      }
    }

    if (filesToInsert.length > 0) {
      await ProjectModel.addProjectFiles(connection, filesToInsert);
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

const getPublicProjectBySlug = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { slug } = req.params;

    const rows = await ProjectModel.getPublicProjectBySlug(connection, slug);

    if (!rows.length) {
      return res.status(404).json({ message: "Project not found" });
    }

    const project = rows[0];

    // ===== FILES =====
    const photos = [];
    const documents = [];
    let cover = null;

    rows.forEach((row) => {
      if (!row.file_path) return;

      const fileUrl = `${req.protocol}://${req.get("host")}${row.file_path}`;

      if (row.file_type === "photo") {
        if (row.is_cover) cover = fileUrl;
        photos.push(fileUrl);
      }

      if (row.file_type === "document") {
        documents.push({
          name: row.original_name,
          url: fileUrl,
        });
      }
    });

    // ===== APPLICANT LABEL =====
    const applicantLabels = {
      person: {
        pl: "Opiekun prywatny",
        en: "Private caregiver",
        es: "Cuidador particular",
      },
      organization: {
        pl: "Fundacja / Organizacja",
        en: "Foundation / Organization",
        es: "Fundación / Organización",
      },
      vetClinic: {
        pl: "Gabinet weterynaryjny",
        en: "Veterinary clinic",
        es: "Clínica veterinaria",
      },
    };

    // ===== UPDATES =====
    const updatesRaw = await ProjectModel.getProjectUpdates(
      connection,
      project.id
    );

    const updates = updatesRaw
      .filter((u) => u.is_visible)
      .map((u) => ({
        id: u.id,
        title: JSON.parse(u.title),
        content: JSON.parse(u.content),
        publishedAt: u.published_at,
        files: u.files.map((f) => ({
          name: f.original_name,
          url: `${req.protocol}://${req.get("host")}${f.file_path}`,
          type: f.file_type,
        })),
      }));

    // ===== RESPONSE =====
    res.status(200).json({
      id: project.id,
      slug: project.slug,
      isUrgent: !!project.is_urgent,

      title: JSON.parse(project.title),
      description: JSON.parse(project.description),

      animal: {
        name: project.animal_name,
        species: project.species,
        speciesOther: project.species_other
          ? JSON.parse(project.species_other)
          : null,
        count: project.animals_count,
        age: project.age ? JSON.parse(project.age) : null,
      },

      location: {
        city: project.city,
        country: JSON.parse(project.country),
      },

      applicant: {
        label: applicantLabels[project.applicant_type],
        name: project.full_name,
      },

      finance: {
        target: Number(project.amount_target),
        collected: Number(project.amount_collected),
        currency: project.currency,
        deadline: project.deadline,
      },

      gallery: {
        cover,
        photos,
        documents,
      },

      updates,
    });
  } catch (error) {
    console.error("getPublicProjectBySlug error:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    connection.release();
  }
};

module.exports = {
  getActiveProjects,
  getCompletedProjects,
  getAdminProjects,
  getProjectDetails,
  addProjectUpdate,
  editProjectUpdate,
  deleteProjectUpdate,
  updateProject,
  getPublicProjectBySlug,
};
