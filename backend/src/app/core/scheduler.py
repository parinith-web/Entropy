import os
import sys
import random
import urllib.request
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy import create_engine, desc
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.database import SessionLocal, Region, WeatherAQILog, HospitalLog, PredictionLog, DailyWellnessLog
from app.ml.explainer import explain_prediction, FEATURE_DISPLAY_NAMES
from app.ml.train_model import FEATURE_COLUMNS, MODEL_PATH

# Safe imports for ML evaluation
try:
    import joblib
    MODEL_AVAILABLE = os.path.exists(MODEL_PATH)
except ImportError:
    MODEL_AVAILABLE = False

def simulate_new_observation(db: Session, timestamp: datetime):
    """
    Fetch weather and air quality observations for all districts from Open-Meteo APIs
    if within real-time range, calculate hospital admissions causally, predict surges
    using XGBoost, and save logs to database.
    """
    regions = db.query(Region).all()
    if not regions:
        print("No regions found to simulate. Run data_acquisition first.")
        return

    print(f"Executing 3-Hour observation/prediction pipeline for timestamp: {timestamp}")
    
    # Load model if trained
    model = None
    if MODEL_AVAILABLE and os.path.exists(MODEL_PATH):
        try:
            model = joblib.load(MODEL_PATH)
        except Exception as e:
            print(f"Error loading model in scheduler: {e}")

    # Prepare logs lists
    weather_logs = []
    hospital_logs = []
    prediction_logs = []
    
    # Check if target timestamp is within live range (current real time +/- 5 days)
    now_time = datetime.now()
    is_live = (now_time - timedelta(days=5)) <= timestamp <= (now_time + timedelta(days=7))
    
    # Fetch live data if is_live is True
    live_weather_data = {}
    if is_live:
        print("Timestamp is within live range. Fetching real-time forecast data from Open-Meteo...")
        try:
            chunk_size = 50
            for i in range(0, len(regions), chunk_size):
                chunk = regions[i:i+chunk_size]
                lats = ",".join([str(r.latitude) for r in chunk])
                lons = ",".join([str(r.longitude) for r in chunk])
                
                # Fetch Weather Forecast
                w_url = f"https://api.open-meteo.com/v1/forecast?latitude={lats}&longitude={lons}&hourly=temperature_2m,relative_humidity_2m,precipitation,weathercode&past_days=3&timezone=Asia/Kolkata"
                # Fetch AQI Forecast
                a_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lats}&longitude={lons}&hourly=us_aqi&past_days=3&timezone=Asia/Kolkata"
                
                req_w = urllib.request.Request(w_url, headers={'User-Agent': 'Mozilla/5.0'})
                req_a = urllib.request.Request(a_url, headers={'User-Agent': 'Mozilla/5.0'})
                
                with urllib.request.urlopen(req_w) as response_w, urllib.request.urlopen(req_a) as response_a:
                    res_w = json.loads(response_w.read().decode('utf-8'))
                    res_a = json.loads(response_a.read().decode('utf-8'))
                    
                    w_list = [res_w] if len(chunk) == 1 else res_w
                    a_list = [res_a] if len(chunk) == 1 else res_a
                    
                    for idx, r in enumerate(chunk):
                        w_hourly = w_list[idx].get("hourly", {})
                        a_hourly = a_list[idx].get("hourly", {})
                        
                        times = w_hourly.get("time", [])
                        target_str = timestamp.strftime("%Y-%m-%dT%H:00")
                        
                        try:
                            t_idx = times.index(target_str)
                        except ValueError:
                            t_idx = -1
                            
                        if t_idx != -1:
                            temps = w_hourly.get("temperature_2m", [])
                            hums = w_hourly.get("relative_humidity_2m", [])
                            precips = w_hourly.get("precipitation", [])
                            codes = w_hourly.get("weathercode", [])
                            aqis = a_hourly.get("us_aqi", [])
                            
                            live_weather_data[r.id] = {
                                "temperature": temps[t_idx] if t_idx < len(temps) else None,
                                "humidity": hums[t_idx] if t_idx < len(hums) else None,
                                "precipitation": precips[t_idx] if t_idx < len(precips) else None,
                                "weathercode": codes[t_idx] if t_idx < len(codes) else None,
                                "aqi": aqis[t_idx] if t_idx < len(aqis) else None
                            }
        except Exception as e:
            print(f"Failed to fetch live weather/AQI forecast: {e}. Falling back to simulated/seasonal defaults.")
            is_live = False

    # Process each region
    for r in regions:
        # Find lagged values from the PREVIOUS interval (3 hours ago)
        prev_time = timestamp - timedelta(hours=3)
        prev_hosp = db.query(HospitalLog).filter_by(region_id=r.id, timestamp=prev_time).first()
        
        lagged_admissions = prev_hosp.admitted_count if prev_hosp else int((r.population / 100000.0) * random.uniform(0.5, 1.2))
        lagged_occupancy = prev_hosp.beds_occupied if prev_hosp else int((r.population / 1000.0) * r.baseline_beds * 0.4)
        lagged_icu_load = prev_hosp.icu_load if prev_hosp else int(lagged_occupancy * 0.1)

        # 1. Weather and AQI observation
        temp, humidity, precip, weather_code, aqi = None, None, None, None, None
        
        if is_live and r.id in live_weather_data:
            data = live_weather_data[r.id]
            temp = data["temperature"]
            humidity = data["humidity"]
            precip = data["precipitation"]
            weather_code = data["weathercode"]
            aqi = data["aqi"]
            
        # Seasonal fallback
        month = timestamp.month
        season = "WINTER"
        if 3 <= month <= 6:
            season = "SUMMER"
        elif 7 <= month <= 9:
            season = "MONSOON"
            
        if temp is None:
            if season == "SUMMER":
                temp = 36.0 if r.terrain_difficulty >= 4 else 41.0 + random.uniform(-2, 2)
            elif season == "MONSOON":
                temp = 30.0 + random.uniform(-2, 2)
            else:
                is_north = r.state in ["Delhi", "Punjab", "Haryana", "Uttar Pradesh", "Himachal Pradesh", "Uttarakhand", "Rajasthan", "Bihar"]
                temp = 10.0 if r.terrain_difficulty >= 4 else (15.0 if is_north else 23.0) + random.uniform(-2, 2)
                
        if humidity is None:
            if season == "SUMMER":
                humidity = random.uniform(20.0, 45.0)
            elif season == "MONSOON":
                humidity = random.uniform(75.0, 95.0)
            else:
                humidity = random.uniform(40.0, 70.0)
                
        if precip is None:
            if season == "MONSOON":
                precip = random.uniform(2.0, 30.0) if random.random() > 0.4 else 0.0
            else:
                precip = random.uniform(0.0, 5.0) if random.random() > 0.95 else 0.0
                
        if weather_code is None:
            weather_code = 0 if precip == 0 else (61 if precip < 10 else 63)
            
        if aqi is None:
            if season == "WINTER":
                is_north = r.state in ["Delhi", "Punjab", "Haryana", "Uttar Pradesh", "Himachal Pradesh", "Uttarakhand", "Rajasthan", "Bihar"]
                aqi = random.uniform(200.0, 450.0) if is_north else random.uniform(50.0, 120.0)
            else:
                aqi = random.uniform(50.0, 130.0)

        # Other dynamic parameters
        night_anomaly = random.uniform(0.5, 3.5) if (0 <= timestamp.hour <= 5 and season == "SUMMER" and temp > 35) else 0.0
        power_grid = random.uniform(0.5, 5.0) if (season == "SUMMER" and temp > 40) else random.uniform(0.0, 1.0)
        vector_index = random.uniform(45.0, 85.0) if season == "MONSOON" else random.uniform(5.0, 25.0)

        # 2. Hospital admissions logic (causal generator)
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
            if r.clean_water_index < 80.0 and precip > 20.0:
                multipliers += 0.4

        # Public Gathering
        gathering = 0
        if random.random() > 0.96:
            gathering = random.randint(1, 4)
            multipliers += (gathering * 0.15)

        base_admissions = (r.population / 100000.0) * random.uniform(0.6, 1.3)
        capacity_coef = max(1.0, 2.0 - r.baseline_beds)
        admissions = int(base_admissions * multipliers * capacity_coef)
        admissions = max(0, admissions)

        # --- Continuous time-series patient accumulation ---
        # active_patients_t = active_patients_{t-1} - discharged + new_admissions
        # discharge_rate = 1/32 (avg hospital length of stay = 4 days = 32 x 3-hour intervals)
        total_capacity_beds = int(r.baseline_beds * (r.population / 1000))
        discharge_rate = 1.0 / 32.0
        discharged = int(lagged_occupancy * discharge_rate)
        active_patients = max(0, lagged_occupancy - discharged + admissions)

        beds_occupied = min(total_capacity_beds, active_patients)
        icu_load = int(beds_occupied * random.uniform(0.08, 0.14))

        # Log weather/hospital data
        w_log = WeatherAQILog(
            region_id=r.id, timestamp=timestamp, temperature=round(temp, 1),
            humidity=round(humidity, 1), aqi=round(aqi, 1), precipitation=round(precip, 2),
            night_temp_anomaly=round(night_anomaly, 2), power_grid_stability=round(power_grid, 1),
            vector_breeding_index=round(vector_index, 1)
        )
        weather_logs.append(w_log)

        h_log = HospitalLog(
            region_id=r.id, timestamp=timestamp, admitted_count=admissions,
            active_patients=active_patients, icu_load=icu_load, beds_occupied=beds_occupied
        )
        hospital_logs.append(h_log)

        # 3. Model Inference & Explanation
        features_dict = {
            "population": r.population, "density": r.density, "elderly_ratio": r.elderly_ratio,
            "child_ratio": r.child_ratio, "poverty_ratio": r.poverty_ratio, "immunization_rate": r.immunization_rate,
            "baseline_beds": r.baseline_beds, "baseline_doctors": r.baseline_doctors, "ambulance_density": r.ambulance_density,
            "terrain_difficulty": r.terrain_difficulty, "distance_to_tier1": r.distance_to_tier1, "clean_water_index": r.clean_water_index,
            "landscape_urban": r.landscape_urban, "landscape_forest": r.landscape_forest, "landscape_barren": r.landscape_barren,
            "calamity_risk_index": r.calamity_risk_index, "transit_accident_index": r.transit_accident_index, "industrial_risk_index": r.industrial_risk_index,
            "temperature": round(temp, 1), "humidity": round(humidity, 1), "aqi": round(aqi, 1), "precipitation": round(precip, 2),
            "night_temp_anomaly": round(night_anomaly, 2), "power_grid_stability": round(power_grid, 1), "vector_breeding_index": round(vector_index, 1),
            "lagged_admissions": lagged_admissions, "lagged_occupancy": lagged_occupancy, "lagged_icu_load": lagged_icu_load
        }

        # Predict score (0-100) & risk level (0-3)
        if model is not None:
            input_row = [features_dict.get(col, 0.0) for col in FEATURE_COLUMNS]
            input_df = pd.DataFrame([input_row], columns=FEATURE_COLUMNS)
            
            pred_level = int(model.predict(input_df)[0])
            total_beds = max(1, total_capacity_beds)
            occupancy_pct = beds_occupied / total_beds
            pred_score = min(100.0, max(0.0, occupancy_pct * 100.0 + random.uniform(-5.0, 5.0)))
        else:
            total_beds = max(1, total_capacity_beds)
            ratio = active_patients / total_beds
            pred_score = min(100.0, ratio * 100.0)
            if pred_score <= 40.0:
                pred_level = 0
            elif pred_score <= 60.0:
                pred_level = 1
            elif pred_score <= 80.0:
                pred_level = 2
            else:
                pred_level = 3

        # Explain the prediction
        top_drivers = explain_prediction(features_dict)
        drivers = [{"name": "Baseline Metrics", "weight": 5.0} for _ in range(3)]
        for idx, drv in enumerate(top_drivers[:3]):
            drivers[idx] = drv

        pred_log = PredictionLog(
            region_id=r.id,
            timestamp=timestamp,
            predicted_stress_score=round(pred_score, 1),
            predicted_risk_level=pred_level,
            driver1_name=drivers[0]["name"], driver1_weight=round(drivers[0]["weight"], 1),
            driver2_name=drivers[1]["name"], driver2_weight=round(drivers[1]["weight"], 1),
            driver3_name=drivers[2]["name"], driver3_weight=round(drivers[2]["weight"], 1)
        )
        prediction_logs.append(pred_log)

    db.bulk_save_objects(weather_logs)
    db.bulk_save_objects(hospital_logs)
    db.bulk_save_objects(prediction_logs)
    db.commit()
    print(f"Observation and predictions logged for {len(regions)} regions at {timestamp}.")

