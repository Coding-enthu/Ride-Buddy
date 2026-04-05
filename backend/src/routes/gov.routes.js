// src/routes/gov.routes.js
// Government dashboard API routes — all require authentication + "official" role.
// Does NOT modify or replace any existing routes.

const router = require("express").Router();
const { verifyAuth, requireRole } = require("../middleware/auth.middleware.js");
const govController = require("../controllers/gov.controller.js");

// PATCH /api/hazards/:id/status  — update hazard status
router.patch(
  "/hazards/:id/status",
  verifyAuth,
  requireRole("official"),
  govController.updateHazardStatus
);

// GET /api/gov/stats  — aggregate counts
router.get(
  "/stats",
  verifyAuth,
  requireRole("official"),
  govController.getStats
);

module.exports = router;
