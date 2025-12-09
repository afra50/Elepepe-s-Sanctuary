const db = require("../config/db");
const RequestModel = require("../models/requestModel");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs").promises;
const Joi = require("joi");

// --- 2. Validation Schema ---
const requestSchema = Joi.object({
  applicantType: Joi.string()
    .valid("person", "organization", "vetClinic")
    .required()
    .label("Applicant Type"),

  fullName: Joi.string().min(2).max(100).required().label("Full Name"),
  email: Joi.string().email().max(100).required().label("Email"),
  phone: Joi.string().max(20).required().label("Phone Number"),
  country: Joi.string().max(100).required().label("Country"),
  city: Joi.string().max(100).allow(null, "").label("City"),

  species: Joi.string().valid("rat", "guineaPig", "other").required(),
  speciesOther: Joi.string().max(100).allow(null, ""),
  animalName: Joi.string().max(100).required().label("Animal Name"),
  age: Joi.string().max(50).allow(null, "").label("Age"),
  animalsCount: Joi.number().integer().min(1).max(99).default(1),

  description: Joi.string().min(20).max(8000).required().label("Description"),
  amount: Joi.number().positive().max(1000000).required().label("Amount"),
  currency: Joi.string().valid("EUR", "PLN").required(),
  amountType: Joi.string().valid("estimated", "exact").required(),
  deadline: Joi.date().greater("now").required().label("Deadline"),

  treatmentOngoing: Joi.string().valid("true", "false").default("false"),
  needsInstallments: Joi.string().valid("true", "false").default("false"),

  otherFundraiserLink: Joi.string().uri().max(500).allow(null, ""),
  otherHelp: Joi.string().max(1000).allow(null, ""),

  payoutName: Joi.string().max(100).required().label("Payout Account Holder"),
  payoutIban: Joi.string().max(50).required().label("IBAN"),
  payoutBankName: Joi.string().max(100).required().label("Bank Name"),
  payoutBankCountry: Joi.string().max(100).required().label("Bank Country"),
  payoutSwift: Joi.string().max(20).required().label("SWIFT/BIC"),
  payoutAddress: Joi.string()
    .max(255)
    .required()
    .label("Account Holder Address"),

  consentDataProcessing: Joi.string()
    .valid("true")
    .required()
    .label("GDPR Consent"),
  consentTruth: Joi.string()
    .valid("true")
    .required()
    .label("Truthfulness Declaration"),
  consentPublicStory: Joi.string()
    .valid("true")
    .required()
    .label("Public Story Consent"),

  // Also ensure submissionLanguage is validated if it's sent
  submissionLanguage: Joi.string()
    .valid("pl", "en", "es")
    .required()
    .label("Submission Language"),
}).unknown(true);

const createRequest = async (req, res) => {
  // --- 3. Validate Data ---
  const { error, value } = requestSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res
      .status(400)
      .json({ error: "Validation error", details: errorMessages });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Prepare data for Model
    const requestData = {
      // === NEW FIELD ===
      applicantType: value.applicantType,

      submissionLanguage: value.submissionLanguage,
      fullName: value.fullName,
      email: value.email,
      phone: value.phone,
      country: value.country,
      city: value.city || null,
      species: value.species,
      speciesOther: value.speciesOther || null,
      animalName: value.animalName,
      age: value.age || null,
      animalsCount: value.animalsCount,
      description: value.description,
      amount: value.amount,
      currency: value.currency,
      amountType: value.amountType,
      deadline: value.deadline,
      treatmentOngoing: value.treatmentOngoing === "true" ? 1 : 0,
      needsInstallments: value.needsInstallments === "true" ? 1 : 0,
      otherFundraiserLink: value.otherFundraiserLink || null,
      otherHelp: value.otherHelp || null,
      payoutName: value.payoutName,
      payoutIban: value.payoutIban,
      payoutBankName: value.payoutBankName,
      payoutBankCountry: value.payoutBankCountry,
      payoutSwift: value.payoutSwift,
      payoutAddress: value.payoutAddress,
      consentDataProcessing: 1,
      consentTruth: 1,
      consentPublicStory: 1,
    };

    // 2. Call Model
    const newRequestId = await RequestModel.createRequest(
      connection,
      requestData
    );

    // 3. Process Files (No changes here, logic remains correct)
    if (req.files) {
      const allFiles = [
        ...(req.files.petPhotos || []),
        ...(req.files.documents || []),
      ];

      if (allFiles.length > 20) {
        throw new Error("Too many files. Maximum 20 attachments allowed.");
      }

      const baseUploadDir = path.join(
        __dirname,
        "..",
        "uploads",
        "requests",
        String(newRequestId)
      );
      const photosDir = path.join(baseUploadDir, "photos");
      const docsDir = path.join(baseUploadDir, "documents");

      await fs.mkdir(photosDir, { recursive: true });
      await fs.mkdir(docsDir, { recursive: true });

      const filesToInsert = [];

      for (const file of allFiles) {
        if (file.size > 10 * 1024 * 1024) continue;

        let filename = `${uuidv4()}`;
        let targetDir;
        let fileType;
        let folderName;

        if (file.fieldname === "petPhotos") {
          targetDir = photosDir;
          fileType = "photo";
          folderName = "photos";
        } else {
          targetDir = docsDir;
          fileType = "document";
          folderName = "documents";
        }

        let finalFilename;

        if (file.mimetype.startsWith("image/")) {
          finalFilename = `${filename}.webp`;
          await sharp(file.buffer)
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(path.join(targetDir, finalFilename));
        } else {
          finalFilename = `${filename}${path.extname(file.originalname)}`;
          await fs.writeFile(path.join(targetDir, finalFilename), file.buffer);
        }

        const relativePath = `/uploads/requests/${newRequestId}/${folderName}/${finalFilename}`;

        filesToInsert.push([
          newRequestId,
          relativePath,
          fileType,
          file.originalname,
        ]);
      }

      if (filesToInsert.length > 0) {
        await RequestModel.addFiles(connection, filesToInsert);
      }
    }

    await connection.commit();
    res.status(201).json({
      message: "Request submitted successfully",
      requestId: newRequestId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating request:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to save the request.",
    });
  } finally {
    connection.release();
  }
};