def simulate_daily_wellness(db: Session, date: datetime.date):
    """
    Calculate the daily wellness index mapping the healthiest districts in India.
    Wellness score = 100 - (AQI penalty + Bed shortage penalty + Sanitation penalty)
    """
    regions = db.query(Region).all()
    if not regions:
        return

    print(f"Calculating Daily Wellness Index for date: {date}")
    wellness_records = []

    for r in regions:
        # Check average AQI over the last 24 hours
        start_time = datetime.combine(date, datetime.min.time())
        end_time = datetime.combine(date, datetime.max.time())
        
        avg_aqi_query = db.query(WeatherAQILog.aqi).filter(
            WeatherAQILog.region_id == r.id,
            WeatherAQILog.timestamp.between(start_time, end_time)
        ).all()
        
        avg_aqi = np.mean([a[0] for a in avg_aqi_query]) if avg_aqi_query else 80.0
        
        # Check average bed occupancy ratio
        avg_occ_query = db.query(HospitalLog.beds_occupied).filter(
            HospitalLog.region_id == r.id,
            HospitalLog.timestamp.between(start_time, end_time)
        ).all()
        
        avg_occ = np.mean([o[0] for o in avg_occ_query]) if avg_occ_query else 0.4
        total_beds = max(1, int(r.baseline_beds * (r.population / 1000)))
        occupancy_ratio = avg_occ / total_beds

        # Sub-scores (0-100, where higher is healthier/better)
        # 1. Air Quality score
        air_score = max(0.0, 100.0 - (avg_aqi / 3.0)) # AQI 300 gives 0, AQI 0 gives 100
        
        # 2. Access score (combines distance to tier 1, doctors, ambulances, and low occupancy)
        dist_penalty = (r.distance_to_tier1 / 150.0) * 20.0
        doc_bonus = (r.baseline_doctors / 30.0) * 30.0
        amb_bonus = (r.ambulance_density / 20.0) * 20.0
        occ_penalty = occupancy_ratio * 30.0
        access_score = min(100.0, max(0.0, 100.0 - dist_penalty + doc_bonus + amb_bonus - occ_penalty))
        
        # 3. Sanitation score
        sanitation_score = (r.clean_water_index * 0.5) + (r.poverty_ratio * -0.5) + 50.0
        sanitation_score = min(100.0, max(0.0, sanitation_score))

        # Overall Wellness = weighted average
        wellness_score = (air_score * 0.3) + (access_score * 0.4) + (sanitation_score * 0.3)
        wellness_score = min(100.0, max(0.0, wellness_score))

        wellness_log = DailyWellnessLog(
            region_id=r.id,
            date=date,
            wellness_score=round(wellness_score, 1),
            air_quality_score=round(air_score, 1),
            access_score=round(access_score, 1),
            sanitation_score=round(sanitation_score, 1)
        )
        wellness_records.append(wellness_log)

    db.bulk_save_objects(wellness_records)
    db.commit()
    print(f"Daily Wellness Index computed and stored for {len(regions)} regions.")
