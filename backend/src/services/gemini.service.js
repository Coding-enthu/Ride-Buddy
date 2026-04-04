// src/services/gemini.service.js
// Isolated Gemini image validation service.
// IMPORTANT: Images are never stored — base64 is used in-memory only and discarded after the API call.
// Integration point: called from hazard.controller.js only.
//
// Model: gemini-flash-latest (v1beta — confirmed working)

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Prompt covers all hazard types used in the frontend HAZARD_TYPES list
const VALIDATION_PROMPT = `You are a road safety inspection AI for Indian roads.

Analyze the image and determine if it shows a real road hazard or unsafe road condition.

Valid hazard types (accept any of these):
- pothole
- flood / waterlogging
- accident / vehicle collision
- roadblock / obstruction
- debris / rocks / fallen objects
- speed breaker (marked or unmarked)
- road crack / damaged surface
- patch work / uneven road repair
- poor lighting / low visibility
- other road safety issue

Rules:
- Return JSON only, no extra text, no markdown fences
- Accept the image if it clearly shows ANY road hazard or unsafe condition
- Reject only if the image is completely unrelated to roads (e.g. selfie, food, sky)
- Blurry images of road hazards should still be accepted if the hazard is visible
- Be PERMISSIVE — err on the side of accepting road hazard images

Output format (strict JSON, no extra text):
{"is_hazard": true/false, "hazard_type": "string or null", "confidence": 0.0 to 1.0}`;

/**
 * Validates a base64-encoded image using Gemini.
 * @param {string} base64Image - Pure base64 string (no data URL prefix)
 * @param {string} mimeType - e.g. "image/jpeg"
 * @returns {{ is_hazard: boolean, hazard_type: string|null, confidence: number }}
 */
exports.validateImage = async (base64Image, mimeType = "image/jpeg") => {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const imagePart = {
    inlineData: {
      data: base64Image, // Used only for this request — never persisted
      mimeType,
    },
  };

  let responseText;
  try {
    const result = await model.generateContent([VALIDATION_PROMPT, imagePart]);
    responseText = result.response.text().trim();
  } catch (err) {
    // 429 Rate limit — skip validation gracefully so user reports aren't blocked
    if (err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("Too Many")) {
      console.warn("[Gemini] Rate limit hit — skipping AI validation for this request");
      return { is_hazard: true, hazard_type: null, confidence: 1.0, skipped: true };
    }
    console.error("[Gemini] API call failed:", err.message);
    throw new Error("Image validation service unavailable. Please try again.");
  }

  // Strip any accidental markdown fences (e.g. ```json ... ```)
  const cleaned = responseText
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/```$/i, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[Gemini] Failed to parse response:", responseText);
    throw new Error("Image validation returned an unexpected response.");
  }

  return {
    is_hazard: Boolean(parsed.is_hazard),
    hazard_type: parsed.hazard_type ?? null,
    confidence: Number(parsed.confidence) || 0,
  };
};
