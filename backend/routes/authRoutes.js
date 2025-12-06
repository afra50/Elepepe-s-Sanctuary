const express = require("express");
const router = express.Router();

const {
  login,
  logout,
  checkAuth,
  refresh,
} = require("../controllers/authController");

router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/me", checkAuth);

module.exports = router;
