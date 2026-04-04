// src/middleware/auth.middleware.js
// JWT-based auth — no Firebase dependency.
// Signs and verifies tokens using JWT_SECRET from .env.

const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "ride-buddy-dev-secret-change-in-prod";

/**
 * Strict auth guard — rejects unauthenticated requests with 401.
 * Attaches req.user = { uid (user id), name, email } on success.
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
      uid: String(decoded.userId), // keep uid as string for rate-limiter key consistency
      userId: decoded.userId,
      name: decoded.name || decoded.email || "Anonymous",
      email: decoded.email || null,
    };
    next();
  } catch (err) {
    console.warn("[Auth] Token verification failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
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
    };
  } catch {
    // Not fatal — proceed without user
  }
  next();
};

/**
 * Helper: generate a signed token for a user record.
 * @param {{ id: number, name: string, email: string }} user
 */
exports.generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, name: user.name, email: user.email },
    SECRET,
    { expiresIn: "7d" }  // 7-day tokens — user stays logged in across sessions
  );
};
