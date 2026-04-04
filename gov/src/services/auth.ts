// src/services/auth.ts
// Custom JWT auth for the gov dashboard.
// Mirrors the main app's auth approach — uses sessionStorage to persist token.

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  token: string;
}

const TOKEN_KEY = "gov_token";
const USER_KEY  = "gov_user";

export const authService = {
  login: async (email: string, password: string): Promise<AuthUser> => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    // Role gate — only officials may access this dashboard
    if (data.user?.role !== "official") {
      throw new Error("Access denied. This portal is restricted to government officials.");
    }

    const authUser: AuthUser = { ...data.user, token: data.token };
    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(authUser));
    return authUser;
  },

  logout: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  getToken: (): string | null => sessionStorage.getItem(TOKEN_KEY),

  getUser: (): AuthUser | null => {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as AuthUser; }
    catch { return null; }
  },

  isAuthenticated: (): boolean => {
    const user = authService.getUser();
    return !!user && user.role === "official";
  },
};
