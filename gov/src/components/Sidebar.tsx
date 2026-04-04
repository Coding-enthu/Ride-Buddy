// src/components/Sidebar.tsx
import { NavLink, useNavigate } from "react-router-dom";
import { authService } from "../services/auth";
import { useAuthContext } from "../store/auth.store";

const NAV = [
  { to: "/dashboard",    icon: "▦",  label: "Dashboard" },
  { to: "/hazards",      icon: "⚠️", label: "Hazards"   },
  { to: "/map",          icon: "🗺",  label: "Map View"  },
];

export default function Sidebar() {
  const { user, setUser } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigate("/login", { replace: true });
  };

  const initials = user?.name
    ? user.name.split(" ").map(s => s[0]).join("").toUpperCase().slice(0, 2)
    : "OF";

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-icon">🏥</div>
        <div>
          <div className="sidebar__brand-name">GovOps Portal</div>
          <div className="sidebar__brand-sub">Road Hazard Command</div>
        </div>
      </div>

      <nav className="sidebar__nav">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__link${isActive ? " sidebar__link--active" : ""}`
            }
          >
            <span className="sidebar__link-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">{initials}</div>
          <div>
            <div className="sidebar__user-name">{user?.name || "Official"}</div>
            <div className="sidebar__user-role">Government Official</div>
          </div>
        </div>
        <button className="sidebar__logout" onClick={handleLogout}>
          <span>⬅</span> Log out
        </button>
      </div>
    </aside>
  );
}
