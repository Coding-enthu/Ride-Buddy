// src/components/MapPreview.tsx
// Small embedded map showing a single hazard pin.
// Lazy-initialised on mount, cleaned up on unmount.

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || "";

interface MapPreviewProps {
  lat: number;
  lng: number;
  status: string;
  height?: number;
}

const STATUS_COLOR: Record<string, string> = {
  active:      "#00ccff",
  in_progress: "#f6ad55",
  resolved:    "#a0aec0",
};

export default function MapPreview({ lat, lng, status, height = 180 }: MapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  const markerRef    = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      center: [lng, lat],
      zoom: 15,
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

    mapRef.current.on("load", () => {
      if (!mapRef.current) return;
      const el = document.createElement("div");
      el.style.cssText = `
        width:14px; height:14px; border-radius:50%;
        background:${STATUS_COLOR[status] ?? "#00ccff"};
        border:2px solid white;
        box-shadow:0 1px 4px rgba(0,0,0,.3);
      `;
      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
    });

    return () => {
      markerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker colour if status changes
  useEffect(() => {
    const el = markerRef.current?.getElement();
    if (el) el.style.background = STATUS_COLOR[status] ?? "#00ccff";
  }, [status]);

  return (
    <div
      className="map-preview-container"
      ref={containerRef}
      style={{ height, width: "100%" }}
    />
  );
}
