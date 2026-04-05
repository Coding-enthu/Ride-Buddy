const axios = require("axios");
const pool = require("../config/db.js");

function haversineDistance(point, hazard) {
	const [lng1, lat1] = point;
	const { lng: lng2, lat: lat2 } = hazard;

	const R = 6371e3;
	const toRad = (deg) => (deg * Math.PI) / 180;

	const φ1 = toRad(lat1);
	const φ2 = toRad(lat2);
	const Δφ = toRad(lat2 - lat1);
	const Δλ = toRad(lng2 - lng1);

	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

function isNear(point, hazard, threshold = 100) {
	return haversineDistance(point, hazard) < threshold;
}

function getBoundingBox(coords) {
	let minLat = Infinity,
		maxLat = -Infinity;
	let minLng = Infinity,
		maxLng = -Infinity;

	coords.forEach(([lng, lat]) => {
		minLat = Math.min(minLat, lat);
		maxLat = Math.max(maxLat, lat);
		minLng = Math.min(minLng, lng);
		maxLng = Math.max(maxLng, lng);
	});

	return { minLat, maxLat, minLng, maxLng };
}

exports.getRoute = async (from, to) => {
	const url = `https://router.project-osrm.org/route/v1/driving/${from};${to}?alternatives=true&overview=full&geometries=geojson&steps=true&annotations=true`;

	console.log("[routing] OSRM request:", url);

	const response = await axios.get(url);
	const routes = response.data.routes;

	const rankedRoutes = [];

	for (const route of routes) {
		const coords = route.geometry.coordinates;
		const { minLat, maxLat, minLng, maxLng } = getBoundingBox(coords);

		const hazardRes = await pool.query(
			`SELECT * FROM hazards
            WHERE lat BETWEEN $1 AND $2
            AND lng BETWEEN $3 AND $4`,
			[minLat, maxLat, minLng, maxLng],
		);

		const hazards = hazardRes.rows;

		let hazardCount = 0;
		let severitySum = 0;
		let penalty = 0;
		let estimatedDelaySeconds = 0;
		let typeBreakdown = {};
		const hazardsOnRoute = [];

		hazards.forEach((h) => {
			// Sample every 3 points for better hazard matching on route geometry.
			for (let i = 0; i < coords.length; i += 3) {
				if (isNear(coords[i], h)) {
					// Use severity for penalty (works with existing schema)
					const severity = h.severity || 1;
					const weight = severity * 30;
					penalty += weight;
					severitySum += severity;
					estimatedDelaySeconds += severity * 40;
					hazardCount++;
					typeBreakdown[h.type] = (typeBreakdown[h.type] || 0) + 1;

					// Avoid duplicates in hazardsOnRoute
					if (!hazardsOnRoute.find((x) => x.id === h.id)) {
						hazardsOnRoute.push(h);
					}
					break;
				}
			}
		});

		rankedRoutes.push({
			route,
			analysis: {
				hazardCount,
				severitySum,
				penalty,
				estimatedDelaySeconds,
				adjustedDuration: route.duration + estimatedDelaySeconds,
				typeBreakdown,
			},
			hazardsOnRoute,
		});
	}

	const durations = rankedRoutes.map((r) => r.analysis.adjustedDuration);
	const distances = rankedRoutes.map((r) => r.route.distance);
	const hazardMetrics = rankedRoutes.map(
		(r) => r.analysis.hazardCount * 2 + r.analysis.severitySum * 3,
	);

	const minDuration = Math.min(...durations);
	const maxDuration = Math.max(...durations);
	const minDistance = Math.min(...distances);
	const maxDistance = Math.max(...distances);
	const minHazardMetric = Math.min(...hazardMetrics);
	const maxHazardMetric = Math.max(...hazardMetrics);

	const normalize = (value, min, max) => (max === min ? 0 : (value - min) / (max - min));

	// Balanced score: hazards + time + distance
	// Hazards still weighted highest, but duration/distance are always included.
	const HAZARD_WEIGHT = 0.55;
	const TIME_WEIGHT = 0.30;
	const DISTANCE_WEIGHT = 0.15;

	rankedRoutes.forEach((r) => {
		const hazardMetric = r.analysis.hazardCount * 2 + r.analysis.severitySum * 3;
		const normalizedHazard = normalize(hazardMetric, minHazardMetric, maxHazardMetric);
		const normalizedTime = normalize(r.analysis.adjustedDuration, minDuration, maxDuration);
		const normalizedDistance = normalize(r.route.distance, minDistance, maxDistance);

		r.analysis.score =
			HAZARD_WEIGHT * normalizedHazard +
			TIME_WEIGHT * normalizedTime +
			DISTANCE_WEIGHT * normalizedDistance;
	});

	rankedRoutes.sort((a, b) => {
		if (a.analysis.score !== b.analysis.score) {
			return a.analysis.score - b.analysis.score;
		}
		if (a.analysis.hazardCount !== b.analysis.hazardCount) {
			return a.analysis.hazardCount - b.analysis.hazardCount;
		}
		if (a.route.duration !== b.route.duration) {
			return a.route.duration - b.route.duration;
		}
		return a.route.distance - b.route.distance;
	});

	const best = rankedRoutes[0];
	const bestRoute = best?.route ?? null;
	const bestDetails = best?.analysis ?? null;
	const bestHazardsOnRoute = best?.hazardsOnRoute ?? [];

	return {
		bestRoute,
		// Keep allRoutes ordered with safest route first so frontend "index 0 = recommended" remains correct.
		allRoutes: rankedRoutes.map((r) => r.route),
		routeAnalyses: rankedRoutes.map((r) => r.analysis),
		routeHazards: rankedRoutes.map((r) => r.hazardsOnRoute),
		analysis: bestDetails,
		hazardsOnRoute: bestHazardsOnRoute,
	};
};
