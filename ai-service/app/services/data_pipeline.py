import pandas as pd
from typing import Dict, List, Any
from ..db.database import db
import logging

logger = logging.getLogger(__name__)

async def insert_historical_route(route: List[str], final_outcome_score: float, disruptions: List[str], total_distance: float, total_duration_minutes: float, cost: float, mode: str = "road"):
    """Insert a completed route and its real outcome into the DB to feed the ML model."""
    if not db.pool:
        logger.warning("DB pool not available. Cannot insert historical route.")
        return

    origin = route[0] if len(route) > 0 else "Unknown"
    destination = route[-1] if len(route) > 1 else "Unknown"

    query = """
    INSERT INTO historical_routes (origin, destination, mode, distance_km, eta_minutes, cost_inr, disruptions_count, resilience_score)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    """
    
    try:
        async with db.pool.acquire() as conn:
            await conn.execute(
                query, 
                origin, 
                destination, 
                mode, 
                float(total_distance), 
                int(total_duration_minutes), 
                float(cost), 
                len(disruptions), 
                float(final_outcome_score)
            )
            logger.info(f"Inserted historical route {origin} -> {destination} with score {final_outcome_score}")
    except Exception as e:
        logger.error(f"Failed to insert historical route: {e}")

async def fetch_training_data() -> pd.DataFrame:
    """Fetch all historical routes as a pandas DataFrame."""
    if not db.pool:
        logger.warning("DB pool not available. Cannot fetch training data.")
        return pd.DataFrame()

    query = "SELECT * FROM historical_routes"
    
    try:
        async with db.pool.acquire() as conn:
            records = await conn.fetch(query)
            if not records:
                return pd.DataFrame()
                
            # Convert asyncpg records to list of dicts, then to DataFrame
            df = pd.DataFrame([dict(r) for r in records])
            return df
    except Exception as e:
        logger.error(f"Failed to fetch training data: {e}")
        return pd.DataFrame()

def normalize_features(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and normalize features for XGBoost."""
    if df.empty:
        return df
        
    df = df.copy()
    
    # 1. Handle missing values
    df['distance_km'] = df['distance_km'].astype(float).fillna(0)
    df['eta_minutes'] = df['eta_minutes'].astype(float).fillna(0)
    df['cost_inr'] = df['cost_inr'].astype(float).fillna(0)
    df['disruptions_count'] = df['disruptions_count'].astype(int).fillna(0)
    df['resilience_score'] = df['resilience_score'].astype(float).fillna(50) # Fallback score
    
    # 2. Encode Mode
    mode_map = {"road": 0, "rail": 1, "air": 2}
    df['mode_encoded'] = df['mode'].str.lower().map(mode_map).fillna(0).astype(int)
    
    # 3. Feature Engineering
    df['cost_per_km'] = (df['cost_inr'] / (df['distance_km'] + 0.1)).round(2)
    df['eta_per_km'] = (df['eta_minutes'] / (df['distance_km'] + 0.1)).round(2)
    
    # Add dummy weather and congestion since they aren't recorded in DB yet, 
    # but the model needs them. We can synthesize them or keep them at 0 for historical.
    # In a real system, these would also be saved in historical_routes.
    if 'weather_severity' not in df.columns:
        df['weather_severity'] = 0.0
    if 'congestion_level' not in df.columns:
        df['congestion_level'] = 0.0
        
    return df
