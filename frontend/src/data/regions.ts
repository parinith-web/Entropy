// Mock medical-stress dataset for Entropy India.
// Values are illustrative only — not real epidemiological data.

export type RiskBand = "stable" | "elevated" | "high" | "critical";

export interface RiskDriver {
  label: string;
  contribution: number; // points added to the score
  category: "environmental" | "demographic" | "infrastructure" | "disease" | "social";
}

export interface Infrastructure {
  hospitals: number;
  beds: number;
  icuBeds: number;
  ambulances: number;
  doctorsPer10k: number;
  coveragePct: number; // % population within 10km of facility
}

export interface TrendPoint {
  t: string; // ISO date / label
  score: number;
  aqi: number;
  admissions: number;
}

export interface Region {
  id: string; // matches GeoJSON state name (lowercased, normalized)
  name: string;
  type: "state" | "district";
  parentId?: string;
  population: number; // in lakhs
  elderlyPct: number;
  childPct: number;
  score: number;
  drivers: RiskDriver[];
  infrastructure: Infrastructure;
  trend: TrendPoint[];
  recommendation: string;
  backendId?: number;
  weather?: {
    temperature: number;
    humidity: number;
    aqi: number;
    precipitation: number;
    power_grid_stability: number;
    vector_breeding_index: number;
    timestamp: string;
  };
  hospital?: {
    admitted_count: number;
    active_patients: number;
    icu_load: number;
    beds_occupied: number;
    total_beds_capacity: number;
  };
  wellness?: {
    wellness_score: number;
    air_quality_score: number;
    access_score: number;
    sanitation_score: number;
  };
}

export function bandFor(score: number): RiskBand {
  if (score > 80) return "critical";
  if (score > 60) return "high";
  if (score > 30) return "elevated";
  return "stable";
}

export const RISK_COLORS: Record<RiskBand, string> = {
  stable: "var(--color-risk-stable)",
  elevated: "var(--color-risk-elevated)",
  high: "var(--color-risk-high)",
  critical: "var(--color-risk-critical)",
};

export const RISK_LABELS: Record<RiskBand, string> = {
  stable: "Stable",
  elevated: "Elevated",
  high: "High Attention",
  critical: "Critical",
};

function makeTrend(base: number, len = 30): TrendPoint[] {
  const arr: TrendPoint[] = [];
  const today = new Date();
  let s = base - 12;
  for (let i = len - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    s += (Math.random() - 0.45) * 4;
    const score = Math.max(5, Math.min(98, Math.round(s)));
    arr.push({
      t: d.toISOString().slice(5, 10),
      score,
      aqi: Math.round(60 + Math.random() * 200 + (score - 40)),
      admissions: Math.round(120 + score * 4 + (Math.random() - 0.5) * 60),
    });
  }
  return arr;
}

