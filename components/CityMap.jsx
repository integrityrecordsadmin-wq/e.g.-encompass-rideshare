"use client";
import { ACCENT, AMBER } from "../lib/tokens";

// Simulated city grid map — no external Maps API wired in yet. Swap this
// component's internals for a real Google Maps <Map> once NEXT_PUBLIC_GOOGLE_MAPS_KEY
// is set (see README.md); everything that renders it just passes driverPos /
// showRoute / pins props, so callers won't need to change.
export default function CityMap({ driverPos, markerColor = AMBER, showRoute, routePath, pins = [] }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#23262E" strokeWidth="0.4" />
        </pattern>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.5" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="#15171D" />
      <rect width="100" height="100" fill="url(#grid)" />
      <line x1="0" y1="45" x2="100" y2="45" stroke="#2B2F3A" strokeWidth="1.4" />
      <line x1="60" y1="0" x2="60" y2="100" stroke="#2B2F3A" strokeWidth="1.4" />

      {showRoute && routePath && (
        <path
          d={`M ${routePath.map((p) => `${p.x} ${p.y}`).join(" L ")}`}
          fill="none"
          stroke={ACCENT}
          strokeWidth="1.1"
          strokeDasharray="2 2"
          opacity="0.8"
        />
      )}

      {pins.map((p, idx) => (
        <g key={idx} transform={`translate(${p.x} ${p.y})`}>
          <circle r="1.6" fill={p.color || "#F5F5F0"} stroke={ACCENT} strokeWidth="0.5" />
        </g>
      ))}

      {driverPos && (
        <g transform={`translate(${driverPos.x} ${driverPos.y})`}>
          <circle r="5" fill="url(#glow)" />
          <circle r="3.2" fill={markerColor} opacity="0.25">
            <animate attributeName="r" values="3;4.5;3" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle r="1.8" fill={markerColor} stroke="#111318" strokeWidth="0.5" />
        </g>
      )}
    </svg>
  );
}
