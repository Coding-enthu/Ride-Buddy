// src/routes/auth.routes.js

const { Router } = require("express");
const { register, login, getMe } = require("../controllers/auth.controller.js");
const { verifyAuth } = require("../middleware/auth.middleware.js");

const router = Router();

router.post("/register", register);
router.post("/login",    login);
router.get("/me",        verifyAuth, getMe);

module.exports = router;
