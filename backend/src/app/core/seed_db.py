import os
import sys
import urllib.request
import json
import pandas as pd
import io
import re
import random
import time
import numpy as np
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, Region, WeatherAQILog, HospitalLog, init_db

def clean_name(name):
    if not isinstance(name, str):
        return ""
    name = name.lower().strip()
    name = re.sub(r'[^a-z0-9]', '', name)
    name = name.replace("district", "").replace("dist", "")
    name = name.replace("and", "").replace("&", "")
    return name

def get_matching_indicator(indicators, substring):
    for ind in indicators:
        if substring in ind:
            return ind
    return None

def run_seeding():
    print("====================================================")
    print("Starting Database Seeding Pipeline...")
    print("====================================================")
    
    # 1. Download Datasets
    print("Downloading demographic and coordinate datasets...")
    census_url = "https://raw.githubusercontent.com/nishusharma1608/India-Census-2011-Analysis/master/india-districts-census-2011.csv"
    nfhs_dist_url = "https://raw.githubusercontent.com/pratapvardhan/NFHS-5/master/NFHS-5-Districts.csv"
    nfhs_state_url = "https://raw.githubusercontent.com/pratapvardhan/NFHS-5/master/NFHS-5-States.csv"
    coords_url = "https://raw.githubusercontent.com/SaravananSuriya/Phonepe-Pulse-Data-Visualization-and-Exploration/main/lat-%26-lon-india-district.csv"

    def get_df(url):
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as r:
            return pd.read_csv(io.StringIO(r.read().decode('utf-8')))

    try:
        df_census = get_df(census_url)
        df_nfhs_dist = get_df(nfhs_dist_url)
        df_nfhs_state = get_df(nfhs_state_url)
        df_coords = get_df(coords_url)
        print(f"Downloaded datasets: Census ({len(df_census)}), NFHS ({len(df_nfhs_dist)}), Coords ({len(df_coords)})")
    except Exception as e:
        print(f"Error downloading datasets: {e}")
        return

    # 2. Clean NFHS-5 Health Indicators
    dist_indicators = df_nfhs_dist['Indicator'].unique()
    state_indicators = df_nfhs_state['indicator'].unique()

    dist_water = get_matching_indicator(dist_indicators, "improved drinking-water source")
    dist_san = get_matching_indicator(dist_indicators, "improved sanitation facility")
    dist_vac = get_matching_indicator(dist_indicators, "fully vaccinated based on information from either vaccination card")

    state_water = get_matching_indicator(state_indicators, "improved drinking-water source")
    state_san = get_matching_indicator(state_indicators, "improved sanitation facility")
    state_vac = get_matching_indicator(state_indicators, "fully vaccinated based on information from either vaccination card")

    # Pivot District Table
    df_nfhs_dist_f = df_nfhs_dist[df_nfhs_dist['Indicator'].isin([dist_water, dist_san, dist_vac])].copy()
    df_nfhs_dist_f['Indicator'] = df_nfhs_dist_f['Indicator'].map({
        dist_water: "clean_water_index", dist_san: "sanitation_pct", dist_vac: "immunization_rate"
    })
    df_nfhs_dist_f['NFHS-5'] = pd.to_numeric(df_nfhs_dist_f['NFHS-5'].astype(str).str.replace(r'[^\d.]', '', regex=True), errors='coerce')
    df_nfhs_dist_pivot = df_nfhs_dist_f.pivot_table(index=['State', 'District'], columns='Indicator', values='NFHS-5', aggfunc='mean').reset_index()
    df_nfhs_dist_pivot['clean_dist'] = df_nfhs_dist_pivot['District'].apply(clean_name)

    # Pivot State Table
    df_nfhs_state_f = df_nfhs_state[df_nfhs_state['indicator'].isin([state_water, state_san, state_vac])].copy()
    df_nfhs_state_f['Indicator'] = df_nfhs_state_f['indicator'].map({
        state_water: "clean_water_index", state_san: "sanitation_pct", state_vac: "immunization_rate"
    })
    df_nfhs_state_f['nfhs5_total'] = pd.to_numeric(df_nfhs_state_f['nfhs5_total'].astype(str).str.replace(r'[^\d.]', '', regex=True), errors='coerce')
    df_nfhs_state_pivot = df_nfhs_state_f.pivot_table(index=['state'], columns='Indicator', values='nfhs5_total', aggfunc='mean').reset_index()
    df_nfhs_state_pivot['clean_state'] = df_nfhs_state_pivot['state'].apply(clean_name)

    # 3. Merge datasets
    df_census['clean_dist'] = df_census['District name'].apply(clean_name)
    df_census['clean_state'] = df_census['State name'].apply(clean_name)
    df_coords['clean_dist'] = df_coords['District'].apply(clean_name)

    base_df = pd.merge(df_census, df_coords, on='clean_dist', how='inner').drop_duplicates(subset=['clean_dist'])
    merged = pd.merge(base_df, df_nfhs_dist_pivot[['clean_dist', 'clean_water_index', 'sanitation_pct', 'immunization_rate']], on='clean_dist', how='left')

    df_nfhs_state_pivot = df_nfhs_state_pivot.rename(columns={
        'clean_water_index': 'state_water', 'sanitation_pct': 'state_sanitation', 'immunization_rate': 'state_immunization'
    })
    merged = pd.merge(merged, df_nfhs_state_pivot[['clean_state', 'state_water', 'state_sanitation', 'state_immunization']], on='clean_state', how='left')

    merged['clean_water_index'] = merged['clean_water_index'].fillna(merged['state_water'])
    merged['sanitation_pct'] = merged['sanitation_pct'].fillna(merged['state_sanitation'])
    merged['immunization_rate'] = merged['immunization_rate'].fillna(merged['state_immunization'])

    for col, val in {'clean_water_index': 90.0, 'sanitation_pct': 70.0, 'immunization_rate': 80.0}.items():
        merged[col] = merged[col].fillna(val)

    merged['latitude_val'] = pd.to_numeric(merged['lat'].fillna(merged['Latitude']), errors='coerce')
    merged['longitude_val'] = pd.to_numeric(merged['lon'].fillna(merged['Longitude']), errors='coerce')
    merged = merged.dropna(subset=['latitude_val', 'longitude_val'])
    merged = merged[merged['State name'].notnull() & merged['District name'].notnull()]

    # 4. Construct and Seed Regions
    state_densities = {
        "bihar": 1106.0, "delhi": 11320.0, "westbengal": 1028.0, "kerala": 860.0,
        "uttarpradesh": 829.0, "haryana": 573.0, "tamilnadu": 555.0, "punjab": 551.0,
        "jharkhand": 414.0, "assam": 398.0, "goa": 394.0, "maharashtra": 365.0,
        "tripura": 350.0, "karnataka": 319.0, "andhrapradesh": 308.0, "gujarat": 308.0,
        "odisha": 270.0, "madhyapradesh": 236.0, "rajasthan": 200.0, "uttarakhand": 189.0,
        "chhattisgarh": 189.0, "meghalaya": 132.0, "jammuandkashmir": 124.0,
        "himachalpradesh": 123.0, "manipur": 122.0, "nagaland": 119.0, "sikkim": 86.0,
        "mizoram": 52.0, "arunachalpradesh": 17.0, "andamanandnicobarislands": 46.0,
        "chandigarh": 9258.0, "dadraandnagarhaveli": 700.0, "damananddiu": 2191.0,
        "lakshadweep": 2149.0, "puducherry": 2547.0
    }

    regions_to_seed = []
    for idx, row in merged.iterrows():
        state_clean = clean_name(row['State name'])
        state_dens = state_densities.get(state_clean, 382.0)
        u15_ratio = float(row.get('2. Population below age 15 years (%)', 28.0))
        child_ratio = (u15_ratio / 3.0) if not np.isnan(u15_ratio) else 9.0
        age_50_plus = float(row['Age_Group_50']) if 'Age_Group_50' in row else 150000.0
        total_pop = float(row['Population'])
        elderly_ratio = (age_50_plus / total_pop * 100 * 0.55) if total_pop > 0 else 9.0
        low_power = float(row['Power_Parity_Less_than_Rs_45000']) if 'Power_Parity_Less_than_Rs_45000' in row else 50000.0
        tot_power = float(row['Total_Power_Parity']) if 'Total_Power_Parity' in row else 500000.0
        poverty_ratio = (low_power / tot_power * 100) if tot_power > 0 else 15.0
        urban_hh = float(row['Urban_Households']) if 'Urban_Households' in row else 0.0
        tot_hh = float(row['Households']) if 'Households' in row else 1.0
        urban_frac = (urban_hh / tot_hh) if tot_hh > 0 else 0.0
        density = state_dens * (0.5 + urban_frac * 2.0)
        
        baseline_beds = max(0.5, round(1.0 + (urban_frac * 1.8) + random.uniform(-0.2, 0.2), 2))
        baseline_doctors = max(2.0, round(5.0 + (urban_frac * 12.0) + random.uniform(-1.0, 1.0), 2))
        ambulance_density = max(1.5, round(4.0 + (urban_frac * 6.0) + random.uniform(-0.5, 0.5), 2))
        
        terrain = 1
        mountain_states = ["himachalpradesh", "uttarakhand", "arunachalpradesh", "sikkim", "ladakh", "jammuandkashmir", "mizoram", "nagaland", "meghalaya", "manipur", "tripura"]
        if state_clean in mountain_states:
            terrain = 4 if urban_frac < 0.2 else 3
        dist_to_tier1 = max(2.0, round(40.0 * (1.0 - urban_frac) + (50.0 if state_clean in mountain_states else 0.0), 1))
        
        landscape_urban = urban_frac * 90.0 + random.uniform(0, 5)
        landscape_forest = (60.0 if state_clean in mountain_states else 15.0) * (1.0 - urban_frac)
        landscape_barren = max(0.0, 100.0 - landscape_urban - landscape_forest)
        
        calamity = 3.0 + (3.0 if state_clean in ["kerala", "tamilnadu", "andhrapradesh", "odisha", "goa", "maharashtra", "westbengal", "gujarat"] else 0.0)
        if state_clean in mountain_states: calamity = 7.0
        
        transit = 3.0 + urban_frac * 5.0
        industrial = 8.5 if clean_name(row['District name']) in ["bharuch", "valsad", "surat", "vadodara", "visakhapatnam", "thane", "ghaziabad", "kanpur", "kolkata"] else random.uniform(1.0, 4.0)

        regions_to_seed.append({
            "state": str(row['State name']).strip(), "district": str(row['District name']).strip(), "population": int(row['Population']),
            "density": round(density, 2), "elderly_ratio": round(elderly_ratio, 2), "child_ratio": round(child_ratio, 2),
            "poverty_ratio": round(poverty_ratio, 2), "immunization_rate": round(row['immunization_rate'], 2),
            "baseline_beds": round(baseline_beds, 2), "baseline_doctors": round(baseline_doctors, 2), "ambulance_density": round(ambulance_density, 2),
            "terrain_difficulty": int(terrain), "distance_to_tier1": round(dist_to_tier1, 2), "clean_water_index": round(row['clean_water_index'], 2),
            "landscape_urban": round(landscape_urban, 2), "landscape_forest": round(landscape_forest, 2), "landscape_barren": round(landscape_barren, 2),
            "calamity_risk_index": round(calamity, 2), "transit_accident_index": round(transit, 2), "industrial_risk_index": round(industrial, 2),
            "lat": float(row['latitude_val']), "lon": float(row['longitude_val'])
        })

    print("Fetching elevations from Open-Meteo...")
    coords_list = [(r["lat"], r["lon"]) for r in regions_to_seed]
    elevations = []
    for i in range(0, len(coords_list), 100):
        chunk = coords_list[i:i+100]
        lats = ",".join([str(c[0]) for c in chunk])
        lons = ",".join([str(c[1]) for c in chunk])
        url = f"https://api.open-meteo.com/v1/elevation?latitude={lats}&longitude={lons}"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                elevations.extend(res_data.get("elevation", [100.0]*len(chunk)))
        except Exception as e:
            print(f"Error fetching elevations chunk {i}: {e}")
            elevations.extend([100.0]*len(chunk))
        time.sleep(0.2)

    for idx, r in enumerate(regions_to_seed):
        alt = elevations[idx] if idx < len(elevations) else 100.0
        r["altitude_m"] = alt
        if alt > 1500: r["terrain_difficulty"] = 5
        elif alt > 800: r["terrain_difficulty"] = 4
        elif alt > 300: r["terrain_difficulty"] = 3
        elif alt > 100: r["terrain_difficulty"] = 2
        else: r["terrain_difficulty"] = 1

    # Database execution
    print("Initialising database tables...")
    init_db()
    db = SessionLocal()

    print("Purging old logs and tables...")
    try:
        db.query(WeatherAQILog).delete()
        db.query(HospitalLog).delete()
        db.query(Region).delete()
        db.commit()
    except Exception as e:
        print(f"Database clean error: {e}")
        db.rollback()

    print("Inserting regions...")
    db_regions = [Region(
        state=r["state"], district=r["district"], latitude=r["lat"], longitude=r["lon"], 
        population=r["population"], density=r["density"], elderly_ratio=r["elderly_ratio"], 
        child_ratio=r["child_ratio"], poverty_ratio=r["poverty_ratio"], immunization_rate=r["immunization_rate"], 
        baseline_beds=r["baseline_beds"], baseline_doctors=r["baseline_doctors"], ambulance_density=r["ambulance_density"], 
        terrain_difficulty=r["terrain_difficulty"], distance_to_tier1=r["distance_to_tier1"], 
        clean_water_index=r["clean_water_index"], landscape_urban=r["landscape_urban"], 
        landscape_forest=r["landscape_forest"], landscape_barren=r["landscape_barren"], 
        calamity_risk_index=r["calamity_risk_index"], transit_accident_index=r["transit_accident_index"], 
        industrial_risk_index=r["industrial_risk_index"]
    ) for r in regions_to_seed]

    db.bulk_save_objects(db_regions)
    db.commit()

    regions = db.query(Region).all()
    print(f"Seeded {len(regions)} regions.")

    # 5. Fetch 30 Days of Historical Weather & AQI Logs
    print("Backfilling 30 days of 3-hourly historical weather & AQI logs...")
    start_date = (datetime.now() - timedelta(days=35)).strftime("%Y-%m-%d")
    end_date = (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d")

    region_coords = {r.id: (r.latitude, r.longitude) for r in regions}
    region_ids = list(region_coords.keys())
    weather_logs, hospital_logs = [], []

    for c_idx in range(0, len(region_ids), 40):
        chunk_ids = region_ids[c_idx:c_idx+40]
        lats = ",".join([str(region_coords[rid][0]) for rid in chunk_ids])
        lons = ",".join([str(region_coords[rid][1]) for rid in chunk_ids])
        
        weather_url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lats}&longitude={lons}&start_date={start_date}&end_date={end_date}&hourly=temperature_2m,relative_humidity_2m,precipitation,weathercode&timezone=Asia/Kolkata"
        aqi_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lats}&longitude={lons}&start_date={start_date}&end_date={end_date}&hourly=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide,us_aqi"
        
        try:
            req_w = urllib.request.Request(weather_url, headers={'User-Agent': 'Mozilla/5.0'})
            req_a = urllib.request.Request(aqi_url, headers={'User-Agent': 'Mozilla/5.0'})
            
            with urllib.request.urlopen(req_w) as resp_w:
                w_res = json.loads(resp_w.read().decode('utf-8'))
            with urllib.request.urlopen(req_a) as resp_a:
                a_res = json.loads(resp_a.read().decode('utf-8'))
            
            w_list = [w_res] if len(chunk_ids) == 1 else w_res
            a_list = [a_res] if len(chunk_ids) == 1 else a_res
            
            for i, rid in enumerate(chunk_ids):
                w_h = w_list[i].get("hourly", {})
                a_h = a_list[i].get("hourly", {})
                r = next(x for x in regions if x.id == rid)
                
                total_beds = int(r.baseline_beds * (r.population / 1000))
                active_patients = int(total_beds * 0.4)
                
                for j in range(0, len(w_h.get("time", [])), 3):
                    ts = datetime.strptime(w_h["time"][j], "%Y-%m-%dT%H:%M")
                    temp = float(w_h["temperature_2m"][j]) if w_h["temperature_2m"][j] is not None else 25.0
                    hum = float(w_h["relative_humidity_2m"][j]) if w_h["relative_humidity_2m"][j] is not None else 60.0
                    prec = float(w_h["precipitation"][j]) if w_h["precipitation"][j] is not None else 0.0
                    aqi = float(a_h["us_aqi"][j]) if a_h["us_aqi"][j] is not None else 80.0
                    
                    month = ts.month
                    season = "WINTER"
                    if 3 <= month <= 6:
                        season = "SUMMER"
                    elif 7 <= month <= 9:
                        season = "MONSOON"
                    
                    night_anomaly = random.uniform(0.5, 3.5) if (0 <= ts.hour <= 5 and season == "SUMMER" and temp > 35) else 0.0
                    power_grid = random.uniform(0.5, 5.0) if (season == "SUMMER" and temp > 40) else random.uniform(0.0, 1.0)
                    vector_index = random.uniform(45.0, 85.0) if season == "MONSOON" else random.uniform(5.0, 25.0)
                    
                    gathering = 0
                    if random.random() > 0.96:
                        gathering = random.randint(1, 4)
                    
                    multipliers = 1.0
                    if temp > 42.0:
                        multipliers += (temp - 42.0) * 0.1 * (r.elderly_ratio / 10.0)
                        if power_grid > 3.0:
                            multipliers += 0.3
                    elif temp < 8.0:
                        multipliers += (8.0 - temp) * 0.08 * (r.elderly_ratio / 10.0)
                        
                    if aqi > 180.0:
                        multipliers += (aqi - 180.0) * 0.004 * (1.0 + r.child_ratio / 10.0)
                        
                    if season == "MONSOON":
                        if vector_index > 65.0:
                            multipliers += 0.3
                        if r.clean_water_index < 80.0 and prec > 20.0:
                            multipliers += 0.4
                            
                    if gathering > 0:
                        multipliers += (gathering * 0.15)
                    
                    base_admissions = (r.population / 100000.0) * random.uniform(0.6, 1.3)
                    capacity_coef = max(1.0, 2.0 - r.baseline_beds)
                    admissions = int(base_admissions * multipliers * capacity_coef)
                    admissions = max(0, admissions)
                    
                    discharge_rate = 1.0 / 32.0
                    discharged = int(active_patients * discharge_rate)
                    active_patients = max(0, active_patients - discharged + admissions)
                    
                    occupied = min(total_beds, active_patients)
                    
                    weather_logs.append(WeatherAQILog(
                        region_id=rid, timestamp=ts, temperature=round(temp, 1), 
                        humidity=round(hum, 1), aqi=round(aqi, 1), precipitation=round(prec, 2), 
                        night_temp_anomaly=round(night_anomaly, 2), power_grid_stability=round(power_grid, 1), 
                        vector_breeding_index=round(vector_index, 1)
                    ))
                    hospital_logs.append(HospitalLog(
                        region_id=rid, timestamp=ts, admitted_count=admissions, 
                        active_patients=active_patients, icu_load=int(occupied*0.1), 
                        beds_occupied=occupied
                    ))
            
            if len(weather_logs) >= 5000:
                print(f"Commiting batch of logs ({len(weather_logs)} items)...")
                db.bulk_save_objects(weather_logs)
                db.bulk_save_objects(hospital_logs)
                db.commit()
                weather_logs.clear()
                hospital_logs.clear()

        except Exception as e:
            print(f"Error backfilling chunk starting index {c_idx}: {e}")
        
        time.sleep(0.5)

    if weather_logs:
        db.bulk_save_objects(weather_logs)
        db.bulk_save_objects(hospital_logs)
        db.commit()

    total_count = db.query(WeatherAQILog).count()
    print(f"Success! Data warehouse backfilled with {total_count} logs.")
    db.close()
