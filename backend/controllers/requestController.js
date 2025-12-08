const db = require("../config/db");
const RequestModel = require("../models/requestModel");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs").promises;
const Joi = require("joi");

// --- 2. Validation Schema (English Labels) ---
const requestSchema = Joi.object({
  // Applicant Data
  fullName: Joi.string().min(2).max(100).required().label("Full Name"),
  email: Joi.string().email().max(100).required().label("Email"),
  phone: Joi.string().max(20).required().label("Phone Number"),
  country: Joi.string().max(100).required().label("Country"),
  city: Joi.string().max(100).allow(null, "").label("City"),

  // Pet Data
  species: Joi.string().valid("rat", "guineaPig", "other").required(),
  speciesOther: Joi.string().max(100).allow(null, ""),
  animalName: Joi.string().max(100).required().label("Animal Name"),
  age: Joi.string().max(50).allow(null, "").label("Age"),
  animalsCount: Joi.number().integer().min(1).max(99).default(1),

  // Description & Finance
  description: Joi.string().min(20).max(5000).required().label("Description"),
  amount: Joi.number().positive().max(1000000).required().label("Amount"),
  currency: Joi.string().valid("EUR", "PLN").required(),
  amountType: Joi.string().valid("estimated", "exact").required(),
  deadline: Joi.date().greater("now").required().label("Deadline"),

  // Checkboxes (Strings "true"/"false" from FormData)
  treatmentOngoing: Joi.string().valid("true", "false").default("false"),
  needsInstallments: Joi.string().valid("true", "false").default("false"),

  otherFundraiserLink: Joi.string().uri().max(500).allow(null, ""),
  otherHelp: Joi.string().max(1000).allow(null, ""),

  // Payout Data (All required)
  payoutName: Joi.string().max(100).required().label("Payout Account Holder"),
  payoutIban: Joi.string().max(50).required().label("IBAN"),
  payoutBankName: Joi.string().max(100).required().label("Bank Name"),
  payoutBankCountry: Joi.string().max(100).required().label("Bank Country"),
  payoutSwift: Joi.string().max(20).required().label("SWIFT/BIC"),
  payoutAddress: Joi.string()
    .max(255)
    .required()
    .label("Account Holder Address"),

  // Consents (Must be true)
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
}).unknown(true); // Allow other fields (like files)

const createRequest = async (req, res) => {
  // --- 3. Validate Data BEFORE Processing ---
  const { error, value } = requestSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({
      error: "Validation error",
      details: errorMessages,
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Prepare text data
    const requestData = {
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

    // 2. Save Request to DB
    const newRequestId = await RequestModel.createRequest(
      connection,
      requestData
    );

    // 3. Process Files
    if (req.files) {
      const allFiles = [
        ...(req.files.petPhotos || []),
        ...(req.files.documents || []),
      ];

      // Security: Limit total number of files
      if (allFiles.length > 20) {
        throw new Error("Too many files. Maximum 20 attachments allowed.");
      }

      const filesToInsert = [];
      const uploadDir = path.join(__dirname, "..", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });

      for (const file of allFiles) {
        // Security: Size check (secondary to Multer)
        if (file.size > 10 * 1024 * 1024) continue;

        let filename = `${uuidv4()}${path.extname(file.originalname)}`;
        let fileType = "document";

        if (file.mimetype.startsWith("image/")) {
          fileType = "photo";
          filename = `${uuidv4()}.webp`;

          await sharp(file.buffer)
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(path.join(uploadDir, filename));
        } else {
          await fs.writeFile(path.join(uploadDir, filename), file.buffer);
        }

        filesToInsert.push([
          newRequestId,
          `/uploads/${filename}`,
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

    // Return generic error message to client
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to save the request. Please try again later.",
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  createRequest,
};