// 28 states + key UTs. `id` matches the GeoJSON "ST_NM" / "name" field.
const STATE_SEED: Array<Pick<Region, "id" | "name" | "population" | "elderlyPct" | "childPct" | "score"> & { reco: string }> = [
  { id: "Uttar Pradesh", name: "Uttar Pradesh", population: 2415, elderlyPct: 7.7, childPct: 31, score: 78, reco: "Deploy mobile ICU units across NCR fringe districts" },
  { id: "Maharashtra", name: "Maharashtra", population: 1237, elderlyPct: 11.2, childPct: 26, score: 67, reco: "Reinforce Mumbai & Pune respiratory wards" },
  { id: "Bihar", name: "Bihar", population: 1241, elderlyPct: 7.4, childPct: 33, score: 82, reco: "Increase PHC staffing — flood-prone zones" },
  { id: "West Bengal", name: "West Bengal", population: 1003, elderlyPct: 9.5, childPct: 28, score: 71, reco: "Prep cyclone-shelter medical kits in coastal districts" },
  { id: "Madhya Pradesh", name: "Madhya Pradesh", population: 853, elderlyPct: 8.1, childPct: 30, score: 58, reco: "Monitor vector-borne illness in tribal belts" },
  { id: "Tamil Nadu", name: "Tamil Nadu", population: 766, elderlyPct: 13.6, childPct: 22, score: 42, reco: "Maintain current readiness; watchful in Chennai" },
  { id: "Rajasthan", name: "Rajasthan", population: 791, elderlyPct: 8.5, childPct: 29, score: 54, reco: "Stockpile ORS — heat advisory in western districts" },
  { id: "Karnataka", name: "Karnataka", population: 670, elderlyPct: 10.4, childPct: 24, score: 49, reco: "Bengaluru AQI watch; routine readiness elsewhere" },
  { id: "Gujarat", name: "Gujarat", population: 706, elderlyPct: 10.1, childPct: 25, score: 51, reco: "Industrial corridor monitoring; coastal cyclone prep" },
  { id: "Andhra Pradesh", name: "Andhra Pradesh", population: 533, elderlyPct: 12.0, childPct: 23, score: 47, reco: "Coastal cyclone medical pre-positioning" },
  { id: "Odisha", name: "Odisha", population: 462, elderlyPct: 11.3, childPct: 25, score: 69, reco: "Cyclone-season ambulance staging in 6 districts" },
  { id: "Telangana", name: "Telangana", population: 386, elderlyPct: 10.7, childPct: 24, score: 63, reco: "Warangal & Adilabad need surge bed capacity" },
  { id: "Kerala", name: "Kerala", population: 360, elderlyPct: 16.5, childPct: 19, score: 55, reco: "Elderly-care focus; monsoon leptospirosis watch" },
  { id: "Jharkhand", name: "Jharkhand", population: 386, elderlyPct: 8.3, childPct: 32, score: 64, reco: "Strengthen district hospitals — low specialist density" },
  { id: "Assam", name: "Assam", population: 354, elderlyPct: 8.8, childPct: 28, score: 73, reco: "Flood preparedness — Brahmaputra basin" },
  { id: "Punjab", name: "Punjab", population: 305, elderlyPct: 12.6, childPct: 22, score: 60, reco: "Stubble-burning AQI surge expected" },
  { id: "Chhattisgarh", name: "Chhattisgarh", population: 295, elderlyPct: 9.0, childPct: 28, score: 48, reco: "Routine surveillance" },
  { id: "Haryana", name: "Haryana", population: 285, elderlyPct: 9.7, childPct: 26, score: 70, reco: "NCR pollution corridor — respiratory bed reserves" },
  { id: "Delhi", name: "Delhi", population: 198, elderlyPct: 9.4, childPct: 23, score: 85, reco: "Critical air quality — activate emergency response" },
  { id: "Jammu and Kashmir", name: "Jammu and Kashmir", population: 137, elderlyPct: 9.0, childPct: 27, score: 52, reco: "Altitude & accessibility — pre-stage winter supplies" },
  { id: "Uttarakhand", name: "Uttarakhand", population: 113, elderlyPct: 11.0, childPct: 24, score: 56, reco: "Landslide-season trauma readiness" },
  { id: "Himachal Pradesh", name: "Himachal Pradesh", population: 74, elderlyPct: 11.8, childPct: 22, score: 44, reco: "Tourist-season trauma capacity" },
  { id: "Tripura", name: "Tripura", population: 41, elderlyPct: 10.3, childPct: 25, score: 38, reco: "Stable — routine monitoring" },
  { id: "Meghalaya", name: "Meghalaya", population: 33, elderlyPct: 7.6, childPct: 32, score: 36, reco: "Stable" },
  { id: "Manipur", name: "Manipur", population: 32, elderlyPct: 8.4, childPct: 28, score: 41, reco: "Watchful" },
  { id: "Nagaland", name: "Nagaland", population: 22, elderlyPct: 7.9, childPct: 29, score: 33, reco: "Stable" },
  { id: "Goa", name: "Goa", population: 16, elderlyPct: 14.0, childPct: 19, score: 28, reco: "Stable; elderly outreach" },
  { id: "Arunachal Pradesh", name: "Arunachal Pradesh", population: 15, elderlyPct: 6.9, childPct: 32, score: 39, reco: "Accessibility — air-lift readiness" },
  { id: "Mizoram", name: "Mizoram", population: 12, elderlyPct: 8.1, childPct: 28, score: 30, reco: "Stable" },
  { id: "Sikkim", name: "Sikkim", population: 7, elderlyPct: 11.2, childPct: 23, score: 26, reco: "Stable" },
  { id: "Chandigarh", name: "Chandigarh", population: 12, elderlyPct: 10.5, childPct: 22, score: 49, reco: "Routine" },
  { id: "Puducherry", name: "Puducherry", population: 17, elderlyPct: 12.0, childPct: 22, score: 43, reco: "Routine" },
  { id: "Andaman & Nicobar", name: "Andaman & Nicobar", population: 4, elderlyPct: 9.2, childPct: 25, score: 35, reco: "Cyclone preparedness" },
  { id: "Lakshadweep", name: "Lakshadweep", population: 1, elderlyPct: 10.0, childPct: 26, score: 31, reco: "Stable" },
  { id: "Dadra and Nagar Haveli and Daman and Diu", name: "Dadra & Daman", population: 8, elderlyPct: 7.8, childPct: 27, score: 40, reco: "Routine" },
  { id: "Ladakh", name: "Ladakh", population: 3, elderlyPct: 9.5, childPct: 26, score: 46, reco: "Altitude oxygen reserves" },
];

function buildDrivers(score: number, elderly: number): RiskDriver[] {
  const env = Math.round((score - 30) * 0.35 + Math.random() * 6);
  const infra = Math.round((100 - score) < 40 ? 14 : 8);
  const demo = Math.round(elderly * 1.1);
  const disease = Math.round(score * 0.18);
  const drivers: RiskDriver[] = [
    { label: "Air quality (AQI)", contribution: Math.max(2, env), category: "environmental" },
    { label: "Healthcare capacity gap", contribution: Math.max(3, infra), category: "infrastructure" },
    { label: "Elderly population share", contribution: Math.max(2, demo), category: "demographic" },
    { label: "Seasonal disease pattern", contribution: Math.max(2, disease), category: "disease" },
    { label: "Population density & mobility", contribution: Math.max(2, Math.round(score * 0.12)), category: "social" },
  ];
  return drivers.sort((a, b) => b.contribution - a.contribution).slice(0, 3);
}

