import os

# Static paths for the XGBoost model assets
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "medpulse_model.joblib")
FEATURES_PATH = os.path.join(MODEL_DIR, "features_list.joblib")

# List of features used by the XGBoost surge classifier
FEATURE_COLUMNS = [
    # Demographics
    "population", "density", "elderly_ratio", "child_ratio", "poverty_ratio", "immunization_rate",
    # Healthcare Infrastructure
    "baseline_beds", "baseline_doctors", "ambulance_density",
    # Geography & Environment Risk
    "terrain_difficulty", "distance_to_tier1", "clean_water_index",
    "landscape_urban", "landscape_forest", "landscape_barren", 
    "calamity_risk_index", "transit_accident_index", "industrial_risk_index",
    # Dynamic variables
    "temperature", "humidity", "aqi", "precipitation", "night_temp_anomaly",
    "power_grid_stability", "vector_breeding_index",
    # Lagged occupancy metrics (as of time t)
    "lagged_admissions", "lagged_occupancy", "lagged_icu_load"
]
