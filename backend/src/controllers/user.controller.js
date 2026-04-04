// src/controllers/user.controller.js
// Dashboard data endpoint.
// req.user.userId is the integer DB id (set by JWT middleware).

const pool = require("../config/db.js");

/**
 * GET /user/dashboard
 * Returns stats for the authenticated user.
 */
exports.getDashboard = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id AS user_id, u.name, u.email,
              COUNT(h.id)::int AS total_reports
       FROM users u
       LEFT JOIN hazards h ON h.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id, u.name, u.email`,
      [req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("[User] dashboard error:", err.message);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
};

/**
 * POST /user/sync  (kept for backward compat, now a no-op alias for /auth/me)
 */
exports.syncUser = async (req, res) => {
  res.json({ user_id: req.user.userId, name: req.user.name, email: req.user.email });
};
