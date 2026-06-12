import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { type Region } from "@/data/regions";
import { RiskBadge } from "@/components/RiskBadge";
import { useRegionsData } from "@/hooks/useRegionsData";
import { compareStates } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_auth/compare")({
  head: () => ({
    meta: [
      { title: "Compare regions — Entropy India" },
      { name: "description", content: "Compare medical preparedness across Indian states." },
      { property: "og:title", content: "Compare regions — Entropy India" },
      { property: "og:description", content: "Compare medical preparedness across Indian states." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { states } = useRegionsData();
  const [aId, setAId] = useState("Telangana");
  const [bId, setBId] = useState("Delhi");

  const a = states.find((s) => s.id === aId) || states[0] || { name: "", score: 50, drivers: [], population: 0, elderlyPct: 0, infrastructure: { hospitals: 0, beds: 0, icuBeds: 0, ambulances: 0, doctorsPer10k: 0, coveragePct: 0 }, recommendation: "" };
  const b = states.find((s) => s.id === bId) || states[1] || states[0] || { name: "", score: 50, drivers: [], population: 0, elderlyPct: 0, infrastructure: { hospitals: 0, beds: 0, icuBeds: 0, ambulances: 0, doctorsPer10k: 0, coveragePct: 0 }, recommendation: "" };

  const compareQuery = useQuery({
    queryKey: ["compareStates", aId, bId],
    queryFn: () => compareStates(aId, bId),
    staleTime: 60000,
  });

  const compareData = compareQuery.data;

  const driverData = a.drivers.map((da) => {
    const db = b.drivers.find((x) => x.label === da.label);
    return { 
      driver: da.label, 
      [a.name || "Region A"]: da.contribution, 
      [b.name || "Region B"]: db?.contribution ?? 0 
    };
  });

  const metrics = compareData ? {
    popA: (compareData.state1.total_population / 100000).toFixed(1),
    popB: (compareData.state2.total_population / 100000).toFixed(1),
    hospA: compareData.state1.districts_count,
    hospB: compareData.state2.districts_count,
    bedsA: compareData.state1.total_beds.toLocaleString(),
    bedsB: compareData.state2.total_beds.toLocaleString(),
    docsA: compareData.state1.doctors_per_10000,
    docsB: compareData.state2.doctors_per_10000,
    covA: `${compareData.state1.average_drinking_water_score.toFixed(0)}%`,
    covB: `${compareData.state2.average_drinking_water_score.toFixed(0)}%`
  } : {
    popA: a.population,
    popB: b.population,
    hospA: a.infrastructure?.hospitals || 0,
    hospB: b.infrastructure?.hospitals || 0,
    bedsA: a.infrastructure?.beds?.toLocaleString() || "0",
    bedsB: b.infrastructure?.beds?.toLocaleString() || "0",
    docsA: a.infrastructure?.doctorsPer10k || 0,
    docsB: b.infrastructure?.doctorsPer10k || 0,
    covA: `${a.infrastructure?.coveragePct || 0}%`,
    covB: `${b.infrastructure?.coveragePct || 0}%`
  };


  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-12 pt-6">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to map
      </Link>
      <div className="mt-2">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Side by side</div>
        <h1 className="font-display text-4xl">Compare regions</h1>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Picker label="Region A" value={aId} onChange={setAId} states={states} />
        <Picker label="Region B" value={bId} onChange={setBId} states={states} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <RegionCard region={a} accent="var(--color-primary)" />
        <RegionCard region={b} accent="var(--color-secondary)" />
      </div>

      <section className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="font-display text-lg">Risk driver breakdown</div>
        <div className="text-xs text-muted-foreground">Points each factor contributes to the score</div>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={driverData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="driver" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={false}
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey={a.name} fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              <Bar dataKey={b.name} fill="var(--color-secondary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-surface text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Metric</th>
              <th className="px-4 py-3 text-right font-medium">{a.name}</th>
              <th className="px-4 py-3 text-right font-medium">{b.name}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <Row label="Stress index" a={a.score} b={b.score} />
            <Row label="Population (lakhs)" a={metrics.popA} b={metrics.popB} />
            <Row label="Elderly %" a={a.elderlyPct.toFixed(1)} b={b.elderlyPct.toFixed(1)} />
            <Row label="Hospitals" a={metrics.hospA} b={metrics.hospB} />
            <Row label="Beds" a={metrics.bedsA} b={metrics.bedsB} />
            <Row label="ICU beds" a={a.infrastructure?.icuBeds?.toLocaleString() || "—"} b={b.infrastructure?.icuBeds?.toLocaleString() || "—"} />
            <Row label="Ambulances" a={a.infrastructure?.ambulances?.toLocaleString() || "—"} b={b.infrastructure?.ambulances?.toLocaleString() || "—"} />
            <Row label="Doctors / 10k" a={metrics.docsA} b={metrics.docsB} />
            <Row label="Coverage %" a={metrics.covA} b={metrics.covB} />
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Picker({ label, value, onChange, states }: { label: string; value: string; onChange: (v: string) => void; states: Region[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      >
        {states.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  );
}

function RegionCard({ region, accent }: { region: Region; accent: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">State</div>
          <div className="font-display text-2xl">{region.name}</div>
        </div>
        <RiskBadge score={region.score} size="lg" />
      </div>
      <div className="mt-3 flex items-end gap-2">
        <div className="font-display text-5xl tabular-nums leading-none" style={{ color: accent }}>{region.score}</div>
        <div className="pb-1 text-xs text-muted-foreground">/ 100 stress index</div>
      </div>
      <div className="mt-3 text-sm text-muted-foreground">{region.recommendation}</div>
    </div>
  );
}

function Row({ label, a, b }: { label: string; a: string | number; b: string | number }) {
  return (
    <tr>
      <td className="px-4 py-2.5 text-muted-foreground">{label}</td>
      <td className="px-4 py-2.5 text-right font-medium tabular-nums">{a}</td>
      <td className="px-4 py-2.5 text-right font-medium tabular-nums">{b}</td>
    </tr>
  );
}
