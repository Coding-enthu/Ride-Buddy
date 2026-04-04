const express = require("express");
const router = express.Router();

const {
	createHazard,
	getHazards,
	getNearbyHazards,
	checkHazardExists,
} = require("../controllers/hazard.controller.js");

router.get("/check", checkHazardExists);

// POST /api/hazards — report a new hazard
router.post("/", createHazard);

// GET /api/hazards — get all (or bounding box filtered) hazards
router.get("/", getHazards);

// GET /api/hazards/nearby?lat=&lng=&radius= — get hazards within radius (meters)
router.get("/nearby", getNearbyHazards);

module.exports = router;
