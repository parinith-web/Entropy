import { type Region, type RiskDriver, type Infrastructure, type TrendPoint } from "../../data/regions";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const DB_TO_FE_STATES: Record<string, string> = {
  "uttar pradesh": "Uttar Pradesh",
  "maharashtra": "Maharashtra",
  "bihar": "Bihar",
  "west bengal": "West Bengal",
  "madhya pradesh": "Madhya Pradesh",
  "tamil nadu": "Tamil Nadu",
  "rajasthan": "Rajasthan",
  "karnataka": "Karnataka",
  "gujarat": "Gujarat",
  "andhra pradesh": "Andhra Pradesh",
  "orissa": "Odisha",
  "odisha": "Odisha",
  "telangana": "Telangana",
  "kerala": "Kerala",
  "jharkhand": "Jharkhand",
  "assam": "Assam",
  "punjab": "Punjab",
  "chhattisgarh": "Chhattisgarh",
  "haryana": "Haryana",
  "nct of delhi": "Delhi",
  "delhi": "Delhi",
  "jammu and kashmir": "Jammu and Kashmir",
  "jammu & kashmir": "Jammu and Kashmir",
  "uttarakhand": "Uttarakhand",
  "himachal pradesh": "Himachal Pradesh",
  "tripura": "Tripura",
  "meghalaya": "Meghalaya",
  "manipur": "Manipur",
  "nagaland": "Nagaland",
  "goa": "Goa",
  "arunachal pradesh": "Arunachal Pradesh",
  "mizoram": "Mizoram",
  "sikkim": "Sikkim",
  "chandigarh": "Chandigarh",
  "pondicherry": "Puducherry",
  "puducherry": "Puducherry",
  "andaman and nicobar islands": "Andaman & Nicobar",
  "andaman & nicobar": "Andaman & Nicobar",
  "lakshadweep": "Lakshadweep",
  "dadra and nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
  "dadra and nagar haveli and daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
  "ladakh": "Ladakh"
};

