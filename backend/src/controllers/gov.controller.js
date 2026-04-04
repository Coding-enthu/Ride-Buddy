// src/controllers/gov.controller.js
// Government dashboard endpoints.
// ONLY new endpoints — existing hazard endpoints are NOT modified.

const pool = require("../config/db.js");

const VALID_STATUSES = ["active", "in_progress", "resolved"];

/**
 * PATCH /api/hazards/:id/status
 * Protected: verifyAuth + requireRole("official")
 * Body: { status: "active" | "in_progress" | "resolved" }
 *
 * - Updates hazard status
 * - Sets resolved_at + resolved_by_user_id when status = "resolved"
 * - Clears them if status reverts
 */
exports.updateHazardStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
    });
  }

  try {
    // Verify hazard exists
    const existing = await pool.query(
      "SELECT id, status FROM hazards WHERE id = $1",
      [parseInt(id, 10)]
    );
    if (existing.rowCount === 0) {
      return res.status(404).json({ error: "Hazard not found." });
    }

    const isResolving = status === "resolved";

    const result = await pool.query(
      `UPDATE hazards
       SET status              = $1,
           resolved_at         = $2,
           resolved_by_user_id = $3
       WHERE id = $4
       RETURNING *`,
      [
        status,
        isResolving ? new Date() : null,
        isResolving ? req.user.userId : null,
        parseInt(id, 10),
      ]
    );

    console.log(
      `[Gov] Hazard ${id} → "${status}" by user ${req.user.userId} (${req.user.email})`
    );
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("[Gov] updateHazardStatus error:", err.message);
    return res.status(500).json({ error: "Failed to update hazard status." });
  }
};

/**
 * GET /api/gov/stats
 * Protected: verifyAuth + requireRole("official")
 * Returns aggregate counts by status.
 */
exports.getStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)                                    AS total,
        COUNT(*) FILTER (WHERE status = 'active')     AS active,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved')   AS resolved
      FROM hazards
    `);
    return res.json(result.rows[0]);
  } catch (err) {
    console.error("[Gov] getStats error:", err.message);
    return res.status(500).json({ error: "Failed to fetch stats." });
  }
};
