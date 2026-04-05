// src/controllers/hazard.controller.js
// Extended from original:
//   - createHazard now requires auth, runs duplicate check, and validates image via Gemini
//   - getHazards and getNearbyHazards are UNCHANGED

const hazardService = require("../services/hazard.service.js");
const geminiService = require("../services/gemini.service.js");

const GEMINI_MIN_CONFIDENCE = 0.50; // permissive — real-world photos vary in quality
const DUPLICATE_RADIUS_METERS = 30;

/**
 * POST /api/hazards
 * Protected by verifyAuth middleware.
 * Body: { type, lat, lng, severity, imageBase64, imageMimeType? }
 */
exports.createHazard = async (req, res) => {
  try {
    console.log("[Hazard] ✅ createHazard called");
    console.log("[Hazard] Request body keys:", Object.keys(req.body));
    console.log("[Hazard] Auth user:", req.user);
    
    const { type, lat, lng, severity, imageBase64, imageMimeType } = req.body;

    // ── 1. Basic validation ──────────────────────────────────────────────
    if (!type || lat == null || lng == null) {
      console.log("[Hazard] ❌ Validation failed: missing type/lat/lng");
      return res.status(400).json({ error: "type, lat, and lng are required" });
    }
    if (!imageBase64) {
      console.log("[Hazard] ❌ Validation failed: missing image");
      return res.status(400).json({ error: "Image is required for hazard verification" });
    }

    console.log("[Hazard] Basic validation passed:", { type, lat, lng, severity, imageSize: imageBase64?.length });

    // ── 2. User ID comes directly from JWT (no Firebase lookup needed) ───
    const userId = req.user.userId;
    console.log("[Hazard] User ID:", userId);


    // ── 3. Duplicate check — Haversine, same type only (30m radius) ──────
    console.log("[Hazard] Checking for duplicates...");
    const duplicate = await hazardService.checkDuplicate(
      parseFloat(lat),
      parseFloat(lng),
      type,               // Task 2: only block if SAME type exists nearby
      DUPLICATE_RADIUS_METERS
    );
    if (duplicate) {
      console.log("[Hazard] ❌ Duplicate found:", duplicate.id);
      return res.status(409).json({
        error: `A "${type}" has already been reported within 30m of this location.`,
        existing_hazard_id: duplicate.id,
      });
    }
    console.log("[Hazard] ✅ No duplicate found");

    // ── 4. Gemini image validation ────────────────────────────────────────
    console.log("[Hazard] Starting Gemini validation...");
    let validation;
    try {
      validation = await geminiService.validateImage(
        imageBase64,
        imageMimeType || "image/jpeg"
      );
      console.log("[Hazard] ✅ Gemini validation result:", validation);
    } catch (err) {
      console.log("[Hazard] ❌ Gemini validation error:", err.message);
      return res.status(503).json({ error: err.message });
    }

    // Reject if not a hazard or confidence too low
    if (!validation.is_hazard) {
      console.log("[Hazard] ❌ Image rejected: not a hazard");
      return res.status(422).json({
        error: "Image does not appear to contain a road hazard. Please capture a clear photo of the hazard.",
        gemini_result: { is_hazard: false, confidence: validation.confidence },
      });
    }
    if (validation.confidence < GEMINI_MIN_CONFIDENCE) {
      console.log("[Hazard] ❌ Image rejected: low confidence");
      return res.status(422).json({
        error: `Image confidence too low (${Math.round(validation.confidence * 100)}%). Please take a clearer photo.`,
        gemini_result: validation,
      });
    }
    console.log("[Hazard] ✅ Gemini validation passed");

    // ── 5. Insert hazard ─────────────────────────────────────────────────
    console.log("[Hazard] Inserting hazard into database...");
    const hazard = await hazardService.createHazard({
      type,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      severity: parseInt(severity) || 1,
      user_id: userId,
      confidence: validation.confidence,
    });
    
    console.log("[Hazard] ✅ Hazard created successfully:", hazard.id);
    console.log("[Hazard] Full hazard data:", JSON.stringify(hazard));

    const response = {
      ...hazard,
      gemini_validated: true,
      hazard_type_ai: validation.hazard_type,
    };
    console.log("[Hazard] Sending response:", response);
    res.status(201).json(response);
  } catch (err) {
    console.error("[Hazard] ❌ createHazard error:", err.message);
    console.error("[Hazard] Error stack:", err.stack);
    res.status(500).json({ error: err.message });
  }
};

// ── Existing methods below — NOT modified ─────────────────────────────────

exports.getHazards = async (req, res) => {
  try {
    const hazards = await hazardService.getHazards(req.query);
    res.json(hazards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/hazards/nearby?lat=22.57&lng=88.36&radius=500
 */
exports.getNearbyHazards = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng are required" });
    }

    const radiusMeters = parseFloat(radius) || 500;
    const hazards = await hazardService.getNearbyHazards(
      parseFloat(lat),
      parseFloat(lng),
      radiusMeters
    );

    res.json(hazards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Check if hazard already exist
exports.checkHazardExists = async (req, res) => {
	try {
		const { lat, lng } = req.query;

		if (!lat || !lng) {
			return res.status(400).json({ error: "lat and lng required" });
		}

		const exists = await hazardService.checkHazardExists(lat, lng);
		console.log("FINAL EXISTS:", exists); // 👈 ADD THIS

		//res.json({ exists: exists });
		return res.json({ exists, debug: "CHECK_API" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};
