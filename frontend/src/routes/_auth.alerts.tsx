import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Bell } from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import { bandFor } from "@/data/regions";
import { useRegionsData } from "@/hooks/useRegionsData";

export const Route = createFileRoute("/_auth/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — Entropy India" },
      { name: "description", content: "Active medical preparedness alerts across India." },
      { property: "og:title", content: "Alerts — Entropy India" },
      { property: "og:description", content: "Active medical preparedness alerts across India." },
    ],
  }),
  component: AlertsPage,
});

const FILTERS = ["all", "critical", "high", "elevated"] as const;
type Filter = (typeof FILTERS)[number];

const TEMPLATES = [
  { title: "AQI deterioration", reason: "PM2.5 sustained > 220 µg/m³ for 36h", category: "environmental" },
  { title: "Bed capacity nearing threshold", reason: "ICU occupancy 87% across reporting hospitals", category: "infrastructure" },
  { title: "Vector-borne case uptick", reason: "Dengue admissions +42% week-over-week", category: "outbreak" },
  { title: "Heatwave medical advisory", reason: "Forecast 44°C+ for next 5 days, vulnerable population high", category: "environmental" },
  { title: "Cyclone landfall window", reason: "IMD cyclone alert — coastal districts within 72h", category: "disaster" },
  { title: "Respiratory admissions surge", reason: "ILI admissions +28% in past 7 days", category: "outbreak" },
  { title: "Flood-zone access risk", reason: "3 PHCs cut off; ambulance ETA degraded", category: "disaster" },
  { title: "Specialist coverage gap", reason: "Doctor-to-population ratio below NHA threshold", category: "infrastructure" },
] as const;

const TIMES = ["just now", "12 min ago", "38 min ago", "1 h ago", "2 h ago", "3 h ago", "5 h ago", "8 h ago", "yesterday"];

function AlertsPage() {
  const { states, districts } = useRegionsData();
  const [filter, setFilter] = useState<Filter>("all");

  const allSortedRegions = useMemo(() => {
    return [...states, ...districts].sort((a, b) => b.score - a.score);
  }, [states, districts]);

  const liveAlerts = useMemo(() => {
    return allSortedRegions
      .filter((r) => r.score >= 50)
      .slice(0, 18)
      .map((r, i) => {
        const t = TEMPLATES[i % TEMPLATES.length];
        const b = bandFor(r.score);
        const severity = b === "critical" ? "critical" : b === "high" ? "high" : "elevated";
        return {
          id: `${r.id}-${i}`,
          regionId: r.id,
          regionName: r.name,
          severity,
          title: t.title,
          reason: t.reason,
          recommendation: r.recommendation || "Initiate regional surveillance.",
          issuedAt: TIMES[i % TIMES.length],
          category: t.category,
        };
      });
  }, [allSortedRegions]);

  const items = filter === "all" ? liveAlerts : liveAlerts.filter((a) => a.severity === filter);

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-12 pt-6">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to map
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Active</div>
          <h1 className="font-display text-4xl">Alerts</h1>
          <p className="mt-1 text-sm text-muted-foreground">{liveAlerts.length} regions crossing the preparedness threshold.</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
              type="button"
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {items.map((a) => {
          const r = [...states, ...districts].find((rg) => rg.id === a.regionId);
          return (
            <article key={a.id} className="grid grid-cols-[6px_1fr_auto] gap-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div
                className={`${
                  a.severity === "critical"
                    ? "bg-destructive"
                    : a.severity === "high"
                      ? "bg-[color:var(--color-risk-high)]"
                      : "bg-[color:var(--color-risk-elevated)]"
                }`}
              />
              <div className="py-4 pr-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <Bell className="h-3 w-3" />
                  {a.category} · {a.issuedAt}
                </div>
                <div className="mt-1 font-display text-xl">{a.title}</div>
                <div className="text-sm text-muted-foreground">{a.regionName}</div>
                <div className="mt-2 text-sm">{a.reason}</div>
                <div className="mt-2 rounded-lg border border-secondary/20 bg-secondary/5 px-3 py-2 text-sm">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-secondary">Recommendation</span>
                  <div className="mt-0.5">{a.recommendation}</div>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between gap-2 px-4 py-4">
                {r && <RiskBadge score={r.score} size="sm" />}
                <div className="font-display text-3xl tabular-nums">{r?.score ?? "—"}</div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}