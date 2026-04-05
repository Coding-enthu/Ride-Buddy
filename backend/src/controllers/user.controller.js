// src/controllers/user.controller.js
// Dashboard data endpoint.
// req.user.userId is the integer DB id (set by JWT middleware).

const pool = require("../config/db.js");

const ACHIEVEMENT_MILESTONES = [50, 100, 200, 500, 1000];

function getAchievement(totalReports) {
  const reached = ACHIEVEMENT_MILESTONES.filter((m) => totalReports >= m);
  const current = reached.length ? reached[reached.length - 1] : null;
  const next = ACHIEVEMENT_MILESTONES.find((m) => m > totalReports) ?? null;

  return {
    current,
    next,
    reached,
    title: current ? `${current}+ Hazard Reporter` : null,
  };
}

/**
 * GET /user/dashboard
 * Returns stats for the authenticated user.
 */
exports.getDashboard = async (req, res) => {
  try {
    let result;
    try {
      result = await pool.query(
        `SELECT u.id AS user_id, u.name, u.email,
                COALESCE(u.hazard_reports_count, COUNT(h.id)::int)::int AS total_reports
         FROM users u
         LEFT JOIN hazards h ON h.user_id = u.id
         WHERE u.id = $1
         GROUP BY u.id, u.name, u.email, u.hazard_reports_count`,
        [req.user.userId]
      );
    } catch (err) {
      // Backward compatibility: if migration not applied yet, fallback to COUNT(h.id)
      if (err?.code !== "42703") {
        throw err;
      }
      result = await pool.query(
        `SELECT u.id AS user_id, u.name, u.email,
                COUNT(h.id)::int AS total_reports
         FROM users u
         LEFT JOIN hazards h ON h.user_id = u.id
         WHERE u.id = $1
         GROUP BY u.id, u.name, u.email`,
        [req.user.userId]
      );
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const row = result.rows[0];
    const totalReports = Number(row.total_reports || 0);
    res.json({
      ...row,
      achievement: getAchievement(totalReports),
    });
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
