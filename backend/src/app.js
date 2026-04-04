// src/app.js
// Extended from original — added user routes and CORS origin list.
// All existing routes/middleware preserved as-is.

const express = require("express");
const cors = require("cors");

const hazardRoutes = require("./routes/hazard.routes.js");
const routeRoutes  = require("./routes/route.routes.js");
const userRoutes   = require("./routes/user.routes.js");
const govRoutes    = require("./routes/gov.routes.js"); // gov dashboard

const app = express();

// Allow both localhost ports and production domain
const allowedOrigins = [
  "http://localhost:3000",  // RideBuddy frontend
  "http://localhost:3001",
  "http://localhost:5173",  // Gov dashboard (Vite default)
  "http://localhost:5174",  // Gov dashboard (Vite alt)
  process.env.FRONTEND_URL,
  process.env.GOV_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, Postman)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" })); // 10mb to accommodate base64 images

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/auth",        require("./routes/auth.routes.js")); // register/login/me
app.use("/api/hazards", hazardRoutes);   // existing — UNCHANGED
app.use("/api/route",   routeRoutes);    // existing — UNCHANGED
app.use("/user",        userRoutes);     // existing — UNCHANGED
app.use("/api/gov",     govRoutes);      // NEW — gov dashboard APIs
// Gov also needs to PATCH /api/hazards/:id/status — registered here
app.use("/api",         govRoutes);      // mounts PATCH /api/hazards/:id/status

// test route — unchanged
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

module.exports = app;
