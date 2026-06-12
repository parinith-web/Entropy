import { useEffect, useMemo, useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import type { PathOptions } from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { bandFor, STATES, type Region } from "@/data/regions";

const INDIA_STATES_GEOJSON = "/india_states.geojson";
const INDIA_DISTRICTS_GEOJSON = "/india_districts.geojson";

function normalizeName(name: string): string {
  name = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const repl: Record<string, string> = {
    ahmadabad: "ahmedabad",
    banaskantha: "banaskantha",
    sabarkantha: "sabarkantha",
    panchmahals: "panchmahal",
    dohad: "dahod",
    kachchh: "kutch",
    mahesana: "mehsana",
    thedangs: "dang",
    dangs: "dang",
    lahulandspiti: "lahaulandspiti",
    lahulspiti: "lahaulandspiti",
    bandipore: "bandipora",
    kaimurbhabua: "kaimur",
    pashchimchamparan: "westchamparan",
    purbichamparan: "eastchamparan",
    ysr: "kadapa",
    ysrcadapa: "kadapa",
    mewat: "nuh",
    northandmiddleandaman: "northmiddleandaman",
    mumbaisuburban: "mumbai",
    mumbaicity: "mumbai",
    anugul: "angul",
    baleshwar: "balasore",
    balangir: "bolangir",
    jagatsinghapur: "jagatsinghpur",
    jajapur: "jajpur",
    khordha: "khurda",
    nabarangapur: "nabarangpur",
    subarnapur: "sonepur",
    sabarakantha: "sabarkantha",
    lehladakh: "leh",
    eastdelhi: "eastdelhi",
    westdelhi: "westdelhi",
    northdelhi: "northdelhi",
    southdelhi: "southdelhi",
    centraldelhi: "centraldelhi",
    warangalrural: "warangal",
    warangalurban: "warangal",
    mahabubnagar: "mahbubnagar",
  };
  return repl[name] || name;
}

function normalizeState(s: string): string {
  s = s.toLowerCase().trim();
  if (s === "andhra pradesh" || s === "telangana") return "ap_tg";
  if (s === "dadra and nagar haveli" || s === "daman and diu" || s === "dadra and nagar haveli and daman and diu") return "dnh_dd";
  if (s === "pondicherry" || s === "puducherry") return "puducherry";
  if (s === "andaman and nicobar islands" || s === "andaman & nicobar" || s === "andaman and nicobar") return "andaman";
  if (s === "nct of delhi" || s === "delhi") return "delhi";
  if (s === "orissa" || s === "odisha") return "odisha";
  if (s === "jammu and kashmir" || s === "jammu & kashmir" || s === "ladakh") return "jk_ladakh";
  return s;
}

const BAND_FILL: Record<ReturnType<typeof bandFor>, string> = {
  stable: "#34d399",
  elevated: "#facc15",
  high: "#fb923c",
  critical: "#ef4444",
};

function styleFor(score: number | undefined, hovered: boolean): PathOptions {
  const band = score !== undefined ? bandFor(score) : "stable";
  return {
    fillColor: score === undefined ? "#e2e8f0" : BAND_FILL[band],
    fillOpacity: hovered ? 0.72 : 0.58,
    color: "#ffffff",
    weight: hovered ? 1.2 : 0.5,
  };
}

function FitIndia() {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(
      [
        [6.5, 67.5],
        [37.5, 98.5],
      ],
      { padding: [0, 0] },
    );
  }, [map]);

  return null;
}

interface Props {
  onSelect?: (region: Region) => void;
  selectedId?: string | null;
  viewLevel?: "state" | "district";
  states?: Region[];
  districts?: Region[];
}

