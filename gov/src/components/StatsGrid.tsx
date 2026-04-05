// src/components/StatsGrid.tsx
import { useStats } from "../hooks/useHazards";

const CARDS = [
  { key: "total",       label: "Total Hazards",      color: "#00ccff" },
  { key: "active",      label: "Active",              color: "#00ccff" },
  { key: "in_progress", label: "In Progress",         color: "#f6ad55" },
  { key: "resolved",    label: "Resolved",            color: "#a0aec0" },
] as const;

export default function StatsGrid() {
  const { data, isPending } = useStats();

  return (
    <div className="stats-grid">
      {CARDS.map(({ key, label, color }) => (
        <div className="stat-card" key={key}>
          <div className="stat-card__label">{label}</div>
          <div className="stat-card__value">
            <span className="stat-card__accent" style={{ background: color }} />
            {isPending ? "—" : (data?.[key] ?? "0")}
          </div>
        </div>
      ))}
    </div>
  );
}
