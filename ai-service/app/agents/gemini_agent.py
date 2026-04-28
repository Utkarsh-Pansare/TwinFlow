"""
Gemini Agent — NLP intent parsing, route explanation, and alert generation.
"""
import os
import json
import google.generativeai as genai
from pydantic import BaseModel
from typing import List, Optional, Dict, Any


from ..schemas.schemas import PlanResponse

class GeminiAgent:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        self._available = bool(api_key)
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-1.5-flash")
            # Create a specific model for structured outputs
            self.structured_model = genai.GenerativeModel(
                "gemini-1.5-flash",
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=PlanResponse
                )
            )

    # ── A. NL → Structured Plan ───────────────────────────────────────────
    def parse_query(self, query: str) -> PlanResponse:
        if not self._available:
            return self._parse_fallback(query)

        prompt = f"""You are a logistics AI assistant. Analyze this shipment query:
"{query}"

Extract the parameters into the structured JSON format."""

        try:
            response = self.structured_model.generate_content(prompt)
            # The response is guaranteed to be valid JSON matching PlanResponse
            return PlanResponse.model_validate_json(response.text)
        except Exception as e:
            print(f"Gemini parse error: {e}")
            return self._parse_fallback(query)

    def _parse_fallback(self, query: str) -> PlanResponse:
        """Basic keyword extraction when Gemini is unavailable."""
        words = query.lower().split()
        cities = [
            "pune", "mumbai", "delhi", "bangalore", "bengaluru", "chennai",
            "hyderabad", "kolkata", "ahmedabad", "jaipur", "lucknow",
            "guwahati", "kochi", "surat", "nagpur", "patna", "bhopal",
        ]
        found = [w.capitalize() for w in words if w in cities]
        origin = found[0] if len(found) >= 1 else "Pune"
        destination = found[1] if len(found) >= 2 else "Mumbai"
        return PlanResponse(
            origin=origin,
            destination=destination,
            priority="normal",
            deadline_hours=24,
            max_cost_inr=10000,
            preferred_mode="road",
            constraints=[],
            summary=f"Ship from {origin} to {destination}",
        )

    # ── B. Route Explanation ──────────────────────────────────────────────
    def explain_route(self, route: List[str], score: float, legs_summary: Dict[str, Any] = None) -> str:
        if not self._available:
            return f"Route {' → '.join(route)} selected with resilience score {score}%. Estimated {legs_summary.get('total_hours', '?')}h over {legs_summary.get('total_km', '?')} km."

        legs_info = ""
        if legs_summary:
            legs_info = f"\nRoute details: {legs_summary['leg_count']} legs, ~{legs_summary['total_hours']}h, ~{legs_summary['total_km']} km."

        prompt = f"""You are a logistics AI. Explain why this route was chosen:
Route: {' → '.join(route)}
Resilience Score: {score}%{legs_info}

Provide exactly 3 concise bullet points. Be specific and professional."""

        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception:
            return f"Route {' → '.join(route)} selected with resilience {score}%."

    # ── C. Alert Generator ────────────────────────────────────────────────
    def generate_alert(self, disruption: str) -> str:
        if not self._available:
            return f"⚠️ {disruption}"

        prompt = f"Generate a concise 1-line professional logistics alert for: {disruption}"
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception:
            return f"⚠️ {disruption}"
