// app/welcome/page.tsx
// Landing page — shown to unauthenticated users.
// Purely presentational, no auth dependencies.

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to RideBuddy — Safe Roads for Everyone",
  description: "Join thousands of drivers reporting real-time road hazards. Navigate safely with community-powered alerts.",
};

export default function WelcomePage() {
  return (
    <main className="welcome-page">
      {/* Background gradient orbs */}
      <div className="welcome-orb welcome-orb--1" aria-hidden="true" />
      <div className="welcome-orb welcome-orb--2" aria-hidden="true" />

      <div className="welcome-container">
        {/* Logo */}
        <div className="welcome-logo">
          <span className="welcome-logo__icon">🛡️</span>
          <span className="welcome-logo__text">RideBuddy</span>
        </div>

        {/* Hero */}
        <h1 className="welcome-headline">
          Navigate roads<br />
          <span className="welcome-headline--accent">safely together</span>
        </h1>
        <p className="welcome-sub">
          Real-time hazard alerts powered by AI and your community.
          Report potholes, floods, and road blocks — protect every driver.
        </p>

        {/* Feature pills */}
        <div className="welcome-features">
          {[
            { icon: "🗺️", label: "Live hazard map" },
            { icon: "🤖", label: "AI-verified reports" },
            { icon: "🔔", label: "Proximity alerts" },
            { icon: "📍", label: "Safe routing" },
          ].map((f) => (
            <div key={f.label} className="welcome-feature-pill">
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link href="/login" className="welcome-cta" id="get-started-btn">
          Get Started Free
          <span className="welcome-cta__arrow">→</span>
        </Link>

        <p className="welcome-legal">
          By continuing you agree to our Terms of Service. No personal data is sold.
        </p>
      </div>
    </main>
  );
}
