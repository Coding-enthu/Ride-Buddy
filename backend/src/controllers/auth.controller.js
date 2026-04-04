// src/controllers/auth.controller.js
// Register and login with email + password.
// Passwords hashed with bcrypt. Returns 7-day JWT.

const bcrypt = require("bcryptjs");
const pool = require("../config/db.js");
const { generateToken } = require("../middleware/auth.middleware.js");

const BCRYPT_ROUNDS = 12;

/**
 * POST /auth/register
 * Body: { name, email, password }
 */
exports.register = async (req, res) => {
  const { name = "", email = "", password = "" } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  try {
    // Check email isn't already taken
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const displayName  = name.trim() || email.split("@")[0];

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, name, email`,
      [displayName, email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];
    const token = generateToken(user); // role = 'user' by default
    return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user' } });
  } catch (err) {
    console.error("[Auth] Register error:", err.message);
    return res.status(500).json({ error: "Registration failed. Please try again." });
  }
};

/**
 * POST /auth/login
 * Body: { email, password }
 */
exports.login = async (req, res) => {
  const { email = "", password = "" } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email, password_hash, role FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const token = generateToken(user); // includes role in JWT
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user' } });
  } catch (err) {
    console.error("[Auth] Login error:", err.message);
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
};

/**
 * GET /auth/me  (requires verifyAuth)
 * Returns the current authenticated user profile.
 */
exports.getMe = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
      [req.user.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "User not found." });
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("[Auth] getMe error:", err.message);
    return res.status(500).json({ error: "Failed to fetch user." });
  }
};
