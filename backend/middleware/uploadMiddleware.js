// backend/middleware/uploadMiddleware.js
const multer = require("multer");

// We use memoryStorage so we can process the file (compress/resize)
// BEFORE saving it to the disk.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only images and PDF files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
  fileFilter: fileFilter,
});

module.exports = upload;
