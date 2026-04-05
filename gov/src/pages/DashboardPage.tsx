// src/pages/DashboardPage.tsx
import { useState } from "react";
import Header from "../components/Header";
import StatsGrid from "../components/StatsGrid";
import DataTable from "../components/DataTable";
import HazardPanel from "../components/HazardPanel";
import { useHazards } from "../hooks/useHazards";
import type { Hazard } from "../services/api";

export default function DashboardPage() {
  const { data: hazards = [], isPending, isError } = useHazards();
  const [selected, setSelected] = useState<Hazard | null>(null);

  return (
    <>
      <Header
        title="Dashboard Overview"
        subtitle="Real-time road hazard status across your jurisdiction"
      />

      <div className="gov-content">
        <StatsGrid />

        {isPending && (
          <div style={{ textAlign: "center", padding: "48px", color: "var(--gov-text-muted)" }}>
            <span className="spinner" /> Loading hazards…
          </div>
        )}
        {isError && (
          <div className="error-msg">Failed to load hazards. Check connection.</div>
        )}

        {!isPending && !isError && (
          <DataTable
            hazards={hazards}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />
        )}
      </div>

      {/* Syncs to latest hazard data via optimistic update */}
      <HazardPanel
        hazard={selected ? (hazards.find(h => h.id === selected.id) ?? selected) : null}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
