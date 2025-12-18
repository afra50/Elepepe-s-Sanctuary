const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path"); // <--- 1. Import 'path' module

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

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;
