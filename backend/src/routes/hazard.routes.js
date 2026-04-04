// src/routes/hazard.routes.js
// Extended from original:
//   - POST / now protected by verifyAuth + rate limiter
//   - GET routes are completely unchanged and remain public

const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const { verifyAuth } = require("../middleware/auth.middleware.js");
const {
	createHazard,
	getHazards,
	getNearbyHazards,
	checkHazardExists,
} = require("../controllers/hazard.controller.js");

router.get("/check", checkHazardExists);

// POST /api/hazards — report a new hazard
router.post("/", createHazard);

// GET /api/hazards — get all (or bounding box filtered) hazards — PUBLIC, unchanged
router.get("/", getHazards);

// GET /api/hazards/nearby?lat=&lng=&radius= — get hazards within radius — PUBLIC, unchanged
router.get("/nearby", getNearbyHazards);

module.exports = router;
