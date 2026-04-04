const pool = require("../config/db.js");

// exports.createHazard = async ({ type, lat, lng, severity }) => {
// 	const result = await pool.query(
// 		`INSERT INTO hazards(type, lat, lng, severity)
//         VALUES($1, $2, $3, $4)
//         RETURNING *`,
// 		[type, lat, lng, severity || 1],
// 	);

// 	return result.rows[0];
// };

exports.createHazard = async ({ type, lat, lng, severity }) => {
	// 🔴 check duplicate first
	const exists = await exports.checkHazardExists(lat, lng);

	if (exists) {
		throw new Error("Hazard already reported nearby");
	} // change in createHazard====> Check for error. if error hazard already exists
	// if no error hazard is saved. Handle error

	const result = await pool.query(
		`INSERT INTO hazards(type, lat, lng, severity)
     VALUES($1, $2, $3, $4)
     RETURNING *`,
		[type, lat, lng, severity || 1],
	);

	return result.rows[0];
};

exports.getHazards = async ({ minLat, maxLat, minLng, maxLng }) => {
	if (!minLat) {
		const result = await pool.query(
			`SELECT * FROM hazards ORDER BY id DESC`,
		);
		return result.rows;
	}

	const result = await pool.query(
		`SELECT * FROM hazards
        WHERE lat BETWEEN $1 AND $2
        AND lng BETWEEN $3 AND $4
        ORDER BY id DESC`,
		[minLat, maxLat, minLng, maxLng],
	);

	return result.rows;
};

/**
 * Get hazards within a given radius (meters) of a lat/lng point.
 * Uses the spherical law of cosines approximation directly in SQL.
 */
exports.getNearbyHazards = async (lat, lng, radiusMeters = 500) => {
	const result = await pool.query(
		`SELECT *,
			(6371000 * acos(
				LEAST(1.0, cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2))
				+ sin(radians($1)) * sin(radians(lat)))
			)) AS distance_meters
		FROM hazards
		WHERE (6371000 * acos(
			LEAST(1.0, cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2))
			+ sin(radians($1)) * sin(radians(lat)))
		)) < $3
		ORDER BY distance_meters ASC`,
		[lat, lng, radiusMeters],
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
