// backend/middleware/uploadMiddleware.js
const multer = require("multer");

// pamięć – tak jak wcześniej
const storage = multer.memoryStorage();

const limits = {
  fileSize: 10 * 1024 * 1024, // 10 MB
};

const fileFilter = (req, file, cb) => {
  // do zgłoszeń – obrazki + PDF
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
  storage,
  limits,
  fileFilter,
});

// wariant tylko dla LOGO (image/*)
const imageOnlyFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const imageOnly = multer({
  storage,
  limits,
  fileFilter: imageOnlyFilter,
});

// żeby móc dalej robić: const upload = require(...);
// i mieć upload.imageOnly.single(...)
upload.imageOnly = imageOnly;

module.exports = upload;
