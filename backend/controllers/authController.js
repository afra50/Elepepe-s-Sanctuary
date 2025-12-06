const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const isProd = process.env.NODE_ENV === "production";

// Helper to convert 15m / 14d to ms
const ms = (str) => {
  const n = parseInt(str, 10);
  if (str.endsWith("m")) return n * 60 * 1000;
  if (str.endsWith("h")) return n * 60 * 60 * 1000;
  if (str.endsWith("d")) return n * 24 * 60 * 60 * 1000;
  return n;
};

// COOKIES
const cookieBaseConfig = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true" || isProd,
  sameSite: process.env.COOKIE_SAMESITE || "Strict",
};

// Access token (15 min)
const setAccessCookie = (res, token) => {
  res.cookie("auth_token", token, {
    ...cookieBaseConfig,
    path: "/",
    maxAge: ms(process.env.JWT_EXPIRES || "15m"),
  });
};

// Refresh token (14 days)
const setRefreshCookie = (res, token) => {
  res.cookie("refresh_token", token, {
    ...cookieBaseConfig,
    path: "/api/auth", // refresh only for auth route
    maxAge: ms(process.env.JWT_REFRESH_EXPIRES || "14d"),
  });
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM admin WHERE username = ?", [
      username,
    ]);
    const user = rows?.[0];

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const payload = { sub: user.id, role: "admin" };

    const access = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES || "15m",
    });

    const refresh = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || "14d",
    });

    setAccessCookie(res, access);
    setRefreshCookie(res, refresh);

    res.json({ message: "Login successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.refresh = (req, res) => {
  const rt = req.cookies?.refresh_token;
  if (!rt) return res.status(401).json({ error: "Missing refresh token" });

  try {
    const payload = jwt.verify(rt, process.env.JWT_REFRESH_SECRET);

    const newAccess = jwt.sign(
      { sub: payload.sub, role: payload.role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES || "15m",
      }
    );

    const newRefresh = jwt.sign(
      { sub: payload.sub, role: payload.role },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES || "14d",
      }
    );

    setAccessCookie(res, newAccess);
    setRefreshCookie(res, newRefresh);

    res.status(204).end();
  } catch {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("auth_token", {
    ...cookieBaseConfig,
    path: "/",
  });

  res.clearCookie("refresh_token", {
    ...cookieBaseConfig,
    path: "/api/auth",
  });

  res.json({ message: "Logout successful" });
};

exports.checkAuth = (req, res) => {
  const token = req.cookies?.auth_token;
  if (!token)
    return res.status(401).json({ error: "Missing authorization token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: "Token expired or invalid" });

    res.json({ id: user.sub, role: user.role });
  });
};
