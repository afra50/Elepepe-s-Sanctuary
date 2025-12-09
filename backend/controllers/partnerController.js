// backend/controllers/partnerController.js

const db = require("../config/db");
const PartnerModel = require("../models/partnerModel");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs").promises;
const Joi = require("joi");

// Uwaga: zakładam, że w API używasz camelCase (namePl, descriptionEn itd.),
// a w bazie masz snake_case (name_pl, description_en).

const partnerSchema = Joi.object({
  namePl: Joi.string().max(100).required(),
  nameEn: Joi.string().max(100).allow("", null),
  nameEs: Joi.string().max(100).allow("", null),

  descriptionPl: Joi.string().max(255).required(),
  descriptionEn: Joi.string().max(255).allow("", null),
  descriptionEs: Joi.string().max(255).allow("", null),

  countryPl: Joi.string().max(100).required(),
  countryEn: Joi.string().max(100).allow("", null),
  countryEs: Joi.string().max(100).allow("", null),
}).unknown(true);

const mapBodyToData = (value) => ({
  namePl: value.namePl,
  nameEn: value.nameEn || null,
  nameEs: value.nameEs || null,
  descriptionPl: value.descriptionPl,
  descriptionEn: value.descriptionEn || null,
  descriptionEs: value.descriptionEs || null,
  countryPl: value.countryPl,
  countryEn: value.countryEn || null,
  countryEs: value.countryEs || null,
});

// helper do zapisania logo
const saveLogoFile = async (partnerId, file) => {
  if (!file) {
    return null;
  }

  if (!file.mimetype.startsWith("image/")) {
    throw new Error("Logo file must be an image.");
  }

  // max 5 MB dla logo
  const MAX_LOGO_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_LOGO_SIZE) {
    throw new Error("Logo file is too large (max 5 MB).");
  }

  const baseDir = path.join(
    __dirname,
    "..",
    "uploads",
    "partners",
    String(partnerId)
  );

  await fs.mkdir(baseDir, { recursive: true });

  const filename = `${uuidv4()}.webp`;
  const fullPath = path.join(baseDir, filename);

  await sharp(file.buffer)
    .resize({
      width: 700,
      height: 700,
      fit: "cover",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toFile(fullPath);

  const relativePath = `/uploads/partners/${partnerId}/${filename}`;
  return relativePath;
};

const createPartner = async (req, res) => {
  const { error, value } = partnerSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const messages = error.details.map((d) => d.message);
    return res
      .status(400)
      .json({ error: "Validation error", details: messages });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const data = mapBodyToData(value);

    // 1. Tworzymy partnera (bez logo_path)
    const newPartnerId = await PartnerModel.createPartner(connection, data);

    // 2. Przetwarzamy logo (jeśli przesłane)
    let logoPath = null;

    if (req.file) {
      logoPath = await saveLogoFile(newPartnerId, req.file);
      await PartnerModel.updateLogoPath(connection, newPartnerId, logoPath);
    } else {
      // Jeśli w bazie kolumna logo_path jest NOT NULL,
      // to ustaw chociaż pusty string lub jakiś placeholder.
      await PartnerModel.updateLogoPath(connection, newPartnerId, "");
    }

    await connection.commit();

    res.status(201).json({
      message: "Partner created successfully",
      partnerId: newPartnerId,
      logoPath,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error creating partner:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create partner.",
    });
  } finally {
    connection.release();
  }
};

const getPartners = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const partners = await PartnerModel.getPartners(connection);
    res.status(200).json(partners);
  } catch (err) {
    console.error("Error fetching partners:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch partners.",
    });
  } finally {
    connection.release();
  }
};

const updatePartner = async (req, res) => {
  const { id } = req.params;

  const { error, value } = partnerSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const messages = error.details.map((d) => d.message);
    return res
      .status(400)
      .json({ error: "Validation error", details: messages });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const existing = await PartnerModel.getPartnerById(connection, id);
    if (!existing) {
      await connection.rollback();
      return res.status(404).json({ message: "Partner not found" });
    }

    const data = mapBodyToData(value);
    await PartnerModel.updatePartner(connection, id, data);

    let logoPath = existing.logoPath;

    if (req.file) {
      // Usuń stare logo jeśli istnieje
      if (existing.logoPath) {
        try {
          const oldFullPath = path.join(
            __dirname,
            "..",
            existing.logoPath.replace(/^\/+/, "")
          );
          await fs.unlink(oldFullPath);
        } catch (e) {
          // brak pliku itp. – ignorujemy
        }
      }

      logoPath = await saveLogoFile(id, req.file);
      await PartnerModel.updateLogoPath(connection, id, logoPath);
    }

    await connection.commit();

    res.status(200).json({
      message: "Partner updated successfully",
      partnerId: Number(id),
      logoPath,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error updating partner:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update partner.",
    });
  } finally {
    connection.release();
  }
};

const deletePartner = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const existing = await PartnerModel.getPartnerById(connection, id);
    if (!existing) {
      await connection.rollback();
      return res.status(404).json({ message: "Partner not found" });
    }

    // Usuwamy rekord z bazy
    await PartnerModel.deletePartner(connection, id);

    // Usuwamy katalog z logo (cały folder partners/{id})
    if (existing.logoPath) {
      const dirPath = path.join(
        __dirname,
        "..",
        "uploads",
        "partners",
        String(id)
      );
      try {
        await fs.rm(dirPath, { recursive: true, force: true });
      } catch (e) {
        // ignorujemy błąd usuwania plików
      }
    }

    await connection.commit();

    res.status(200).json({
      message: "Partner deleted successfully",
      partnerId: Number(id),
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error deleting partner:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to delete partner.",
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  createPartner,
  getPartners,
  updatePartner,
  deletePartner,
};
