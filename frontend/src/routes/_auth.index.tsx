import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { RegionDetail } from "@/components/RegionDetail";
import { bandFor, type Region, type RiskBand } from "@/data/regions";
import { useRegionsData } from "@/hooks/useRegionsData";

const IndiaMap = lazy(() => import("@/components/IndiaMap").then((m) => ({ default: m.IndiaMap })));

export const Route = createFileRoute("/_auth/")({
  head: () => ({
    meta: [
      { title: "Live map - entropy" },
      { name: "description", content: "Medical Stress Index live map for Indian regions." },
      { property: "og:title", content: "entropy - Live map" },
      { property: "og:description", content: "Medical Stress Index live map for Indian regions." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { states, districts } = useRegionsData();
  const [selected, setSelected] = useState<Region | null>(null);
  const [viewLevel, setViewLevel] = useState<"state" | "district">("state");

  const ranked = useMemo(() => [...states].sort((a, b) => b.score - a.score), [states]);
  const jumpRegions = ranked.slice(0, 6);

  // Sync selected region when states or districts array updates in background
  const activeSelected = useMemo(() => {
    if (!selected) return null;
    const currentList = selected.type === "state" ? states : districts;
    const updated = currentList.find(r => r.id === selected.id);
    return updated || selected;
  }, [selected, states, districts]);

  return (
    <div className="flex h-[calc(100vh-62px)] min-h-[706px] gap-6 overflow-hidden bg-[#f9fafb] p-6">
      <section className="relative flex min-w-0 flex-1 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full border border-[#e5e7eb] bg-white/90 px-[17px] py-[9px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-[2px]">
          <div className="flex items-center">
            <span className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-[#6b7280]">
              View level
            </span>
            <div className="ml-3 flex rounded-full bg-[#f3f4f6] p-1">
              <button 
                onClick={() => setViewLevel("state")}
                className={`rounded-full px-4 py-1 text-center text-xs font-medium leading-4 transition ${
                  viewLevel === "state"
                    ? "bg-[#e0f2fe] text-[#0369a1] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                    : "text-[#6b7280] hover:text-[#374151]"
                }`}
                type="button"
              >
                State
              </button>
              <button 
                onClick={() => setViewLevel("district")}
                className={`rounded-full px-4 py-1 text-center text-xs font-medium leading-4 transition ${
                  viewLevel === "district"
                    ? "bg-[#e0f2fe] text-[#0369a1] shadow-[0_1px_1px_rgba(0,0,0,0.05)]"
                    : "text-[#6b7280] hover:text-[#374151]"
                }`}
                type="button"
              >
                District
              </button>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-[17px] bottom-[17px] top-[76px] overflow-hidden rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <Suspense
            fallback={<div className="grid h-full place-items-center text-sm text-[#6b7280]">Loading map...</div>}
          >
            <IndiaMap 
              onSelect={setSelected} 
              selectedId={activeSelected?.id ?? null} 
              viewLevel={viewLevel}
              states={states}
              districts={districts}
            />
          </Suspense>
          <MapLegend />
        </div>
      </section>

      <aside className="w-[400px] shrink-0 overflow-auto rounded-xl border border-[#e5e7eb] bg-white p-px shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        {activeSelected ? (
          <RegionDetail 
            region={activeSelected} 
            onClose={() => setSelected(null)} 
            onSelectDistrict={setSelected} 
            districtsList={districts}
            stateList={states}
          />
        ) : (
          <EmptyDetail jumpRegions={jumpRegions} onPick={setSelected} />
        )}
      </aside>
    </div>
  );
}

function EmptyDetail({ jumpRegions, onPick }: { jumpRegions: Region[]; onPick: (region: Region) => void }) {
  return (
    <div className="flex flex-col gap-10 p-8">
      <section className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-[#9ca3af]">Region detail</p>
        <h1 className="font-display text-[30px] font-normal leading-9 text-[#111827]">Select a region</h1>
        <p className="pt-[7px] text-sm font-normal leading-[22.75px] text-[#6b7280]">
          Click anywhere on the map to see the medical stress index, the factors driving it, and recommended actions.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-[#9ca3af]">
          Or jump to a critical region
        </p>
        <div className="grid grid-cols-2 gap-4">
          {jumpRegions.map((region) => (
            <JumpCard key={region.id} region={region} onPick={onPick} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 pt-[33px]">
        <p className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-[#9ca3af]">
          Understanding medical stress
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <div className="flex h-5 items-center justify-between">
              <h2 className="text-sm font-medium leading-5 text-[#111827]">What is Medical Stress?</h2>
              <Link to="/theory" className="flex items-center gap-1 text-center text-xs font-semibold leading-4 text-[#0369a1] hover:underline">
                Know More <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <p className="mt-[3px] text-sm leading-[22.75px] text-[#6b7280]">
              Medical Stress Index (MSI) is a real-time composite score (0-100) quantifying the strain on healthcare
              infrastructure. It aggregates data from patient volume, bed occupancy, staff-to-patient ratios, and
              medical supply availability.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <StressExplainer color="#ef4444" title="Critical (81-100)">
              Healthcare systems are at capacity. Immediate resource reallocation required.
            </StressExplainer>
            <StressExplainer color="#fb923c" title="High Attention (61-80)">
              Significant strain detected. Monitoring for surge capacity.
            </StressExplainer>
            <StressExplainer color="#facc15" title="Elevated (31-60)">
              Manageable stress levels with normal operations.
            </StressExplainer>
            <StressExplainer color="#34d399" title="Stable (0-30)">Optimal system performance.</StressExplainer>
          </div>
        </div>
      </section>
    </div>
  );
}

function JumpCard({ region, onPick }: { region: Region; onPick: (region: Region) => void }) {
  const band = bandFor(region.score);

  return (
    <button
      className="min-h-[76px] rounded-lg border border-[#e5e7eb] bg-white p-[17px] text-left transition hover:shadow-sm hover:border-[#d1d5db]"
      onClick={() => onPick(region)}
      type="button"
    >
      <div className="flex items-center justify-between pb-2">
        <p className="truncate pr-2 text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-[#6b7280]">
          {region.name}
        </p>
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]" />
      </div>
      <div className="flex items-end">
        <span className="font-sans text-[30px] font-light leading-9 text-[#111827]">{region.score}</span>
        <MiniRiskBadge band={band} />
      </div>
    </button>
  );
}

function MiniRiskBadge({ band }: { band: RiskBand }) {
  const styles = {
    critical: { bg: "#fef2f2", border: "#fecaca", dot: "#ef4444", text: "#dc2626", label: "Critical" },
    high: { bg: "#fff7ed", border: "#ffedd5", dot: "#f97316", text: "#c2410c", label: "High" },
    elevated: { bg: "#fefce8", border: "#fef08a", dot: "#facc15", text: "#a16207", label: "Elevated" },
    stable: { bg: "#ecfdf5", border: "#bbf7d0", dot: "#34d399", text: "#047857", label: "Stable" },
  }[band];

  return (
    <span
      className="ml-2 inline-flex items-center gap-1.5 rounded-full border px-[9px] py-[3px] text-[10px] font-medium leading-[15px]"
      style={{ backgroundColor: styles.bg, borderColor: styles.border, color: styles.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: styles.dot }} />
      {styles.label}
    </span>
  );
}

function StressExplainer({
  color,
  title,
  children,
}: {
  color: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start">
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <div className="ml-3">
        <p className="text-xs font-semibold leading-4 text-[#111827]">{title}</p>
        <p className="text-xs leading-4 text-[#6b7280]">{children}</p>
      </div>
    </div>
  );
}

function MapLegend() {
  const items = [
    { label: "Critical (81–100)", color: "#ef4444" },
    { label: "High Attention (61–80)", color: "#fb923c" },
    { label: "Elevated (31–60)", color: "#facc15" },
    { label: "Stable (0–30)", color: "#34d399" },
  ];

  return (
    <div className="absolute bottom-[31px] right-[11px] z-[500] w-[163px] rounded-lg border border-[#e5e7eb] bg-white/90 p-[13px] text-xs shadow-[0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-[2px]">
      <p className="font-semibold leading-4 text-[#374151]">Medical Stress Index</p>
      <div className="mt-2 flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center">
            <span className="h-3 w-3 shrink-0 rounded-full opacity-80" style={{ backgroundColor: item.color }} />
            <span className="ml-2 whitespace-nowrap text-xs leading-4 text-[#4b5563]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