const getRequests = async (req, res) => {
  const connection = await db.getConnection();

  try {
    // Extract query parameters (e.g. GET /api/requests?status=pending)
    const { status } = req.query;

    const filters = {};
    if (status) {
      filters.status = status;
    }

    const requests = await RequestModel.getRequests(connection, filters);

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch requests.",
    });
  } finally {
    connection.release();
  }
};

const getRequestDetails = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const requestRaw = await RequestModel.getRequestById(connection, id);

    if (!requestRaw) {
      return res.status(404).json({ message: "Request not found" });
    }

    const files = await RequestModel.getFilesByRequestId(connection, id);
    const petPhotos = files.filter((f) => f.file_type === "photo");
    const documents = files.filter((f) => f.file_type === "document");
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const formatFile = (f) => ({
      id: f.id,
      url: `${baseUrl}${f.file_path}`,
      originalName: f.original_name,
      type: f.file_type,
    });

    // MAPOWANIE snake_case -> camelCase
    const requestData = {
      id: requestRaw.id,
      status: requestRaw.status,
      createdAt: requestRaw.created_at,

      // Dane wnioskodawcy
      applicantType: requestRaw.applicant_type,
      fullName: requestRaw.full_name,
      email: requestRaw.email,
      phone: requestRaw.phone,
      country: requestRaw.country,
      city: requestRaw.city,

      // Dane zwierzęcia / zbiórki
      species: requestRaw.species,
      speciesOther: requestRaw.species_other,
      animalName: requestRaw.animal_name,
      age: requestRaw.age,
      animalsCount: requestRaw.animals_count,
      description: requestRaw.description,

      // Finanse
      amount: requestRaw.amount,
      currency: requestRaw.currency,
      amountType: requestRaw.amount_type,
      deadline: requestRaw.deadline,

      // Flagi
      treatmentOngoing: requestRaw.treatment_ongoing,
      needsInstallments: requestRaw.needs_installments,
      otherFundraiserLink: requestRaw.other_fundraiser_link,
      otherHelp: requestRaw.other_help,

      // Dane do przelewu
      payoutName: requestRaw.payout_name,
      payoutIban: requestRaw.payout_iban,
      payoutBankName: requestRaw.payout_bank_name,
      payoutBankCountry: requestRaw.payout_bank_country,
      payoutSwift: requestRaw.payout_swift,
      payoutAddress: requestRaw.payout_address,

      // Zgody i język
      submissionLanguage: requestRaw.submission_language,

      // Pliki
      petPhotos: petPhotos.map(formatFile),
      documents: documents.map(formatFile),
    };

    res.status(200).json(requestData);
  } catch (error) {
    console.error("Error fetching request details:", error);
    res.status(500).json({ error: "Server Error" });
  } finally {
    connection.release();
  }
};

module.exports = {
  createRequest,
  getRequests,
  getRequestDetails,
};
