"use client";

// app/_hooks/useAuth.ts
// Custom JWT auth — no Firebase. Tokens stored in sessionStorage.
// Provides: user, loading, idToken, signIn, signUp, resetPassword, signOut.

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
const TOKEN_KEY = "rb_token";
const USER_KEY  = "rb_user";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  idToken: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<string>;
  signOut: () => void;
}

async function apiFetch(path: string, body: object) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export function useAuth(): AuthState {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from sessionStorage on mount
  useEffect(() => {
    try {
      const storedToken = sessionStorage.getItem(TOKEN_KEY);
      const storedUser  = sessionStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        setIdToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // sessionStorage not available (SSR) — skip
    }
    setLoading(false);
  }, []);

  const persist = (token: string, userData: AuthUser) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
    setIdToken(token);
    setUser(userData);
  };

  const signIn = async (email: string, password: string) => {
    const data = await apiFetch("/auth/login", { email, password });
    persist(data.token, data.user);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const data = await apiFetch("/auth/register", {
      email,
      password,
      name: displayName,
    });
    persist(data.token, data.user);
  };

  const resetPassword = async (email: string): Promise<string> => {
    // Backend doesn't have email sending yet — inform the user
    throw new Error(
      "Password reset via email is not configured yet. Please contact support or create a new account."
    );
  };

  const signOut = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setIdToken(null);
    setUser(null);
  };

  return { user, loading, idToken, signIn, signUp, resetPassword, signOut };
}
