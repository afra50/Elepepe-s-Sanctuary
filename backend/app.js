const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const multer = require("multer");

const authRoutes = require("./routes/authRoutes");
const requestRoutes = require("./routes/requestRoutes");
const partnerRoutes = require("./routes/partnerRoutes");
const projectRoutes = require("./routes/projectRoutes");

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// --- 2. Serve Static Files ---
// This allows the frontend to access files via: http://localhost:5000/uploads/requests/123/photos/image.webp
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// TRASY (Routes)
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/partners", partnerRoutes);
app.use("/api/projects", projectRoutes);

// 404 (Dla nieznanych tras)
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// --- 2. GLOBAL ERROR HANDLER (DODAJ TO TUTAJ NA DOLE) ---
app.use((err, req, res, next) => {
  console.error("Global Error:", err); // Logowanie błędu w konsoli serwera

  // A. Obsługa błędów Multera (pliki - limity)
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

  // B. Obsługa błędu złego typu pliku (rzucanego przez fileFilter)
  // Sprawdzamy treść komunikatu, którą ustawiłeś w uploadMiddleware.js
  if (
    err.message === "Only images and PDF files are allowed!" ||
    err.message === "Only image files are allowed!"
  ) {
    return res
      .status(400)
      .json({ code: "INVALID_FILE_TYPE", error: err.message });
  }

  // C. Inne błędy (np. JSON parse error, błędy bazy danych)
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

module.exports = app;

module.exports = app;
