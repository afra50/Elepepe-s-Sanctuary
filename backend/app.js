const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const multer = require("multer");

const authRoutes = require("./routes/authRoutes");
const requestRoutes = require("./routes/requestRoutes");
const partnerRoutes = require("./routes/partnerRoutes");
const projectRoutes = require("./routes/projectRoutes");
const internalDonationRoutes = require("./routes/internalDonationRoutes");
const payoutRoutes = require("./routes/payoutRoutes");

const app = express();

// --- ZMIANA 1: KLUCZOWA DLA HTTPS NA MSERWIS ---
// Bez tego Express nie zobaczy kłódki i nie wyśle bezpiecznych ciasteczek!
app.set("trust proxy", 1);

// Middleware
app.use(
  cors({
    // --- ZMIANA 2: DODAJ SWOJĄ DOMENĘ ---
    origin: [
      "http://localhost:3000", // Do testów lokalnych
      "https://elepepes-sanctuary.org", // Twój frontend na produkcji
      "https://www.elepepes-sanctuary.org", // Wersja z www
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// --- 2. Serve Static Files ---
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// TRASY (Routes)
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/partners", partnerRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/internal-donations", internalDonationRoutes);
app.use("/api/payouts", payoutRoutes);

// 404 (Dla nieznanych tras)
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error("Global Error:", err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ code: "LIMIT_FILE_SIZE", error: "File too large" });
    }
    if (
      err.code === "LIMIT_FILE_COUNT" ||
      err.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      return res
        .status(400)
        .json({ code: "LIMIT_FILE_COUNT", error: "Too many files" });
    }
    return res.status(400).json({ code: "UPLOAD_ERROR", error: err.message });
  }

  if (
    err.message === "Only images and PDF files are allowed!" ||
    err.message === "Only image files are allowed!"
  ) {
    return res
      .status(400)
      .json({ code: "INVALID_FILE_TYPE", error: err.message });
  }

  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

module.exports = app;
// Usunąłem zduplikowane module.exports = app; z końca
