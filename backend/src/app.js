// src/app.js
// Extended from original — added user routes and CORS origin list.
// All existing routes/middleware preserved as-is.

const express = require("express");
const cors = require("cors");

const hazardRoutes = require("./routes/hazard.routes.js");
const routeRoutes = require("./routes/route.routes.js");
const userRoutes = require("./routes/user.routes.js"); // NEW

const app = express();

// Allow both localhost ports and production domain
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL, // set in production .env
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
app.use("/auth", require("./routes/auth.routes.js")); // NEW — register/login/me
app.use("/api/hazards", hazardRoutes);   // existing
app.use("/api/route", routeRoutes);      // existing
app.use("/user", userRoutes);            // existing

// test route — unchanged
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

module.exports = app;
