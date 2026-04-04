// src/components/MapView.tsx
// Full-screen map with coloured hazard markers.
// Click a marker → select that hazard.

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Hazard } from "../services/api";

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || "";

const STATUS_COLOR: Record<string, string> = {
  active:      "#00ccff",
  in_progress: "#f6ad55",
  resolved:    "#a0aec0",
};

interface MapViewProps {
  hazards: Hazard[];
  selectedId: number | null;
  onSelect: (h: Hazard) => void;
  height?: string | number;
  onUserLocate?: (lng: number, lat: number) => void;
}

export default function MapView({
  hazards,
  selectedId,
  onSelect,
  height = "calc(100vh - 180px)",
  onUserLocate,
}: MapViewProps) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<maplibregl.Map | null>(null);
  const markersRef      = useRef<maplibregl.Marker[]>([]);
  const isLoadedRef     = useRef(false);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      center: [88.3639, 22.5726],
      zoom: 12,
    });

    mapRef.current.setStyle(
      `https://api.maptiler.com/maps/streets-v2-light/style.json?key=${MAPTILER_KEY}`,
      {
        transformStyle: (_prev, next) => ({
          ...next,
          projection: next.projection ?? { type: "mercator" },
        }),
      }
    );

    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    });
    mapRef.current.addControl(geolocate, "top-right");

    if (onUserLocate) {
      geolocate.on("geolocate", (e: GeolocationPosition) => {
        onUserLocate(e.coords.longitude, e.coords.latitude);
      });
    }

    mapRef.current.on("load", () => {
      isLoadedRef.current = true;
      geolocate.trigger(); // Auto-locate user on load
    });

    mapRef.current.on("styleimagemissing", (e: { id: string }) => {
      if (!e.id || !e.id.trim()) return;
      mapRef.current?.addImage(e.id, new ImageData(new Uint8ClampedArray(4), 1, 1));
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      mapRef.current?.remove();
      mapRef.current = null;
      isLoadedRef.current = false;
    };
  }, []);

  // Sync markers whenever hazards change
  useEffect(() => {
    if (!mapRef.current) return;

    const addMarkers = () => {
      // Clear existing markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      hazards.forEach((h) => {
        const el = document.createElement("div");
        const isSelected = h.id === selectedId;
        el.style.cssText = `
          width: ${isSelected ? 18 : 12}px;
          height: ${isSelected ? 18 : 12}px;
          border-radius: 50%;
          background: ${STATUS_COLOR[h.status] ?? "#00ccff"};
          border: ${isSelected ? "3px" : "2px"} solid white;
          box-shadow: 0 1px 6px rgba(0,0,0,${isSelected ? ".4" : ".2"});
          cursor: pointer;
          transition: transform .15s;
        `;
        el.title = `#${h.id} — ${h.type} (${h.status})`;
        el.addEventListener("click", () => onSelect(h));

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([h.lng, h.lat])
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      });
    };

    if (isLoadedRef.current) {
      addMarkers();
    } else {
      mapRef.current.once("load", addMarkers);
    }
  }, [hazards, selectedId, onSelect]);

  return (
    <div
      className="map-container"
      ref={containerRef}
      style={{ height, width: "100%" }}
    />
  );
}
