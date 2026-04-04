// src/services/hazard.service.js
// createHazard: accepts user_id + confidence (backward-compatible).
// checkDuplicate: Haversine distance, type-specific (Task 1 + Task 2).
// GET methods unchanged.

const pool = require("../config/db.js");

/**
 * Insert a hazard. user_id, confidence and verified are optional.
 */
exports.createHazard = async ({ type, lat, lng, severity, user_id, confidence }) => {
  const result = await pool.query(
    `INSERT INTO hazards(type, lat, lng, severity, user_id, confidence, verified)
     VALUES($1, $2, $3, $4, $5, $6, false)
     RETURNING *`,
    [type, lat, lng, severity || 1, user_id ?? null, confidence ?? null]
  );
  return result.rows[0];
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

function isNearby(lat1, lng1, lat2, lng2) {
	// 🔹 ensure numbers
	lat1 = parseFloat(lat1);
	lng1 = parseFloat(lng1);
	lat2 = parseFloat(lat2);
	lng2 = parseFloat(lng2);

	const R = 6371e3; // meters
	const toRad = (deg) => (deg * Math.PI) / 180;

	const φ1 = toRad(lat1);
	const φ2 = toRad(lat2);
	const Δφ = toRad(lat2 - lat1);
	const Δλ = toRad(lng2 - lng1);

	const a =
		Math.sin(Δφ / 2) ** 2 +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	const distance = R * c;

	return distance < 50; // 50 meters
}

exports.checkHazardExists = async (lat, lng) => {
	lat = parseFloat(lat);
	lng = parseFloat(lng);

	// 🔹 ~100m bounding box (fast DB filter)
	const range = 0.001;

	const result = await pool.query(
		`SELECT * FROM hazards
     WHERE lat BETWEEN $1 AND $2
     AND lng BETWEEN $3 AND $4`,
		[lat - range, lat + range, lng - range, lng + range],
	);

	const nearbyHazards = result.rows;

	// 🔹 precise check
	for (let h of nearbyHazards) {
		const match = isNearby(lat, lng, h.lat, h.lng);

		console.log("Comparing with:", h.lat, h.lng, "=>", match);

		if (match===true) return true;
		else return false;
	}

};
