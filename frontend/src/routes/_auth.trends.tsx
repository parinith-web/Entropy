import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRegionsData } from "@/hooks/useRegionsData";
import { getRegionTrends } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_auth/trends")({
  head: () => ({
    meta: [
      { title: "Trends — MedPulse India" },
      { name: "description", content: "Historical medical stress trends across Indian states." },
      { property: "og:title", content: "Trends — MedPulse India" },
      { property: "og:description", content: "Historical medical stress trends across Indian states." },
    ],
  }),
  component: TrendsPage,
});

const RANGES = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
] as const;

function TrendsPage() {
  const { states, nationalStats } = useRegionsData();
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("30d");
  const [stateId, setStateId] = useState<string>("");

  useEffect(() => {
    if (states.length > 0 && !stateId) {
      setStateId(states[0].id);
    }
  }, [states, stateId]);

  const days = RANGES.find((r) => r.id === range)!.days;

  // Fetch state trend dynamically
  const stateTrendQuery = useQuery({
    queryKey: ["stateTrends", stateId, days],
    queryFn: () => getRegionTrends(stateId, undefined, days),
    enabled: !!stateId,
    staleTime: 60000,
  });

  const series = stateTrendQuery.data ?? [];
  const national = nationalStats.trend ? nationalStats.trend.slice(-days) : [];
  const region = states.find((s) => s.id === stateId) || states[0];


  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-12 pt-6">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to map
      </Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Historical</div>
          <h1 className="font-display text-4xl">Trends</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            How the national and regional stress index has moved over time.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                range === r.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card label="National avg" value={nationalStats.avgScore} unit="/100" tone="primary" />
        <Card label="Critical regions" value={nationalStats.critical} unit="states" tone="critical" />
        <Card label="Hospitals tracked" value={nationalStats.hospitals.toLocaleString()} unit="" tone="muted" />
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="font-display text-lg">National stress index</div>
        <div className="text-xs text-muted-foreground">Average across all states · last {days} days</div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={national} margin={{ left: 0, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="nat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="t" 
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} 
                axisLine={false} 
                tickLine={false} 
                interval={national && national.length > 5 ? Math.floor(national.length / 5) : 0}
                tickFormatter={(tick) => {
                  if (typeof tick === "string") {
                    return tick.split(" ").slice(0, 2).join(" ");
                  }
                  return tick;
                }}
              />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2} fill="url(#nat)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-display text-lg">{region?.name || ""} · stress vs AQI vs admissions</div>
            <div className="text-xs text-muted-foreground">Last {days} days</div>
          </div>
          <select
            value={stateId}
            onChange={(e) => setStateId(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          >
            {states.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="t" 
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} 
                axisLine={false} 
                tickLine={false} 
                interval={series && series.length > 5 ? Math.floor(series.length / 5) : 0}
                tickFormatter={(tick) => {
                  if (typeof tick === "string") {
                    return tick.split(" ").slice(0, 2).join(" ");
                  }
                  return tick;
                }}
              />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} name="Stress index" />
              <Line type="monotone" dataKey="aqi" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} name="AQI" />
              <Line type="monotone" dataKey="admissions" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} name="Admissions" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <Legend color="var(--color-primary)" label="Stress index" />
          <Legend color="var(--color-chart-3)" label="AQI" />
          <Legend color="var(--color-chart-2)" label="Admissions" />
        </div>
      </section>
    </div>
  );
}

function Card({ label, value, unit, tone }: { label: string; value: number | string; unit: string; tone: "primary" | "critical" | "muted" }) {
  const toneClass = {
    primary: "border-primary/20 bg-primary/5",
    critical: "border-destructive/20 bg-destructive/5",
    muted: "border-border bg-surface",
  }[tone];
  return (
    <div className={`rounded-2xl border p-5 ${toneClass}`}>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-4xl tabular-nums leading-none">{value}<span className="ml-1 text-base text-muted-foreground">{unit}</span></div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}