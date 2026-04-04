// src/config/firebase.js
// Firebase Admin SDK singleton.
// Integration point: imported by auth.middleware.js only.
// Credentials come from individual env vars (avoids needing a JSON file in prod).

const admin = require("firebase-admin");

if (!admin.apps.length) {
  // Support both a JSON service account file path (local dev) or individual env vars (prod)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Individual env vars — safer for production where no file system access
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace literal \n in env var with actual newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
}

module.exports = admin;