function buildInfra(score: number, pop: number): Infrastructure {
  const capacityFactor = Math.max(0.4, 1 - score / 130);
  return {
    hospitals: Math.round(pop * 4.2 * capacityFactor),
    beds: Math.round(pop * 110 * capacityFactor),
    icuBeds: Math.round(pop * 6.5 * capacityFactor),
    ambulances: Math.round(pop * 2.8 * capacityFactor),
    doctorsPer10k: +(6.5 * capacityFactor + 2).toFixed(1),
    coveragePct: Math.round(55 + capacityFactor * 35),
  };
}

export const STATES: Region[] = STATE_SEED.map((s) => ({
  id: s.id,
  name: s.name,
  type: "state" as const,
  population: s.population,
  elderlyPct: s.elderlyPct,
  childPct: s.childPct,
  score: s.score,
  drivers: buildDrivers(s.score, s.elderlyPct),
  infrastructure: buildInfra(s.score, s.population),
  trend: makeTrend(s.score),
  recommendation: s.reco,
}));

// Districts for a handful of states — illustrative drill-downs.
const DISTRICT_SEED: Array<{ state: string; name: string; pop: number; score: number; reco: string }> = [
  { state: "Telangana", name: "Hyderabad", pop: 70, score: 58, reco: "Watchful — monitor AQI" },
  { state: "Telangana", name: "Warangal", pop: 36, score: 81, reco: "Critical — surge ICU beds" },
  { state: "Telangana", name: "Karimnagar", pop: 21, score: 62, reco: "High — vector-borne watch" },
  { state: "Telangana", name: "Adilabad", pop: 18, score: 74, reco: "High — staffing gap" },
  { state: "Telangana", name: "Khammam", pop: 19, score: 49, reco: "Elevated — routine surveillance" },
  { state: "Telangana", name: "Nizamabad", pop: 25, score: 55, reco: "Elevated — monitor" },
  { state: "Telangana", name: "Mahbubnagar", pop: 26, score: 67, reco: "High — heat advisory" },
  { state: "Delhi", name: "Central Delhi", pop: 6, score: 88, reco: "Critical — respiratory emergency" },
  { state: "Delhi", name: "North Delhi", pop: 9, score: 84, reco: "Critical — AQI" },
  { state: "Delhi", name: "South Delhi", pop: 27, score: 82, reco: "Critical — bed reserves" },
  { state: "Delhi", name: "East Delhi", pop: 17, score: 86, reco: "Critical — surge response" },
  { state: "Delhi", name: "West Delhi", pop: 25, score: 83, reco: "Critical — staffing surge" },
  { state: "Delhi", name: "New Delhi", pop: 1.4, score: 78, reco: "High — VIP corridor watch" },
  { state: "Maharashtra", name: "Mumbai", pop: 124, score: 72, reco: "High — respiratory" },
  { state: "Maharashtra", name: "Pune", pop: 94, score: 64, reco: "High — H1N1 season" },
  { state: "Maharashtra", name: "Nagpur", pop: 46, score: 58, reco: "Elevated" },
  { state: "Maharashtra", name: "Thane", pop: 110, score: 69, reco: "High — density" },
  { state: "Maharashtra", name: "Nashik", pop: 61, score: 53, reco: "Elevated — pilgrimage prep" },
  { state: "Maharashtra", name: "Aurangabad", pop: 37, score: 51, reco: "Elevated — drought watch" },
];

export const DISTRICTS: Region[] = DISTRICT_SEED.map((d) => ({
  id: `${d.state}::${d.name}`,
  name: d.name,
  type: "district" as const,
  parentId: d.state,
  population: d.pop,
  elderlyPct: 9 + Math.random() * 6,
  childPct: 22 + Math.random() * 8,
  score: d.score,
  drivers: buildDrivers(d.score, 10),
  infrastructure: buildInfra(d.score, d.pop),
  trend: makeTrend(d.score),
  recommendation: d.reco,
}));

export const ALL_REGIONS: Region[] = [...STATES, ...DISTRICTS];

export function getRegion(id: string): Region | undefined {
  return ALL_REGIONS.find((r) => r.id === id);
}

export function getDistrictsFor(stateId: string): Region[] {
  return DISTRICTS.filter((d) => d.parentId === stateId);
}

export const NATIONAL_STATS = {
  avgScore: Math.round(STATES.reduce((s, r) => s + r.score, 0) / STATES.length),
  critical: STATES.filter((r) => bandFor(r.score) === "critical").length,
  high: STATES.filter((r) => bandFor(r.score) === "high").length,
  elevated: STATES.filter((r) => bandFor(r.score) === "elevated").length,
  stable: STATES.filter((r) => bandFor(r.score) === "stable").length,
  population: STATES.reduce((s, r) => s + r.population, 0),
  hospitals: STATES.reduce((s, r) => s + r.infrastructure.hospitals, 0),
};
