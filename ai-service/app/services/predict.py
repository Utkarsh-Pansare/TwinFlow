import os
import google.generativeai as genai
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

class DisruptionPrediction(BaseModel):
    probability: float = Field(..., description="Probability of disruption (0.0 to 1.0)")
    risk_factor: str = Field(..., description="The main risk factor identified")
    confidence: str = Field(..., description="'high', 'medium', or 'low'")

async def predict_disruption_risk(route: list, weather: dict = None, mode: str = "road") -> dict:
    """
    Predict disruption BEFORE it happens using Gemini + historical context.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"probability": 0.0, "risk_factor": "No API Key", "confidence": "low"}
    
    genai.configure(api_key=api_key)
    
    # Use Structured Output
    model = genai.GenerativeModel(
        "gemini-1.5-flash",
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=DisruptionPrediction
        )
    )
    
    weather_info = weather or {"condition": "clear", "severity": 0.0}
    
    prompt = f"""You are a logistics risk assessment AI. Analyze the following shipment details and predict the disruption risk.

HISTORICAL CONTEXT:
Mumbai–Delhi: 23% delay probability in monsoon.
Chennai–Guwahati: 41% delay probability in cyclone.
Rail routes: 12% delay probability, high reliability.
Long road routes (>1000km): 30% baseline delay risk.
High severity weather (>0.6): adds 40% to risk.

CURRENT SHIPMENT:
Route: {' → '.join(route)}
Mode: {mode}
Weather Condition: {weather_info.get('condition')} (Severity: {weather_info.get('severity')})

Calculate the probability of disruption, identify the main risk factor, and state your confidence level.
Return as JSON according to the schema.
"""

    try:
        response = model.generate_content(prompt)
        # Parse and return as dict
        prediction = DisruptionPrediction.model_validate_json(response.text)
        return prediction.model_dump()
    except Exception as e:
        logger.error(f"Failed to predict disruption risk: {e}")
        return {"probability": 0.0, "risk_factor": "Prediction Error", "confidence": "low"}
