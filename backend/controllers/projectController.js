// backend/controllers/projectController.js
const db = require("../config/db");
const ProjectModel = require("../models/projectModel");
const Joi = require("joi");
const path = require("path");
const fs = require("fs").promises;
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

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
  coverFileId: Joi.alternatives()
    .try(Joi.number(), Joi.string())
    .allow(null, ""),
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
 * Dodaje aktualność wraz z plikami
 */
const addProjectUpdate = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    // FormData przesyła wszystko jako stringi
    const { title, content, isVisible } = req.body;

    // Parsowanie widoczności ("true"/"false")
    const isVisibleBool = isVisible === "true" || isVisible === true;

    await connection.beginTransaction();

    // 1. Zapisz tekst aktualności
    const newUpdateId = await ProjectModel.createProjectUpdate(connection, {
      projectId: id,
      title: title, // JSON string
      content: content, // JSON string
      isVisible: isVisibleBool,
    });

    // 2. Obsługa plików
    if (req.files && req.files.length > 0) {
      const filesToInsert = [];

      // Struktura folderów: uploads/projects/{id}/updates/{photos|documents}
      const baseDir = path.join(
        process.cwd(),
        "uploads",
        "projects",
        String(id),
        "updates"
      );
      const photosDir = path.join(baseDir, "photos");
      const docsDir = path.join(baseDir, "documents");

      // Upewnij się, że foldery istnieją
      await fs.mkdir(photosDir, { recursive: true });
      await fs.mkdir(docsDir, { recursive: true });

      for (const file of req.files) {
        let filePath;
        let fileType;
        const uniqueId = uuidv4();

        if (file.mimetype.startsWith("image/")) {
          // ZDJĘCIE: Kompresja Sharp
          const filename = `${uniqueId}.webp`;
          await sharp(file.buffer)
            .resize({ width: 1000, withoutEnlargement: true }) // Mniejsza rozdzielczość dla newsów
            .webp({ quality: 80 })
            .toFile(path.join(photosDir, filename));

          filePath = `/uploads/projects/${id}/updates/photos/${filename}`;
          fileType = "photo";
        } else {
          // DOKUMENT: Zwykły zapis
          let ext = path.extname(file.originalname) || ".bin";
          const filename = `${uniqueId}${ext}`;
          await fs.writeFile(path.join(docsDir, filename), file.buffer);

          filePath = `/uploads/projects/${id}/updates/documents/${filename}`;
          fileType = "document";
        }

        // Przygotuj dane do insertu (oryginalna nazwa musi być zdekodowana z utf8 jeśli multer ją popsuł, ale zazwyczaj jest ok)
        // Multer w pamięci ma file.originalname jako string.
        filesToInsert.push([
          newUpdateId,
          filePath,
          fileType,
          file.originalname,
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
 * Edycja aktualności (tekst + dodawanie/usuwanie plików)
 */
const editProjectUpdate = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id, updateId } = req.params;
    const { title, content, isVisible, filesToDelete } = req.body;
    const isVisibleBool = isVisible === "true" || isVisible === true;

    await connection.beginTransaction();

    // 1. Aktualizacja tekstu
    await ProjectModel.updateProjectUpdate(connection, updateId, {
      title,
      content,
      isVisible: isVisibleBool,
    });

    // 2. Usuwanie plików (jeśli zaznaczono)
    if (filesToDelete) {
      let idsToDelete = [];
      try {
        idsToDelete = JSON.parse(filesToDelete);
      } catch (e) {}

      if (idsToDelete.length > 0) {
        // A. Pobierz ścieżki (potrzebujemy napisać proste query tutaj lub w modelu,
        // użyjmy tego co mamy w modelu dla głównego projektu, ale to inna tabela.
        // Napiszmy szybkie query tutaj dla uproszczenia lub użyjmy uniwersalnego podejścia)

        // Lepiej napisać query tutaj, bo `getFilesByIds` jest dla `project_files` a my chcemy `project_update_files`
        const [filesRows] = await connection.query(
          "SELECT file_path FROM project_update_files WHERE id IN (?)",
          [idsToDelete]
        );

        // B. Usuń z dysku
        for (const file of filesRows) {
          try {
            const fullPath = path.join(process.cwd(), file.file_path);
            await fs.unlink(fullPath);
          } catch (e) {
            console.warn("File delete error:", e.message);
          }
        }

        // C. Usuń z bazy
        await ProjectModel.deleteUpdateFiles(connection, idsToDelete);
      }
    }

    // 3. Dodawanie NOWYCH plików (Kopia logiki z addProjectUpdate)
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

        filesToInsert.push([updateId, filePath, fileType, file.originalname]);
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

    // 1. Pobierz pliki powiązane z tym newsem (żeby usunąć z dysku)
    const files = await ProjectModel.getUpdateFiles(connection, updateId);

    // 2. Usuń fizycznie z dysku
    for (const file of files) {
      try {
        const fullPath = path.join(process.cwd(), file.file_path);
        await fs.unlink(fullPath);
      } catch (e) {
        console.warn(`Could not delete file ${file.file_path}`, e.message);
      }
    }

    // 3. Usuń newsa z bazy (pliki z bazy usuną się kaskadowo lub trzeba je usunąć ręcznie)
    // Bezpieczniej usunąć pliki z bazy najpierw:
    if (files.length > 0) {
      const ids = files.map((f) => f.id);
      await ProjectModel.deleteUpdateFiles(connection, ids);
    }

    // Usuń rekord newsa
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
    if (
      formattedDeadline &&
      typeof formattedDeadline === "string" &&
      formattedDeadline.includes("T")
    ) {
      formattedDeadline = formattedDeadline.split("T")[0];
    }
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
    // 5. OBSŁUGA PLIKÓW (Teraz używamy Modelu zamiast SQL)
    // =========================================================

    // A. USUWANIE PLIKÓW
    if (req.body.filesToDelete) {
      let filesToDeleteIds = [];
      try {
        filesToDeleteIds = JSON.parse(req.body.filesToDelete);
      } catch (e) {
        console.error("Error parsing filesToDelete JSON", e);
      }

      if (Array.isArray(filesToDeleteIds) && filesToDeleteIds.length > 0) {
        // 1. Pobierz ścieżki z modelu
        const filesRows = await ProjectModel.getFilesByIds(
          connection,
          filesToDeleteIds,
          id
        );

        // 2. Usuń z dysku (ZABEZPIECZENIE)
        for (const file of filesRows) {
          // --- SPRAWDZENIE BEZPIECZEŃSTWA ---
          // Jeśli plik pochodzi z folderu 'requests', NIE usuwamy go fizycznie z dysku.
          // Usuwamy go tylko z bazy danych projektu (krok 3),
          // aby oryginał w Zgłoszeniach pozostał nienaruszony.
          if (file.file_path.includes("/uploads/requests/")) {
            continue;
          }
          // ----------------------------------

          try {
            const filePath = path.join(process.cwd(), file.file_path);
            await fs.unlink(filePath);
          } catch (err) {
            // Ignorujemy błąd jeśli plik już nie istnieje, ale logujemy inne
            if (err.code !== "ENOENT") {
              console.warn(
                `Could not delete file ${file.file_path}:`,
                err.message
              );
            }
          }
        }

        // 3. Usuń z bazy (Model)
        // To usuwa powiązanie pliku z PROJEKTEM. Oryginalne powiązanie z REQUESTEM jest w innej tabeli.
        await ProjectModel.deleteFiles(connection, filesToDeleteIds, id);
      }
    }

    // B. ZARZĄDZANIE OKŁADKĄ (Dla istniejących plików)
    if (req.body.coverFileId !== undefined) {
      // 1. Reset (Model)
      await ProjectModel.resetProjectCovers(connection, id);

      // 2. Set (Model) - tylko jeśli to ID numeryczne (istniejący plik)
      if (req.body.coverFileId && !isNaN(req.body.coverFileId)) {
        await ProjectModel.setFileAsCover(connection, req.body.coverFileId, id);
      }
    }

    // C. DODAWANIE NOWYCH PLIKÓW (Upload)
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
        const originalRealName = newFileNamesMap[tempId] || file.originalname;
        const uniqueName = `${uuidv4()}.webp`;

        await sharp(file.buffer)
          .resize({ width: 1200, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(path.join(photosDir, uniqueName));

        // Jeśli nowy plik jest okładką
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
        const originalRealName = newFileNamesMap[tempId] || file.originalname;
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

    // D. Zapis nowych plików do bazy (Model)
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

module.exports = {
  getActiveProjects,
  getAdminProjects,
  getProjectDetails,
  addProjectUpdate,
  editProjectUpdate,
  deleteProjectUpdate,
  updateProject,
};
