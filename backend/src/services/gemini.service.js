// src/services/gemini.service.js
// Isolated Gemini image validation service.
// IMPORTANT: Images are never stored — base64 is used in-memory only and discarded after the API call.
// Integration point: called from hazard.controller.js only.

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Strict prompt — return JSON only so we can parse reliably
const VALIDATION_PROMPT = `You are a road safety inspection AI.

Analyze the image and determine if it contains a real road hazard.

Valid hazard types:
- pothole
- unmarked speed breaker
- road crack
- waterlogging
- debris

Rules:
- Return JSON only, no extra text, no markdown
- Reject unclear, blurry, or unrelated images
- Be conservative — only confirm if clearly visible

Output format (strict):
{"is_hazard": true/false, "hazard_type": "string or null", "confidence": 0.0 to 1.0}`;

/**
 * Validates a base64-encoded image using Gemini.
 * @param {string} base64Image - Pure base64 string (no data URL prefix)
 * @param {string} mimeType - e.g. "image/jpeg"
 * @returns {{ is_hazard: boolean, hazard_type: string|null, confidence: number }}
 */
exports.validateImage = async (base64Image, mimeType = "image/jpeg") => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    console.error("[Gemini] API call failed:", err.message);
    throw new Error("Image validation service unavailable. Please try again.");
  }

  // Strip any accidental markdown fences (e.g. ```json ... ```)
  const cleaned = responseText.replace(/^```[a-z]*\n?/i, "").replace(/```$/i, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[Gemini] Failed to parse response:", responseText);
    throw new Error("Image validation returned an unexpected response.");
  }

  // Normalise and validate required fields
  return {
    is_hazard: Boolean(parsed.is_hazard),
    hazard_type: parsed.hazard_type ?? null,
    confidence: Number(parsed.confidence) || 0,
  };
};
