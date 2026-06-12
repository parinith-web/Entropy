from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "medpulse.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Region(Base):
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True)
    state = Column(String, index=True, nullable=False)
    district = Column(String, index=True, nullable=False)
    
    # Centroid coordinates
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Demographics
    population = Column(Integer, nullable=False)
    density = Column(Float, nullable=False)  # Population per sq km
    elderly_ratio = Column(Float, nullable=False)  # % of pop > 60
    child_ratio = Column(Float, nullable=False)  # % of pop < 5
    poverty_ratio = Column(Float, nullable=False)  # Multidimensional Poverty Index %
    immunization_rate = Column(Float, nullable=False)  # Complete immunization coverage %

    # Healthcare Infrastructure
    baseline_beds = Column(Float, nullable=False)  # Beds per 1,000 population
    baseline_doctors = Column(Float, nullable=False)  # Doctors per 10,000 population
    ambulance_density = Column(Float, nullable=False)  # Ambulances per 100,000 population

    # Geography & Environment Risk
    terrain_difficulty = Column(Integer, nullable=False)  # 1 (Flat) to 5 (Mountain)
    distance_to_tier1 = Column(Float, nullable=False)  # Average km to tertiary care hospital
    clean_water_index = Column(Float, nullable=False)  # Tap water access %
    landscape_urban = Column(Float, nullable=False)  # Urban cover %
    landscape_forest = Column(Float, nullable=False)  # Forest cover %
    landscape_barren = Column(Float, nullable=False)  # Barren cover %
    calamity_risk_index = Column(Float, nullable=False)  # Disaster vulnerability rating (0-10)
    transit_accident_index = Column(Float, nullable=False)  # Highway density indicator
    industrial_risk_index = Column(Float, nullable=False)  # Chemical/factory index

    # Relationships
    weather_logs = relationship("WeatherAQILog", back_populates="region")
    hospital_logs = relationship("HospitalLog", back_populates="region")
    predictions = relationship("PredictionLog", back_populates="region")
    wellness_logs = relationship("DailyWellnessLog", back_populates="region")


class WeatherAQILog(Base):
    __tablename__ = "weather_aqi_logs"

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)

    # Dynamic variables
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    aqi = Column(Float, nullable=False)
    precipitation = Column(Float, nullable=False)
    night_temp_anomaly = Column(Float, nullable=False)
    power_grid_stability = Column(Float, nullable=False)  # Load shedding hours (lower is more stable)
    vector_breeding_index = Column(Float, nullable=False)  # Calculated (0-100)

    region = relationship("Region", back_populates="weather_logs")


class HospitalLog(Base):
    __tablename__ = "hospital_logs"

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)

    # Dynamic metrics
    admitted_count = Column(Integer, nullable=False)  # New admissions in last 3 hrs
    active_patients = Column(Integer, nullable=False)  # Currently hospitalized patients
    icu_load = Column(Integer, nullable=False)  # Number of patients in ICU
    beds_occupied = Column(Integer, nullable=False)  # Occupied bed count

    region = relationship("Region", back_populates="hospital_logs")


class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)

    # Output parameters
    predicted_stress_score = Column(Float, nullable=False)  # Medical Stress Index (0-100)
    predicted_risk_level = Column(Integer, nullable=False)  # 0: Stable, 1: Elevated, 2: High, 3: Critical

    # Explainable AI (Top 3 drivers)
    driver1_name = Column(String, nullable=True)
    driver1_weight = Column(Float, nullable=True)
    
    driver2_name = Column(String, nullable=True)
    driver2_weight = Column(Float, nullable=True)
    
    driver3_name = Column(String, nullable=True)
    driver3_weight = Column(Float, nullable=True)

    region = relationship("Region", back_populates="predictions")


class DailyWellnessLog(Base):
    __tablename__ = "daily_wellness_logs"

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    date = Column(Date, index=True, nullable=False)

    # Wellness Metrics
    wellness_score = Column(Float, nullable=False)  # Main daily score (0-100)
    air_quality_score = Column(Float, nullable=False)
    access_score = Column(Float, nullable=False)
    sanitation_score = Column(Float, nullable=False)

    region = relationship("Region", back_populates="wellness_logs")


def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
