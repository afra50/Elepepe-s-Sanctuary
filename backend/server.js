// Load environment variables from .env file
require("dotenv").config();

const app = require("./app");
const http = require("http");

// Get port from environment or set default to 5000
const PORT = process.env.PORT || 5000;

// Create server
const server = http.createServer(app);

// Start listening
server.listen(PORT, () => {
  console.log(`
  ################################################
  🛡️  Server listening on port: ${PORT} 🛡️
  ################################################
  `);
});

// Handle startup errors
server.on("error", (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }
  console.error("Server error:", error);
  process.exit(1);
});