export function formatStateName(dbName: string): string {
  const key = dbName.toLowerCase().trim();
  return DB_TO_FE_STATES[key] || dbName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export function getDriverCategory(name: string): RiskDriver["category"] {
  const n = name.toLowerCase();
  if (n.includes("heat") || n.includes("air") || n.includes("aqi") || n.includes("rain") || n.includes("monsoon") || n.includes("weather") || n.includes("vector") || n.includes("mosquito")) {
    return "environmental";
  }
  if (n.includes("elderly") || n.includes("child") || n.includes("population") || n.includes("density")) {
    return "demographic";
  }
  if (n.includes("bed") || n.includes("hospital") || n.includes("icu") || n.includes("ambulance") || n.includes("doctor") || n.includes("staff") || n.includes("power") || n.includes("grid") || n.includes("generator") || n.includes("oxygen")) {
    return "infrastructure";
  }
  if (n.includes("disease") || n.includes("outbreak") || n.includes("dengue") || n.includes("malaria") || n.includes("flu") || n.includes("infection") || n.includes("virus")) {
    return "disease";
  }
  return "social";
}

function buildInfra(score: number, population: number): Infrastructure {
  const capacityFactor = Math.max(0.4, 1 - score / 130);
  return {
    hospitals: Math.round(population * 4.2 * capacityFactor),
    beds: Math.round(population * 110 * capacityFactor),
    icuBeds: Math.round(population * 6.5 * capacityFactor),
    ambulances: Math.round(population * 2.8 * capacityFactor),
    doctorsPer10k: +(6.5 * capacityFactor + 2).toFixed(1),
    coveragePct: Math.round(55 + capacityFactor * 35),
  };
}

export interface NationalStats {
  avgScore: number;
  critical: number;
  high: number;
  elevated: number;
  stable: number;
  population: number;
  hospitals: number;
  trend: Array<{ t: string; score: number }>;
  /** @deprecated Prefer forecastIssuedAt / forecastValidUntil */
  lastUpdated?: string;
  /** ISO-8601 timestamp when the current 3-hour surge forecast was issued (IST). */
  forecastIssuedAt?: string;
  /** ISO-8601 timestamp when the current 3-hour surge forecast expires (IST). */
  forecastValidUntil?: string;
}

export interface BackendRegionDetails {
  region_id: number;
  state: string;
  district: string;
  population: number;
  density: number;
  elderly_ratio: number;
  child_ratio: number;
  poverty_ratio: number;
  clean_water_index: number;
  baseline_beds: number;
  baseline_doctors: number;
  ambulance_density: number;
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
  prediction?: {
    predicted_stress_score: number;
    predicted_risk_level: number;
    timestamp: string;
    drivers: Array<{ name: string; weight: number }>;
    recommendations: string[];
  };
  wellness?: {
    wellness_score: number;
    air_quality_score: number;
    access_score: number;
    sanitation_score: number;
  };
}

// Fetch all predictions for states or districts
export async function getDashboardPredictions(view: "state" | "district"): Promise<Region[]> {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/predictions?view=${view}`);
  if (!res.ok) throw new Error("Failed to fetch dashboard predictions");
  const data = await res.json();

  if (view === "state") {
    return data.map((s: any) => {
      const stateFE = formatStateName(s.state);
      return {
        id: stateFE,
        name: stateFE,
        type: "state" as const,
        population: s.districts_count * 15, // estimate
        elderlyPct: 9.5,
        childPct: 25,
        score: Math.round(s.predicted_stress_score),
        drivers: s.drivers.map((d: any) => ({
          label: d.name,
          contribution: Math.round(d.weight),
          category: getDriverCategory(d.name)
        })),
        infrastructure: buildInfra(s.predicted_stress_score, s.districts_count * 15),
        trend: [],
        recommendation: s.drivers[0]?.name ? `Monitor ${s.drivers[0].name.toLowerCase()} in high-risk zones` : "Stable"
      };
    });
  } else {
    return data.map((d: any) => {
      const stateFE = formatStateName(d.state);
      return {
        id: `${stateFE}::${d.district}`,
        name: d.district,
        type: "district" as const,
        parentId: stateFE,
        population: 15,
        elderlyPct: 9.5,
        childPct: 25,
        score: Math.round(d.predicted_stress_score),
        drivers: d.drivers.map((drv: any) => ({
          label: drv.name,
          contribution: Math.round(drv.weight),
          category: getDriverCategory(drv.name)
        })),
        infrastructure: buildInfra(d.predicted_stress_score, 15),
        trend: [],
        recommendation: "",
        backendId: d.region_id
      };
    });
  }
}

// Fetch details for a specific district
export async function getRegionDetails(dbId: number): Promise<Region & { backendDetails: BackendRegionDetails }> {
  const res = await fetch(`${API_BASE_URL}/api/regions/${dbId}/details`);
  if (!res.ok) throw new Error(`Failed to fetch details for region ${dbId}`);
  const data: BackendRegionDetails = await res.json();

  const stateFE = formatStateName(data.state);
  const score = Math.round(data.prediction?.predicted_stress_score ?? 50);
  const populationLakhs = +(data.population / 100000).toFixed(1);

  const regionObj: Region = {
    id: `${stateFE}::${data.district}`,
    name: data.district,
    type: "district" as const,
    parentId: stateFE,
    population: populationLakhs,
    elderlyPct: data.elderly_ratio,
    childPct: data.child_ratio,
    score: score,
    drivers: (data.prediction?.drivers ?? []).map((d: any) => ({
      label: d.name,
      contribution: Math.round(d.weight),
      category: getDriverCategory(d.name)
    })),
    infrastructure: {
      hospitals: Math.max(1, Math.round(populationLakhs * 0.4)),
      beds: data.hospital?.beds_occupied ?? Math.round(populationLakhs * 110), // wait, beds occupied is what's active, but we can display capacity too.
      icuBeds: data.hospital?.icu_load ?? Math.round(populationLakhs * 6.5),
      ambulances: Math.max(1, Math.round(populationLakhs * 0.3)),
      doctorsPer10k: data.baseline_doctors,
      coveragePct: Math.round(data.clean_water_index)
    },
    trend: [],
    recommendation: data.prediction?.recommendations.join(". ") ?? "Stable"
  };

  return {
    ...regionObj,
    backendDetails: data
  };
}

// Fetch region trends (last 30 days or specified)
export async function getRegionTrends(id: string, dbId?: number, days: number = 30): Promise<TrendPoint[]> {
  const isState = !id.includes("::");
  let url = `${API_BASE_URL}/api/regions/${dbId}/trends?days=${days}`;
  
  if (isState) {
    url = `${API_BASE_URL}/api/states/${encodeURIComponent(id)}/trends?days=${days}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch trends for ${id}`);
  const data = await res.json();

  return data.map((t: any) => ({
    t: t.timestamp,
    score: Math.round(t.predicted_stress_score ?? t.score),
    aqi: Math.round(t.aqi),
    admissions: Math.round(t.active_patients ?? t.beds_occupied ?? t.admissions)
  }));
}

// Fetch National Stats
export async function getNationalStats(): Promise<NationalStats> {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/national-stats`);
  if (!res.ok) throw new Error("Failed to fetch national stats");
  return await res.json();
}

// Compare two states
export async function compareStates(state1: string, state2: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/states/compare?state1=${encodeURIComponent(state1)}&state2=${encodeURIComponent(state2)}`);
  if (!res.ok) throw new Error("Failed to compare states");
  return await res.json();
}

// Verify Google authentication token
export async function verifyGoogleToken(token: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/auth/google-verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token })
  });
  if (!res.ok) throw new Error("Failed to verify google token");
  return await res.json();
}
