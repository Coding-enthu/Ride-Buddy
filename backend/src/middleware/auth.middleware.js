// src/middleware/auth.middleware.js
// JWT-based auth — no Firebase dependency.
// Signs and verifies tokens using JWT_SECRET from .env.
// generateToken now includes role for gov dashboard access control.

const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "ride-buddy-dev-secret-change-in-prod";

/**
 * Strict auth guard — rejects unauthenticated requests with 401.
 * Attaches req.user = { uid, userId, name, email, role } on success.
 */
exports.verifyAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = {
      uid: String(decoded.userId),
      userId: decoded.userId,
      name: decoded.name || decoded.email || "Anonymous",
      email: decoded.email || null,
      role: decoded.role || "user",
    };
    next();
  } catch (err) {
    console.warn("[Auth] Token verification failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * Role guard — use AFTER verifyAuth.
 * Usage: router.patch("/...", verifyAuth, requireRole("official"), handler)
 */
exports.requireRole = (requiredRole) => (req, res, next) => {
  if (!req.user || req.user.role !== requiredRole) {
    return res.status(403).json({ error: "Access denied. Insufficient permissions." });
  }
  next();
};

/**
 * Soft auth — attaches req.user if token present but does NOT reject anonymous requests.
 */
exports.softAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return next();

  const token = authHeader.split("Bearer ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = {
      uid: String(decoded.userId),
      userId: decoded.userId,
      name: decoded.name || decoded.email,
      email: decoded.email,
      role: decoded.role || "user",
    };
  } catch {
    // Not fatal — proceed without user
  }
  next();
};

/**
 * Generate a signed JWT for a user.
 * @param {{ id: number, name: string, email: string, role?: string }} user
 */
exports.generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "user",
    },
    SECRET,
    { expiresIn: "7d" }
  );
};
