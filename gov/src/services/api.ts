// src/services/api.ts
// Central API client for the gov dashboard.
// Every request automatically attaches the JWT from sessionStorage.

import { authService } from "./auth";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = authService.getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  if (res.status === 401) {
    // Token expired — clear session and redirect to login
    authService.logout();
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data as T;
}

// ── Hazard types ─────────────────────────────────────────────────────────────

export interface Hazard {
  id: number;
  type: string;
  lat: number;
  lng: number;
  severity: number;
  status: "active" | "in_progress" | "resolved";
  confidence: number | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by_user_id: number | null;
  user_id: number | null;
}

export interface GovStats {
  total: string;
  active: string;
  in_progress: string;
  resolved: string;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const api = {
  /** GET all hazards — uses existing public endpoint */
  getHazards: () => request<Hazard[]>("/api/hazards"),

  /** GET gov stats — requires official role */
  getStats: () => request<GovStats>("/api/gov/stats"),

  /** PATCH hazard status — requires official role */
  updateStatus: (id: number, status: "active" | "in_progress" | "resolved") =>
    request<Hazard>(`/api/hazards/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
