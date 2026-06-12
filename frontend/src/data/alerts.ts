import { STATES, DISTRICTS, bandFor, type Region } from "./regions";

export interface Alert {
  id: string;
  regionId: string;
  regionName: string;
  severity: "critical" | "high" | "elevated";
  title: string;
  reason: string;
  recommendation: string;
  issuedAt: string; // relative
  category: "environmental" | "outbreak" | "infrastructure" | "disaster";
}

const TEMPLATES: Array<Pick<Alert, "title" | "reason" | "category">> = [
  { title: "AQI deterioration", reason: "PM2.5 sustained > 220 µg/m³ for 36h", category: "environmental" },
  { title: "Bed capacity nearing threshold", reason: "ICU occupancy 87% across reporting hospitals", category: "infrastructure" },
  { title: "Vector-borne case uptick", reason: "Dengue admissions +42% week-over-week", category: "outbreak" },
  { title: "Heatwave medical advisory", reason: "Forecast 44°C+ for next 5 days, vulnerable population high", category: "environmental" },
  { title: "Cyclone landfall window", reason: "IMD cyclone alert — coastal districts within 72h", category: "disaster" },
  { title: "Respiratory admissions surge", reason: "ILI admissions +28% in past 7 days", category: "outbreak" },
  { title: "Flood-zone access risk", reason: "3 PHCs cut off; ambulance ETA degraded", category: "disaster" },
  { title: "Specialist coverage gap", reason: "Doctor-to-population ratio below NHA threshold", category: "infrastructure" },
];

function sevFor(r: Region): Alert["severity"] {
  const b = bandFor(r.score);
  if (b === "critical") return "critical";
  if (b === "high") return "high";
  return "elevated";
}

const TIMES = ["just now", "12 min ago", "38 min ago", "1 h ago", "2 h ago", "3 h ago", "5 h ago", "8 h ago", "yesterday"];

function pickAlertsFor(regions: Region[]): Alert[] {
  return regions
    .filter((r) => r.score >= 50)
    .slice(0, 18)
    .map((r, i) => {
      const t = TEMPLATES[i % TEMPLATES.length];
      return {
        id: `${r.id}-${i}`,
        regionId: r.id,
        regionName: r.name,
        severity: sevFor(r),
        title: t.title,
        reason: t.reason,
        recommendation: r.recommendation,
        issuedAt: TIMES[i % TIMES.length],
        category: t.category,
      };
    });
}

const sorted = [...STATES, ...DISTRICTS].sort((a, b) => b.score - a.score);
export const ALERTS: Alert[] = pickAlertsFor(sorted);