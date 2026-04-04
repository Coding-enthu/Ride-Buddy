// src/services/user.service.js
// User persistence layer — maps Firebase UIDs to internal user rows.
// Integration point: called from user.controller.js only.

const pool = require("../config/db.js");

/**
 * Returns existing user or creates a new one on first authenticated request.
 * @param {string} firebaseUid
 * @param {string} name
 * @returns {Promise<{ id, firebase_uid, name, phone, created_at }>}
 */
exports.getOrCreateUser = async (firebaseUid, name) => {
  const result = await pool.query(
    `INSERT INTO users (firebase_uid, name)
     VALUES ($1, $2)
     ON CONFLICT (firebase_uid) DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
    [firebaseUid, name || "Anonymous"]
  );
  return result.rows[0];
};

/**
 * Fetches user by Firebase UID — returns null if not found.
 */
exports.getUserByUid = async (firebaseUid) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE firebase_uid = $1`,
    [firebaseUid]
  );
  return result.rows[0] ?? null;
};

/**
 * Dashboard stats for a user.
 */
exports.getDashboardStats = async (userId) => {
  const [userResult, countResult] = await Promise.all([
    pool.query(`SELECT id, name FROM users WHERE id = $1`, [userId]),
    pool.query(`SELECT COUNT(*) AS total FROM hazards WHERE user_id = $1`, [userId]),
  ]);

  const user = userResult.rows[0];
  const total = parseInt(countResult.rows[0]?.total ?? "0", 10);

  return {
    user_id: user?.id,
    name: user?.name,
    total_reports: total,
  };
};
