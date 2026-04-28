import os
import joblib
import pandas as pd
import numpy as np
import logging
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

from ..services import data_pipeline

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "resilience.pkl")
FEATURES = ['distance_km', 'disruptions_count', 'weather_severity', 'congestion_level', 'mode_encoded', 'cost_per_km', 'eta_per_km']

class ResilienceModel:
    def __init__(self):
        self.model = None

    def load_model(self):
        """Load the XGBoost model from disk."""
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                logger.info("✅ ML Model loaded successfully")
                return True
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
        return False

    def generate_synthetic_data(self) -> pd.DataFrame:
        """Generate synthetic fallback data if DB is empty on first startup."""
        logger.info("Generating synthetic fallback data for initial model training...")
        np.random.seed(42)
        n_samples = 500
        
        distance_km = np.random.uniform(50, 2000, n_samples)
        eta_minutes = distance_km * np.random.uniform(1.0, 1.5, n_samples)
        cost_inr = distance_km * np.random.uniform(40, 60, n_samples)
        disruptions_count = np.random.poisson(0.5, n_samples)
        weather_severity = np.random.beta(2, 5, n_samples)
        congestion_level = np.random.beta(2, 5, n_samples)
        mode_encoded = np.random.choice([0, 1, 2], n_samples, p=[0.7, 0.2, 0.1])
        
        df = pd.DataFrame({
            'distance_km': distance_km,
            'eta_minutes': eta_minutes,
            'cost_inr': cost_inr,
            'disruptions_count': disruptions_count,
            'weather_severity': weather_severity,
            'congestion_level': congestion_level,
            'mode_encoded': mode_encoded
        })
        
        df['cost_per_km'] = df['cost_inr'] / (df['distance_km'] + 0.1)
        df['eta_per_km'] = df['eta_minutes'] / (df['distance_km'] + 0.1)
        
        # Heuristic to generate reasonable scores
        base_score = 100
        dist_penalty = (df['distance_km'] / 2000) * 10
        disruption_penalty = df['disruptions_count'] * 15
        weather_penalty = df['weather_severity'] * 20
        congestion_penalty = df['congestion_level'] * 15
        
        scores = base_score - dist_penalty - disruption_penalty - weather_penalty - congestion_penalty
        scores = np.clip(scores + np.random.normal(0, 5, n_samples), 0, 100)
        
        df['resilience_score'] = scores
        return df

    async def train_model(self, force_synthetic=False):
        """Fetch data from DB, preprocess, train XGBoost model, and save to disk."""
        logger.info("Starting model training process...")
        
        df = pd.DataFrame()
        if not force_synthetic:
            df = await data_pipeline.fetch_training_data()
            
        if df.empty or len(df) < 50:
            logger.info("Not enough data in DB. Falling back to synthetic data.")
            df = self.generate_synthetic_data()
        else:
            df = data_pipeline.normalize_features(df)

        # Prepare features and target
        X = df[FEATURES]
        y = df['resilience_score']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self.model = LinearRegression()
        
        self.model.fit(X_train, y_train)
        
        predictions = self.model.predict(X_test)
        mse = mean_squared_error(y_test, predictions)
        logger.info(f"Model trained successfully. Validation MSE: {mse:.2f}")
        
        # Save model
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(self.model, MODEL_PATH)
        logger.info(f"Model saved to {MODEL_PATH}")

    def predict_score(self, distance_km, disruptions_count, weather_severity, congestion_level, mode, cost_inr, eta_minutes) -> float:
        """Use the trained model to predict real-time resilience score."""
        if not self.model:
            # Fallback if model isn't loaded for some reason
            return max(0.0, min(100.0, 100 - disruptions_count * 10 - weather_severity * 20))
            
        mode_map = {"road": 0, "rail": 1, "air": 2}
        mode_encoded = mode_map.get(mode.lower(), 0)
        
        cost_per_km = cost_inr / (distance_km + 0.1) if distance_km else 0
        eta_per_km = eta_minutes / (distance_km + 0.1) if distance_km else 0
        
        input_data = pd.DataFrame([{
            'distance_km': float(distance_km),
            'disruptions_count': int(disruptions_count),
            'weather_severity': float(weather_severity),
            'congestion_level': float(congestion_level),
            'mode_encoded': mode_encoded,
            'cost_per_km': cost_per_km,
            'eta_per_km': eta_per_km
        }])
        
        score = self.model.predict(input_data)[0]
        return max(0.0, min(100.0, round(float(score), 1)))

ml_model = ResilienceModel()
