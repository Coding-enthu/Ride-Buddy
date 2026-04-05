// src/services/hazard.service.js
// createHazard: accepts user_id + confidence (backward-compatible).
// checkDuplicate: Haversine distance, type-specific (Task 1 + Task 2).
// GET methods unchanged.

const pool = require("../config/db.js");

/**
 * Insert a hazard. user_id, confidence and verified are optional.
 */
exports.createHazard = async ({ type, lat, lng, severity, user_id, confidence }) => {
  console.log("[HazardService] createHazard called with:", { type, lat, lng, severity, user_id, confidence });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log("[HazardService] Transaction started");

    const hazardResult = await client.query(
      `INSERT INTO hazards(type, lat, lng, severity, user_id, confidence, verified)
       VALUES($1, $2, $3, $4, $5, $6, false)
       RETURNING *`,
      [type, lat, lng, severity || 1, user_id ?? null, confidence ?? null]
    );
    console.log("[HazardService] Hazard inserted, ID:", hazardResult.rows[0]?.id);

    // NOTE: hazard_reports_count column doesn't exist yet - skipping user stats update
    // TODO: Add migration to create this column if needed
    /*
    let hazardReportsCount = null;
    if (user_id != null) {
      try {
        const countResult = await client.query(
          `UPDATE users
           SET hazard_reports_count = COALESCE(hazard_reports_count, 0) + 1
           WHERE id = $1
           RETURNING hazard_reports_count`,
          [user_id]
        );
        hazardReportsCount = countResult.rows[0]?.hazard_reports_count ?? null;
        console.log("[HazardService] User reports count updated:", hazardReportsCount);
      } catch (err) {
        console.warn("[HazardService] Could not update user reports count:", err.message);
        console.warn("[HazardService] Error code:", err.code);
        if (err?.code !== "42703") {
          console.error("[HazardService] Throwing error because code is not 42703");
          throw err;
        }
        console.log("[HazardService] Ignoring column not found error (42703) - continuing with transaction");
      }
    }
    */

    await client.query("COMMIT");
    console.log("[HazardService] Transaction committed successfully");
    return { ...hazardResult.rows[0], hazard_reports_count: null };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[HazardService] ❌ Transaction rolled back:", err.message);
    throw err;
  } finally {
    client.release();
    console.log("[HazardService] Database connection released");
  }
};

/**
 * Check for a duplicate hazard of the SAME TYPE within radiusMeters.
 *
 * Task 1 — Uses the full Haversine formula instead of spherical law of cosines:
 *   a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2)
 *   d = 2R·atan2(√a, √(1−a))
 *
 * Task 2 — Filter by type: different hazard types are allowed within the radius,
 *   only identical types trigger the duplicate warning.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {string} type - hazard type to match
 * @param {number} radiusMeters - default 30m
 * @returns {Object|null} existing hazard row, or null if no duplicate
 */
exports.checkDuplicate = async (lat, lng, type, radiusMeters = 30) => {
  const result = await pool.query(
    `SELECT *,
      -- Haversine distance in metres
      (2 * 6371000 * asin(
        sqrt(
          sin(radians((lat - $1) / 2)) ^ 2
          + cos(radians($1)) * cos(radians(lat))
          * sin(radians((lng - $2) / 2)) ^ 2
        )
      )) AS distance_meters
     FROM hazards
     WHERE type = $3
       AND (2 * 6371000 * asin(
             sqrt(
               sin(radians((lat - $1) / 2)) ^ 2
               + cos(radians($1)) * cos(radians(lat))
               * sin(radians((lng - $2) / 2)) ^ 2
             )
           )) < $4
     ORDER BY distance_meters ASC
     LIMIT 1`,
    [lat, lng, type, radiusMeters]
  );
  return result.rows[0] ?? null;
};

// ── Existing methods below — NOT modified ─────────────────────────────────

exports.getHazards = async ({ minLat, maxLat, minLng, maxLng }) => {
  if (!minLat) {
    const result = await pool.query(`SELECT * FROM hazards ORDER BY id DESC`);
    return result.rows;
  }

  const result = await pool.query(
    `SELECT * FROM hazards
     WHERE lat BETWEEN $1 AND $2
     AND lng BETWEEN $3 AND $4
     ORDER BY id DESC`,
    [minLat, maxLat, minLng, maxLng]
  );
  return result.rows;
};

/**
 * Get hazards within a given radius (meters) of a lat/lng point.
 * Uses Haversine formula (consistent with checkDuplicate).
 */
exports.getNearbyHazards = async (lat, lng, radiusMeters = 500) => {
  const result = await pool.query(
    `SELECT *,
      (2 * 6371000 * asin(
        sqrt(
          sin(radians((lat - $1) / 2)) ^ 2
          + cos(radians($1)) * cos(radians(lat))
          * sin(radians((lng - $2) / 2)) ^ 2
        )
      )) AS distance_meters
     FROM hazards
     WHERE (2 * 6371000 * asin(
              sqrt(
                sin(radians((lat - $1) / 2)) ^ 2
                + cos(radians($1)) * cos(radians(lat))
                * sin(radians((lng - $2) / 2)) ^ 2
              )
            )) < $3
     ORDER BY distance_meters ASC`,
    [lat, lng, radiusMeters]
  );
  return result.rows;
};
