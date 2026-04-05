// src/store/auth.store.ts
// Minimal auth store — wraps authService in React state.
// No external state library needed.

import { createContext, useContext } from "react";
import type { AuthUser } from "../services/auth";

interface AuthContextValue {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => {},
});

export const useAuthContext = () => useContext(AuthContext);
