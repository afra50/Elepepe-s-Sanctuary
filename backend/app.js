const express = require("express");
const cors = require("cors");

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS (allows requests from other ports like React)
app.use(express.json()); // Parse JSON bodies

// Simple test route to check if server works
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Elepepe Backend is running correctly!",
    status: "success",
  });
});

// Routes will be mounted here in the future
// e.g., app.use('/api/animals', animalRoutes);

// Error handling (404 - Not Found)
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;
