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
} = require("../controllers/hazard.controller.js");

// Rate limiter: max 5 hazard reports per Firebase user per day.
// verifyAuth middleware ALWAYS runs before this, so req.user.uid is guaranteed.
// Keying by UID (not IP) avoids the ERR_ERL_KEY_GEN_IPV6 validation issue.
const reportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  keyGenerator: (req) => req.user.uid, // Firebase UID — always set by verifyAuth
  skip: (req) => !req.user?.uid,       // safety: skip if somehow no user (won't reach submittal path)
  message: { error: "Report limit reached. You can submit up to 5 hazards per day." },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/hazards — report a new hazard (auth + rate limited)
router.post("/", verifyAuth, reportLimiter, createHazard);

// GET /api/hazards — get all (or bounding box filtered) hazards — PUBLIC, unchanged
router.get("/", getHazards);

// GET /api/hazards/nearby?lat=&lng=&radius= — get hazards within radius — PUBLIC, unchanged
router.get("/nearby", getNearbyHazards);

module.exports = router;