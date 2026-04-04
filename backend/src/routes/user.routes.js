// src/routes/user.routes.js
// User-specific routes — all protected by verifyAuth.

const express = require("express");
const router = express.Router();

const { verifyAuth } = require("../middleware/auth.middleware.js");
const { syncUser, getDashboard } = require("../controllers/user.controller.js");

// POST /user/sync — called on first login to create/update user record
router.post("/sync", verifyAuth, syncUser);

// GET /user/dashboard — returns { name, user_id, total_reports }
router.get("/dashboard", verifyAuth, getDashboard);

module.exports = router;
