// src/App.tsx
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "./store/auth.store";
import { authService } from "./services/auth";
import type { AuthUser } from "./services/auth";
import Sidebar from "./components/Sidebar";
import LoginPage    from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import HazardsPage  from "./pages/HazardsPage";
import MapPage      from "./pages/MapPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="gov-layout">
      <Sidebar />
      <div className="gov-main">{children}</div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(authService.getUser());

  useEffect(() => {
    // Keep state in sync if user logs in a different tab
    const stored = authService.getUser();
    setUser(stored);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ user, setUser }}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/hazards" element={
              <ProtectedRoute><HazardsPage /></ProtectedRoute>
            } />
            <Route path="/map" element={
              <ProtectedRoute><MapPage /></ProtectedRoute>
            } />
            {/* Default: redirect to dashboard or login */}
            <Route path="*" element={
              <Navigate to={authService.isAuthenticated() ? "/dashboard" : "/login"} replace />
            } />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
