const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const multer = require("multer");

// Nowe biblioteki
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const winston = require("winston");

const authRoutes = require("./routes/authRoutes");
const requestRoutes = require("./routes/requestRoutes");
const partnerRoutes = require("./routes/partnerRoutes");
const projectRoutes = require("./routes/projectRoutes");
const internalDonationRoutes = require("./routes/internalDonationRoutes");
const payoutRoutes = require("./routes/payoutRoutes");
const contactRoutes = require("./routes/contactRoutes");

// --- KONFIGURACJA LOGGERA (Winston) ---
// Winston zastąpi console.error i będzie zapisywał błędy do pliku oraz konsoli
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Zapisuj błędy do pliku error.log (przydatne na produkcji!)
    new winston.transports.File({ filename: "error.log", level: "error" }),
    // Na produkcji też chcemy widzieć logi w konsoli (mSerwis zbiera logi konsoli)
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

const app = express();

// --- 1. PROXY & BEZPIECZEŃSTWO (Najważniejsze na górze) ---

// Niezbędne na mSerwis (Nginx), aby widzieć prawdziwe IP klienta
app.set("trust proxy", 1);

// HELMET: Zabezpiecza nagłówki HTTP
// crossOriginResourcePolicy: "cross-origin" jest WAŻNE, aby frontend (inny adres)
// mógł ładować obrazki z Twojego folderu /uploads
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Ukrywa informację, że używasz Expressa (dodatkowe zabezpieczenie, choć Helmet też to robi)
app.disable("x-powered-by");

// COMPRESSION: Kompresuje odpowiedzi (Gzip), strona ładuje się szybciej
app.use(compression());

// MORGAN: Logowanie zapytań HTTP w konsoli (kto, kiedy, jaki status)
// "common" to standardowy format logów serwerowych
app.use(morgan("common"));

// --- 2. KONTROLA RUCHU (Rate Limiting) ---
// Stosujemy tylko do API, żeby nie blokować ładowania obrazków z /uploads

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 200, // Limit: 200 zapytań na IP w ciągu 15 minut
  standardHeaders: true, // Zwraca info o limicie w nagłówkach `RateLimit-*`
  legacyHeaders: false, // Wyłącza stare nagłówki `X-RateLimit-*`
  message: { error: "Too many requests, please try again in 15 minutes." },
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minut
  delayAfter: 100, // Pozwól na 100 szybkich zapytań...
  // ZMIANA: delayMs musi być teraz funkcją obliczającą opóźnienie
  delayMs: (used, req) => {
    const delayAfter = req.slowDown.limit;
    return (used - delayAfter) * 500; // ...każde kolejne powyżej limitu dodaje 500ms opóźnienia
  },
});

// Aplikujemy limitery TYLKO do ścieżek /api/
app.use("/api/", limiter);
app.use("/api/", speedLimiter);

// --- 3. MIDDLEWARE APLIKACJI ---

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://elepepes-sanctuary.org",
      "https://www.elepepes-sanctuary.org",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// --- 4. PLIKI STATYCZNE ---
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// --- 5. TRASY (Routes) ---
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/partners", partnerRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/internal-donations", internalDonationRoutes);
app.use("/api/payouts", payoutRoutes);
app.use("/api/contact", contactRoutes);

// 404
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// --- 6. GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  // Używamy Winstona zamiast console.error
  logger.error(err.message, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

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
    // Na produkcji ukrywamy dokładny stack błędu dla bezpieczeństwa
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

module.exports = app;