export function IndiaMap({ onSelect, selectedId, viewLevel = "state", states, districts }: Props) {
  const [mounted, setMounted] = useState(false);
  const [geoStates, setGeoStates] = useState<FeatureCollection | null>(null);
  const [geoDistricts, setGeoDistricts] = useState<FeatureCollection | null>(null);

  const geojsonRef = useRef<any>(null);
  const selectedIdRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    setMounted(true);
    // Fetch states
    fetch(INDIA_STATES_GEOJSON)
      .then((r) => r.json())
      .then((data) => setGeoStates(data as FeatureCollection))
      .catch(() => {});

    // Fetch districts eagerly on mount
    fetch(INDIA_DISTRICTS_GEOJSON)
      .then((r) => r.json())
      .then((data) => setGeoDistricts(data as FeatureCollection))
      .catch(() => {});
  }, []);

  const geo = viewLevel === "state" ? geoStates : geoDistricts;

  const geoKey = useMemo(() => {
    if (!geo) return "empty";
    return geo === geoDistricts ? "districts" : "states";
  }, [geo, geoDistricts]);

  const stateByName = useMemo(() => {
    const m = new Map<string, Region>();
    const activeStates = states || STATES;
    activeStates.forEach((s) => m.set(s.id.toLowerCase(), s));
    return m;
  }, [states]);

  const districtMap = useMemo(() => {
    const m = new Map<string, Region>();
    if (!districts) return m;
    districts.forEach((d) => {
      const parentNorm = normalizeState(d.parentId || "");
      const nameNorm = normalizeName(d.name);
      m.set(`${parentNorm}::${nameNorm}`, d);
    });
    return m;
  }, [districts]);

  function regionForFeature(feature: any): Region | undefined {
    if (viewLevel === "state" || !feature?.properties?.district) {
      const name = (feature?.properties?.ST_NM ?? feature?.properties?.st_nm ?? "") as string;
      return stateByName.get(name.toLowerCase());
    } else {
      const districtName = feature?.properties?.district;
      const stateName = feature?.properties?.st_nm;
      if (!districtName || !stateName) return undefined;
      const key = `${normalizeState(stateName)}::${normalizeName(districtName)}`;
      return districtMap.get(key);
    }
  }

  const regionForFeatureRef = useRef(regionForFeature);
  useEffect(() => {
    regionForFeatureRef.current = regionForFeature;
  });

  // Dynamically update styles in place when selectedId, geo, data or view level changes
  useEffect(() => {
    if (geojsonRef.current) {
      geojsonRef.current.eachLayer((layer: any) => {
        const feature = layer.feature;
        const region = regionForFeatureRef.current(feature);
        const isSelected = region?.id === selectedId || 
          (selectedId !== null && selectedId !== undefined && 
            (selectedId === region?.id || 
              (region?.type === "state" && selectedId.startsWith((region?.id ?? "") + "::"))
            )
          );
        
        layer.setStyle({
          ...styleFor(region?.score, isSelected),
          fillOpacity: isSelected ? 0.85 : styleFor(region?.score, false).fillOpacity,
          weight: isSelected ? 1.5 : 0.5,
          color: isSelected ? "#0f172a" : "#ffffff",
        });

        if (isSelected && typeof layer.bringToFront === "function") {
          layer.bringToFront();
        }
      });
    }
  }, [selectedId, geo, viewLevel, stateByName, districtMap]);

  if (!mounted) {
    return (
      <div className="grid h-full w-full place-items-center bg-surface text-sm text-muted-foreground">
        Loading map…
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[22.6, 82.8]}
        zoom={4}
        minZoom={3}
        maxZoom={8}
        scrollWheelZoom
        zoomControl
        className="h-full w-full"
        style={{ background: "var(--color-surface)" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <FitIndia />
        {geo && (
          <GeoJSON
            key={`${viewLevel}-${geoKey}`}
            ref={geojsonRef}
            data={geo}
            style={(feature?: Feature<Geometry, any>) => {
              const region = regionForFeature(feature);
              const isSelected = region?.id === selectedId || 
                (selectedId !== null && selectedId !== undefined && 
                 (selectedId === region?.id || 
                  (region?.type === "state" && selectedId.startsWith((region?.id ?? "") + "::"))
                 )
                );
              return {
                ...styleFor(region?.score, isSelected),
                fillOpacity: isSelected ? 0.85 : styleFor(region?.score, false).fillOpacity,
                weight: isSelected ? 1.5 : 0.5,
                color: isSelected ? "#0f172a" : "#ffffff",
              };
            }}
            onEachFeature={(feature, layer) => {
              const region = regionForFeature(feature);
              const name = viewLevel === "state" || !feature.properties?.district
                ? (feature.properties?.ST_NM ?? feature.properties?.st_nm ?? "") 
                : `${region?.name ?? feature.properties?.district} (${region?.parentId ?? feature.properties?.st_nm})`;
              const score = region?.score;
              layer.bindTooltip(
                `<div style="
                  font-family: var(--font-sans, system-ui, sans-serif);
                  font-size: 12px;
                  background: rgba(255,255,255,0.95);
                  color: #111827;
                  border-radius: 8px;
                  padding: 7px 11px;
                  box-shadow: 0 2px 12px rgba(0,0,0,0.12);
                  backdrop-filter: blur(6px);
                  pointer-events: none;
                  white-space: nowrap;
                  border: 1px solid #e5e7eb;
                ">
                  <div style="font-weight:600; margin-bottom:2px;">${name}</div>
                  ${score !== undefined
                    ? `<div style="opacity:.6;">Stress index · ${score}</div>`
                    : `<div style="opacity:.45;">No data</div>`
                  }
                </div>`,
                { sticky: true, opacity: 1, className: "leaflet-tooltip-clean" },
              );
              layer.on({
                mouseover: (e) => {
                  const l = e.target;
                  const r = regionForFeatureRef.current(feature);
                  const currentSelectedId = selectedIdRef.current;
                  const isSelected = r?.id === currentSelectedId || 
                    (currentSelectedId !== null && currentSelectedId !== undefined && 
                     (currentSelectedId === r?.id || 
                      (r?.type === "state" && currentSelectedId.startsWith((r?.id ?? "") + "::"))
                     )
                    );
                  l.setStyle({
                    weight: isSelected ? 1.5 : 1.2,
                    fillOpacity: 0.72,
                    color: isSelected ? "#0f172a" : "#ffffff"
                  });
                  if (isSelected && typeof l.bringToFront === "function") {
                    l.bringToFront();
                  }
                },
                mouseout: (e) => {
                  const l = e.target;
                  const r = regionForFeatureRef.current(feature);
                  const currentSelectedId = selectedIdRef.current;
                  const isSelected = r?.id === currentSelectedId || 
                    (currentSelectedId !== null && currentSelectedId !== undefined && 
                     (currentSelectedId === r?.id || 
                      (r?.type === "state" && currentSelectedId.startsWith((r?.id ?? "") + "::"))
                     )
                    );
                  l.setStyle({
                    ...styleFor(r?.score, false),
                    fillOpacity: isSelected ? 0.85 : styleFor(r?.score, false).fillOpacity,
                    weight: isSelected ? 1.5 : 0.5,
                    color: isSelected ? "#0f172a" : "#ffffff",
                  });
                  if (geojsonRef.current) {
                    geojsonRef.current.eachLayer((layer: any) => {
                      const f = layer.feature;
                      const reg = regionForFeatureRef.current(f);
                      const isSel = reg?.id === currentSelectedId || 
                        (currentSelectedId !== null && currentSelectedId !== undefined && 
                          (currentSelectedId === reg?.id || 
                            (reg?.type === "state" && currentSelectedId.startsWith((reg?.id ?? "") + "::"))
                          )
                        );
                      if (isSel && typeof layer.bringToFront === "function") {
                        layer.bringToFront();
                      }
                    });
                  }
                },
                click: () => {
                  const r = regionForFeatureRef.current(feature);
                  if (r && onSelectRef.current) onSelectRef.current(r);
                },
              });
            }}
          />
        )}
      </MapContainer>
      {viewLevel === "district" && !geoDistricts && (
        <div className="absolute inset-0 z-[1000] grid place-items-center bg-surface/50 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-lg">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs font-medium text-muted-foreground">Loading district boundaries…</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function RiskLegend() {
  const items = [
    { label: "Stable", range: "0–30", color: BAND_FILL.stable },
    { label: "Elevated", range: "31–60", color: BAND_FILL.elevated },
    { label: "High Attention", range: "61–80", color: BAND_FILL.high },
    { label: "Critical", range: "81–100", color: BAND_FILL.critical },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/80 px-3 py-2 text-xs backdrop-blur">
      <span className="font-medium text-muted-foreground">Medical Stress Index</span>
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: i.color }} />
          <span className="font-medium">{i.label}</span>
          <span className="text-muted-foreground">{i.range}</span>
        </span>
      ))}
    </div>
  );
}
