import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, BedDouble, Ambulance, Stethoscope, Users, TrendingUp, CloudSun, Activity } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { bandFor, RISK_LABELS, type Region } from "@/data/regions";
import { RiskBadge } from "./RiskBadge";
import { useQuery } from "@tanstack/react-query";
import { getRegionDetails, getRegionTrends } from "@/lib/api/client";

export function RegionDetail({
  region,
  onClose,
  onSelectDistrict,
  districtsList = [],
  stateList = []
}: {
  region: Region | null;
  onClose: () => void;
  onSelectDistrict?: (r: Region) => void;
  districtsList?: Region[];
  stateList?: Region[];
}) {
  return (
    <AnimatePresence>
      {region && (
        <motion.aside
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="flex h-full w-full flex-col overflow-hidden bg-card"
        >
          <DetailContent 
            region={region} 
            onClose={onClose} 
            onSelectDistrict={onSelectDistrict} 
            districtsList={districtsList}
            stateList={stateList}
          />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function DetailContent({
  region,
  onClose,
  onSelectDistrict,
  districtsList = [],
  stateList = []
}: {
  region: Region;
  onClose: () => void;
  onSelectDistrict?: (r: Region) => void;
  districtsList?: Region[];
  stateList?: Region[];
}) {
  const isState = region.type === "state";
  const dbId = region.backendId ?? districtsList.find((d) => d.id === region.id)?.backendId;

  // 1. Fetch live details for districts
  const detailsQuery = useQuery({
    queryKey: ["regionDetails", region.id, dbId],
    queryFn: () => getRegionDetails(dbId!),
    enabled: !isState && !!dbId,
    staleTime: 60000,
  });

  // 2. Fetch live trends for both states and districts
  const trendsQuery = useQuery({
    queryKey: ["regionTrends", region.id, dbId],
    queryFn: () => getRegionTrends(region.id, dbId, 30),
    staleTime: 60000,
  });

  const activeRegion = detailsQuery.data ?? region;
  const trendData = trendsQuery.data ?? region.trend;

  const band = bandFor(activeRegion.score);
  const districts = isState ? districtsList.filter((d) => d.parentId === region.id) : [];
  const maxDriver = activeRegion.drivers.length > 0 ? Math.max(...activeRegion.drivers.map((d) => d.contribution)) : 10;
  const riskBarGradient = "linear-gradient(90deg, #e0f2fe, #0369a1)";

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {region.type === "state" ? "State" : "District"} · {RISK_LABELS[band]}
            </div>
            <h2 className="mt-0.5 font-display text-2xl leading-tight">{region.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <div className="font-display text-5xl tabular-nums leading-none">
              {activeRegion.score}
              <span className="ml-1 text-base text-muted-foreground">/100</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Medical Stress Index</div>
          </div>
          <RiskBadge score={activeRegion.score} size="lg" />
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full"
            style={{
              width: `${activeRegion.score}%`,
              background: riskBarGradient,
            }}
          />
        </div>
      </div>

      <div className="space-y-6 px-6 py-5">
        <section>
          <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-secondary">
              Recommendation
            </div>
            <p className="mt-1.5 text-sm leading-relaxed">{activeRegion.recommendation}</p>
          </div>
        </section>

        <section>
          <SectionTitle icon={<TrendingUp className="h-3.5 w-3.5" />}>Top risk drivers</SectionTitle>
          <div className="mt-3 space-y-2.5">
            {activeRegion.drivers.map((d) => (
              <div key={d.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{d.label}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">+{d.contribution}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(d.contribution / maxDriver) * 100}%`,
                      background: riskBarGradient,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {!isState && activeRegion.weather && (
          <section className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <SectionTitle icon={<CloudSun className="h-3.5 w-3.5" />}>Live weather observation</SectionTitle>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-border bg-surface/50 p-2.5">
                <div className="text-muted-foreground">Temperature</div>
                <div className="mt-0.5 font-display text-base font-semibold">{activeRegion.weather.temperature}°C</div>
              </div>
              <div className="rounded-lg border border-border bg-surface/50 p-2.5">
                <div className="text-muted-foreground">Humidity</div>
                <div className="mt-0.5 font-display text-base font-semibold">{activeRegion.weather.humidity}%</div>
              </div>
              <div className="rounded-lg border border-border bg-surface/50 p-2.5">
                <div className="text-muted-foreground">Air Quality (AQI)</div>
                <div className="mt-0.5 font-display text-base font-semibold">{activeRegion.weather.aqi}</div>
              </div>
              <div className="rounded-lg border border-border bg-surface/50 p-2.5">
                <div className="text-muted-foreground">Precipitation</div>
                <div className="mt-0.5 font-display text-base font-semibold">{activeRegion.weather.precipitation} mm</div>
              </div>
            </div>
          </section>
        )}

        {!isState && activeRegion.hospital && (
          <section className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <SectionTitle icon={<Activity className="h-3.5 w-3.5" />}>Hospital live status</SectionTitle>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-border bg-surface/50 p-2.5">
                  <div className="text-muted-foreground">Active Patients</div>
                  <div className="mt-0.5 font-display text-base font-semibold">{activeRegion.hospital.active_patients}</div>
                </div>
                <div className="rounded-lg border border-border bg-surface/50 p-2.5">
                  <div className="text-muted-foreground">New Admissions (3h)</div>
                  <div className="mt-0.5 font-display text-base font-semibold">{activeRegion.hospital.admitted_count}</div>
                </div>
                <div className="rounded-lg border border-border bg-surface/50 p-2.5">
                  <div className="text-muted-foreground">ICU Patients</div>
                  <div className="mt-0.5 font-display text-base font-semibold">{activeRegion.hospital.icu_load}</div>
                </div>
                <div className="rounded-lg border border-border bg-surface/50 p-2.5">
                  <div className="text-muted-foreground">Beds Occupied</div>
                  <div className="mt-0.5 font-display text-base font-semibold">
                    {activeRegion.hospital.beds_occupied} / {activeRegion.hospital.total_beds_capacity}
                  </div>
                </div>
              </div>
              
              {activeRegion.hospital.total_beds_capacity > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Bed occupancy ratio</span>
                    <span>{Math.round((activeRegion.hospital.beds_occupied / activeRegion.hospital.total_beds_capacity) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div 
                      className="h-full bg-sky-600" 
                      style={{ 
                        width: `${Math.min(100, (activeRegion.hospital.beds_occupied / activeRegion.hospital.total_beds_capacity) * 100)}%` 
                      }} 
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {!isState && activeRegion.wellness && (
          <section className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <SectionTitle icon={<Building2 className="h-3.5 w-3.5" />}>Daily regional wellness</SectionTitle>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wellness Index Score</span>
                <span className="font-semibold">{activeRegion.wellness.wellness_score}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Air Quality Score</span>
                <span className="font-semibold">{activeRegion.wellness.air_quality_score}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Drinking Water Access</span>
                <span className="font-semibold">{activeRegion.wellness.access_score}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sanitation Score</span>
                <span className="font-semibold">{activeRegion.wellness.sanitation_score}/100</span>
              </div>
            </div>
          </section>
        )}

        <section>
          <SectionTitle>30-day trend</SectionTitle>
          <div className="mt-2 h-32 w-full">
            {trendsQuery.isLoading ? (
              <div className="grid h-full place-items-center text-xs text-muted-foreground">Loading trend...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="t" 
                    tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} 
                    axisLine={false} 
                    tickLine={false} 
                    interval={trendData && trendData.length > 5 ? Math.floor(trendData.length / 5) : 0}
                    tickFormatter={(tick) => {
                      if (typeof tick === "string") {
                        return tick.split(" ").slice(0, 2).join(" ");
                      }
                      return tick;
                    }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "var(--color-muted-foreground)" }}
                  />
                  <Area type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2} fill="url(#trendFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section>
          <SectionTitle icon={<Building2 className="h-3.5 w-3.5" />}>Healthcare infrastructure</SectionTitle>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Metric icon={<Building2 className="h-3.5 w-3.5" />} label="Hospitals" value={activeRegion.infrastructure.hospitals.toLocaleString()} />
            <Metric icon={<BedDouble className="h-3.5 w-3.5" />} label="Beds" value={activeRegion.infrastructure.beds.toLocaleString()} />
            <Metric icon={<BedDouble className="h-3.5 w-3.5" />} label="ICU beds" value={activeRegion.infrastructure.icuBeds.toLocaleString()} />
            <Metric icon={<Ambulance className="h-3.5 w-3.5" />} label="Ambulances" value={activeRegion.infrastructure.ambulances.toLocaleString()} />
            <Metric icon={<Stethoscope className="h-3.5 w-3.5" />} label="Doctors / 10k" value={activeRegion.infrastructure.doctorsPer10k.toString()} />
            <Metric icon={<Users className="h-3.5 w-3.5" />} label="Coverage" value={`${activeRegion.infrastructure.coveragePct}%`} />
          </div>
        </section>

        <section>
          <SectionTitle>Demographics</SectionTitle>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Metric label="Population" value={`${activeRegion.population} L`} />
            <Metric label="Elderly" value={`${activeRegion.elderlyPct.toFixed(1)}%`} />
            <Metric label="Children" value={`${activeRegion.childPct.toFixed(0)}%`} />
          </div>
        </section>

        {isState && districts.length > 0 && (
          <section>
            <SectionTitle>Districts ({districts.length})</SectionTitle>
            <div className="mt-2 divide-y divide-border rounded-xl border border-border">
              {districts
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onSelectDistrict?.(d)}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-muted/60"
                    type="button"
                  >
                    <div>
                      <div className="text-sm font-medium">{d.name}</div>
                      <div className="text-[11px] text-muted-foreground">{d.population} L · {d.infrastructure.hospitals} hospitals</div>
                    </div>
                    <RiskBadge score={d.score} size="sm" />
                  </button>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
      {icon}
      {children}
    </div>
  );
}

function Metric({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface/70 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 font-display text-lg tabular-nums leading-tight">{value}</div>
    </div>
  );
}
