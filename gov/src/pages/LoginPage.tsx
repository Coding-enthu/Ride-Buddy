// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth";
import { useAuthContext } from "../store/auth.store";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const { setUser }             = useAuthContext();
  const navigate                = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Email and password are required."); return; }
    setLoading(true);
    setError(null);
    try {
      const user = await authService.login(email, password);
      setUser(user);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-card__emblem">🏛️</div>
        <h1 className="login-card__title">Government Portal</h1>
        <p className="login-card__subtitle">
          Road Hazard Operations — Officials Only
        </p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Official Email</label>
            <input
              id="gov-email"
              className="form-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@gov.in"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label">Password</label>
            <input
              id="gov-password"
              className="form-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            className="btn btn--primary"
            type="submit"
            disabled={loading}
            style={{ marginTop: "8px" }}
          >
            {loading ? <><span className="spinner" /> Signing in…</> : "Sign In"}
          </button>
        </form>

        <p style={{ marginTop: "16px", fontSize: "12px", color: "var(--gov-text-muted)", textAlign: "center" }}>
          Access restricted to authorised government officials
        </p>
      </div>
    </div>
  );
}
