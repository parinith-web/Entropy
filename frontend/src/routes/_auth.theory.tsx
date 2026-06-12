import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Brain, Activity, Sliders, Database, BarChart2, ShieldCheck, ChevronRight, HelpCircle, Network, Server } from "lucide-react";

export const Route = createFileRoute("/_auth/theory")({
  head: () => ({
    meta: [
      { title: "Methodology & Math - entropy" },
      { name: "description", content: "Learn about the mathematical models, random forest predictions, and SHAP explainability behind the Medical Stress Index (MSI)." },
      { property: "og:title", content: "entropy - Methodology & Math" },
      { property: "og:description", content: "Mathematical models and SHAP explainability behind the Medical Stress Index." },
    ],
  }),
  component: TheoryPage,
});

function TheoryPage() {

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-6">
      {/* Back button */}
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to map
      </Link>

      {/* Page Header */}
      <div className="mt-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#0369a1]">
          <BookOpen className="h-4 w-4" /> Methodology & Math
        </div>
        <h1 className="mt-2 font-display text-4xl font-normal text-[#111827]">Mathematical Theory</h1>
        <p className="mt-2 max-w-3xl text-sm leading-[22.75px] text-[#6b7280]">
          MedPulse India operates on a fully transparent, auditable five-stage data pipeline. Below is the technical description of how data flows from regional sensors and medical facilities into our central warehouse, models emergency hospital occupancy, and projects regional stress surges.
        </p>
      </div>

      {/* Main Stepper Layout */}
      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Left Column: The 5-Stage Connected Stepper */}
        <div className="relative lg:col-span-8">
          {/* Vertical Connecting line for steps */}
          <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-blue-400 via-sky-500 via-emerald-500 via-orange-500 to-purple-500 hidden md:block" />

          <div className="flex flex-col gap-12">
            
            {/* STEP 1: INGESTION & WAREHOUSE */}
            <div className="relative flex flex-col md:flex-row gap-6">
              {/* Stepper Bubble */}
              <div className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-blue-400 bg-white text-sm font-bold text-blue-500 shadow-sm">
                01
              </div>
              <div className="flex-1 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 font-display text-lg font-medium text-[#111827]">
                  <Network className="h-4.5 w-4.5 text-blue-500" />
                  Automated Data Pipelines & SQL Data Warehouse
                </div>
                <p className="mt-3 text-sm leading-[22.75px] text-[#6b7280]">
                  Every 3 hours, automated **ETL (Extract, Transform, Load)** pipelines ingest real-time data from regional hospital electronic health records (EHR), Indian Meteorological Department (IMD) weather feeds, and Central Pollution Control Board air telemetry.
                </p>
                <div className="mt-4 rounded-lg bg-slate-50/50 p-4 border border-slate-100">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                    <Server className="h-3.5 w-3.5 text-blue-500" /> Central SQL Data Warehouse:
                  </h4>
                  <p className="mt-1.5 text-xs text-[#6b7280] leading-[18px]">
                    Ingested feeds are validated, standardized, and stored in a secure, central relational **Data Warehouse**. This warehouse maintains temporal logs (e.g. `WeatherAQILog` and `HospitalLog`) representing historical baselines and current metrics for all 700+ Indian districts.
                  </p>
                </div>
              </div>
            </div>

            {/* STEP 2: FEATURE SPACE */}
            <div className="relative flex flex-col md:flex-row gap-6">
              {/* Stepper Bubble */}
              <div className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-sky-500 bg-white text-sm font-bold text-sky-600 shadow-sm">
                02
              </div>
              <div className="flex-1 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 font-display text-lg font-medium text-[#111827]">
                  <Database className="h-4.5 w-4.5 text-sky-600" />
                  The 38-Feature Input Space (Raw Stress Factors)
                </div>
                <p className="mt-3 text-sm leading-[22.75px] text-[#6b7280]">
                  Before running model inference, feature engineering pipelines compile the warehouse logs into a 38-dimensional vector for each target region.
                </p>
                <div className="mt-4 rounded-lg bg-slate-50/50 p-4 border border-slate-100">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Inputs categorized by risk domain:</h4>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-semibold text-blue-700">Static Infrastructure:</span> Bed & doctor densities, ambulance coverage, distance to tier-1 hospitals, clean water access.
                    </div>
                    <div>
                      <span className="font-semibold text-amber-700">Dynamic Weather:</span> Temperature anomalies, humidity, PM2.5/PM10 levels (AQI), vector breeding metrics.
                    </div>
                    <div>
                      <span className="font-semibold text-emerald-700">Epidemiological Demand:</span> Active patient logs, ICU load rate, lagged admissions.
                    </div>
                    <div>
                      <span className="font-semibold text-purple-700">Demographic Vulnerability:</span> Elderly ratios ($&gt;60$), pediatric ratios ($&lt;5$), poverty rate index.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3: CAUSAL SIMULATION */}
            <div className="relative flex flex-col md:flex-row gap-6">
              {/* Stepper Bubble */}
              <div className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 bg-white text-sm font-bold text-emerald-600 shadow-sm">
                03
              </div>
              <div className="flex-1 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 font-display text-lg font-medium text-[#111827]">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  Causal Simulation & Patient Accumulation (Ground Truth)
                </div>
                <p className="mt-3 text-sm leading-[22.75px] text-[#6b7280]">
                  Raw stress factors do not translate to strain instantly; they drive patient inflows. The simulation models this using a continuous-time patient accumulation system where beds occupy dynamically.
                </p>

                <div className="mt-6 space-y-6">
                  {/* Sub-step 3.1 */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 3.1 Admissions Multipliers
                    </h4>
                    <p className="mt-1 text-xs text-[#6b7280] leading-[18px]">
                      {"A baseline admission rate Base Admissions = (Population / 100k) × U(0.6, 1.3) is scaled by environmental and gathering co-factors:"}
                    </p>
                    <div className="mt-2 rounded bg-slate-50 border border-slate-100 p-3 font-mono text-[11px] text-slate-700 space-y-1">
                      <div><span className="text-[#0369a1]">Heat:</span> If Temp &gt; 42°C &rarr; Multipliers += (Temp - 42) &times; 0.1 &times; (Elderly_Ratio / 10)</div>
                      <div><span className="text-[#0369a1]">Pollution:</span> If AQI &gt; 180 &rarr; Multipliers += (AQI - 180) &times; 0.004 &times; (1 + Child_Ratio / 10)</div>
                      <div><span className="text-[#0369a1]">Monsoon:</span> If Vector Breeding &gt; 65 &rarr; Multipliers += 0.3</div>
                      <div><span className="text-[#0369a1]">Supply Strain:</span> Capacity Coeff = max(1.0, 2.0 - Baseline Beds per 1k)</div>
                    </div>
                  </div>

                  {/* Sub-step 3.2 */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 3.2 Patient Accumulation & Discharges
                    </h4>
                    <p className="mt-1 text-xs text-[#6b7280] leading-[18px]">
                      Patients enter, stay for an average of 4 days (32 intervals of 3 hours), and are discharged. The active occupancy accumulates as:
                    </p>
                    <div className="mt-2 rounded bg-slate-50 border border-slate-100 p-3 text-center">
                      <div className="font-mono text-xs text-slate-800">
                        Active Patients<sub>t</sub> = Beds Occupied<sub>t-1</sub> - Discharged<sub>t</sub> + New Admissions<sub>t</sub>
                      </div>
                      <div className="mt-1.5 text-[10px] text-muted-foreground">
                        Where <span className="font-mono">Discharged = Lagged Occupancy &times; 3.125%</span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-step 3.3 */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 3.3 Ground Truth Medical Stress Index (MSI)
                    </h4>
                    <p className="mt-1 text-xs text-[#6b7280] leading-[18px]">
                      The final observed MSI score represents the percentage of available beds currently filled, bounded strictly between 0 and 100:
                    </p>
                    
                    <div className="mt-3 flex items-center justify-center font-mono text-xs md:text-sm py-4 bg-slate-50 rounded-lg border border-slate-100 text-slate-800">
                      <span className="font-semibold text-[#059669]">MSI</span>
                      <span className="mx-1.5">=</span>
                      <span>min( 100, max( 0, </span>
                      <div className="mx-2 flex flex-col items-center">
                        <span className="border-b border-slate-400 px-2 pb-0.5">Beds Occupied</span>
                        <span className="px-2 pt-0.5">Total Capacity Beds</span>
                      </div>
                      <span>&times; 100 + &epsilon; ) )</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 4: ML INFERENCE WITH 3HR HORIZON */}
            <div className="relative flex flex-col md:flex-row gap-6">
              {/* Stepper Bubble */}
              <div className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-orange-500 bg-white text-sm font-bold text-orange-600 shadow-sm">
                04
              </div>
              <div className="flex-1 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 font-display text-lg font-medium text-[#111827]">
                  <BarChart2 className="h-4 w-4 text-orange-600" />
                  Random Forest Classifier (3-Hour Forecast Horizon)
                </div>
                <p className="mt-3 text-sm leading-[22.75px] text-[#6b7280]">
                  The machine learning model evaluates the compiled features to forecast the **stress index surge for the next 3 hours**. This rolling 3-hour projection horizon gives hospital dispatchers crucial early warning.
                </p>

                <div className="mt-4 rounded-lg bg-slate-50/50 p-4 border border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Prediction Risk Categorization:</h4>
                  <div className="mt-2 text-xs text-[#6b7280]">
                    The model predicts the probability of the MSI crossing specific warning thresholds during the upcoming 3-hour window:
                  </div>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="border border-emerald-100 bg-emerald-50/30 rounded p-2 text-center">
                      <div className="font-semibold text-emerald-700">Stable</div>
                      <div className="mt-0.5 text-[10px] font-mono text-emerald-600">0 - 40</div>
                    </div>
                    <div className="border border-yellow-100 bg-yellow-50/30 rounded p-2 text-center">
                      <div className="font-semibold text-yellow-700">Elevated</div>
                      <div className="mt-0.5 text-[10px] font-mono text-yellow-600">41 - 60</div>
                    </div>
                    <div className="border border-orange-100 bg-orange-50/30 rounded p-2 text-center">
                      <div className="font-semibold text-orange-700">High Attention</div>
                      <div className="mt-0.5 text-[10px] font-mono text-[#c2410c]">61 - 80</div>
                    </div>
                    <div className="border border-red-100 bg-red-50/30 rounded p-2 text-center">
                      <div className="font-semibold text-red-700">Critical</div>
                      <div className="mt-0.5 text-[10px] font-mono text-red-600">81 - 100</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 5: SHAP ATTRIBUTION */}
            <div className="relative flex flex-col md:flex-row gap-6">
              {/* Stepper Bubble */}
              <div className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-purple-500 bg-white text-sm font-bold text-purple-600 shadow-sm">
                05
              </div>
              <div className="flex-1 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 font-display text-lg font-medium text-[#111827]">
                  <Brain className="h-4 w-4 text-purple-600" />
                  SHAP Local Explainability Layer (Transposed Attribution)
                </div>
                <p className="mt-3 text-sm leading-[22.75px] text-[#6b7280]">
                  Once the Random Forest model determines the risk band, MedPulse explains *why* the index is elevated. It traces the prediction back to the original 38 features using **SHAP (SHapley Additive exPlanations)**.
                </p>

                <div className="my-5 rounded-lg border border-slate-100 bg-[#f8fafc] p-5">
                  <div className="text-center font-mono text-xs text-slate-800 overflow-x-auto whitespace-nowrap py-2">
                    {"φ"}<sub>i</sub>{"(v) = ∑"}<sub>{"S ⊆ N \\ {i}"}</sub> 
                    <span className="inline-block px-1 text-center align-middle">
                      <span className="block border-b border-slate-400">{"|S|! (|N| - |S| - 1)!"}</span>
                      <span className="block">{"|N|!"}</span>
                    </span>
                    {"[ v(S ∪ {i}) - v(S) ]"}
                  </div>
                  <div className="mt-2 text-center text-[10px] text-[#6b7280]">
                    Calculates the exact marginal impact of feature <span className="font-mono">i</span> across all possible coalitions <span className="font-mono">S</span> within the feature space <span className="font-mono">N</span>.
                  </div>
                </div>

                <p className="text-xs leading-[18px] text-[#6b7280]">
                  TreeSHAP traces tree splits to isolate positive contributors (drivers increasing risk like extreme heat) and negative contributors (protective variables like high doctor density).
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <Sliders className="h-3.5 w-3.5 text-[#a21caf]" /> Fallback Deviation Model
                  </h4>
                  <p className="mt-1 text-xs text-[#6b7280] leading-[18px]">
                    If SHAP calculation falls back, the local driver contribution is calculated using an importance-weighted deviation from baseline averages:
                  </p>
                  <div className="mt-2 rounded bg-slate-50 border border-slate-100 p-3 text-center font-mono text-[11px] text-slate-700">
                    Contribution Weight<sub>i</sub> = Deviation Percentage<sub>i</sub> &times; Global Gini Importance<sub>i</sub> &times; 100
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Seals & Support */}
        <div className="flex flex-col gap-8 lg:col-span-4">

          {/* Transparency Seal */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#10b981]" />
              <div>
                <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Transparency & Verification</h4>
                <p className="mt-1 text-[11px] leading-[16px] text-[#6b7280]">
                  This mathematical model is fully auditable. We avoid black-box predictive indices, publishing full parameters, weights, and SHAP calculations for public review and clinical review by national healthcare officials.
                </p>
              </div>
            </div>
          </div>

          {/* Need help or clarification? */}
          <div className="rounded-xl border border-slate-100 bg-white p-5">
            <div className="flex items-start gap-3">
              <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#0369a1]" />
              <div>
                <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Methodology Questions?</h4>
                <p className="mt-1 text-[11px] leading-[16px] text-[#6b7280]">
                  For questions regarding dynamic scaling, Gini importances, or data integrations with the National Health Authority (NHA), contact the MedPulse science team.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
