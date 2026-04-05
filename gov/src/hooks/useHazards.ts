// src/hooks/useHazards.ts
// React Query hooks for hazard data.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import type { Hazard } from "../services/api";

const HAZARD_KEY = ["hazards"];
const STATS_KEY  = ["govStats"];

export function useHazards() {
  return useQuery({
    queryKey: HAZARD_KEY,
    queryFn: api.getHazards,
    refetchInterval: 60_000, // auto-refresh every 60s
    staleTime: 30_000,
  });
}

export function useStats() {
  return useQuery({
    queryKey: STATS_KEY,
    queryFn: api.getStats,
    refetchInterval: 60_000,
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: Hazard["status"] }) =>
      api.updateStatus(id, status),

    // Optimistic update: instantly reflect change in UI
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: HAZARD_KEY });
      const previous = qc.getQueryData<Hazard[]>(HAZARD_KEY);
      qc.setQueryData<Hazard[]>(HAZARD_KEY, (old) =>
        old ? old.map((h) => (h.id === id ? { ...h, status } : h)) : old
      );
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      // Roll back on failure
      if (ctx?.previous) qc.setQueryData(HAZARD_KEY, ctx.previous);
    },

    onSettled: () => {
      // Sync real state from server
      qc.invalidateQueries({ queryKey: HAZARD_KEY });
      qc.invalidateQueries({ queryKey: STATS_KEY });
    },
  });
}
