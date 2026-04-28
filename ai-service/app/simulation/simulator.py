"""
Digital Twin Simulation Engine — predicts future shipment states.

Runs a time-step simulation forward from the current twin state,
projecting location, ETA drift, and risk buildup over a configurable horizon.
"""
import math
import random
from datetime import datetime, timedelta
from typing import Optional


# Average speeds by mode (km/h)
_MODE_SPEED = {"road": 55, "rail": 75, "air": 650, "sea": 28}

# Known high-risk corridor zones (lat/lng centres, radius in degrees)
_HIGH_RISK_ZONES = [
    {"name": "Western Ghats", "lat": 16.0, "lng": 73.5, "radius": 2.0, "risk": 0.3},
    {"name": "Delhi NCR Congestion", "lat": 28.6, "lng": 77.2, "radius": 0.5, "risk": 0.4},
    {"name": "Chicken's Neck Corridor", "lat": 26.3, "lng": 88.5, "radius": 1.0, "risk": 0.25},
    {"name": "Mumbai Port Area", "lat": 19.0, "lng": 72.8, "radius": 0.3, "risk": 0.35},
]


def _in_risk_zone(lat: float, lng: float) -> Optional[dict]:
    """Check if a coordinate falls within a known high-risk zone."""
    for zone in _HIGH_RISK_ZONES:
        d = math.sqrt((lat - zone["lat"]) ** 2 + (lng - zone["lng"]) ** 2)
        if d <= zone["radius"]:
            return zone
    return None


def _bearing_to(src: dict, dst: dict) -> tuple[float, float]:
    """Return normalised (dlat, dlng) direction vector."""
    dlat = dst["lat"] - src["lat"]
    dlng = dst["lng"] - src["lng"]
    mag = math.sqrt(dlat ** 2 + dlng ** 2) or 1e-6
    return dlat / mag, dlng / mag


def simulate_future(twin: dict, horizon_minutes: int = 60) -> list[dict]:
    """
    Project future shipment states in 5-minute increments.

    Args:
        twin: Current shipment twin dict with keys:
              currentLocation, destination, mode, resilience, route_legs
        horizon_minutes: How far ahead to simulate (default 60 min)

    Returns:
        List of predicted state snapshots.
    """
    current = twin.get("currentLocation", {"lat": 20.0, "lng": 78.0})
    dest_name = twin.get("destination", "Mumbai")
    mode = twin.get("mode", "road")
    base_resilience = twin.get("resilience", {}).get("score", 80)

    # Try to figure out destination coords from route_legs
    legs = twin.get("route_legs", [])
    if legs and "to" in legs[-1]:
        dest_coords = legs[-1]["to"]
    else:
        # Fallback approximate
        from ..services.digipin import resolve_address
        geo = resolve_address(dest_name)
        dest_coords = {"lat": geo["lat"], "lng": geo["lng"]}

    speed_kmh = _MODE_SPEED.get(mode, 55)
    speed_deg_per_min = (speed_kmh / 111) / 60  # rough: 1 degree ≈ 111 km

    lat, lng = current["lat"], current["lng"]
    dlat, dlng = _bearing_to(current, dest_coords)

    predictions = []
    cumulative_delay_min = 0
    resilience = base_resilience

    steps = horizon_minutes // 5
    now = datetime.utcnow()

    for step in range(1, steps + 1):
        t = now + timedelta(minutes=step * 5)

        # Move along bearing
        jitter = (random.random() - 0.5) * 0.002  # slight randomness
        lat += dlat * speed_deg_per_min * 5 + jitter
        lng += dlng * speed_deg_per_min * 5 + jitter

        # Check for risk zones
        zone = _in_risk_zone(lat, lng)
        zone_risk = zone["risk"] if zone else 0

        # Simulate random micro-disruptions
        micro_event = random.random()
        if micro_event > 0.92:
            cumulative_delay_min += random.randint(3, 15)
            resilience = max(0, resilience - random.uniform(2, 8))
        elif zone:
            cumulative_delay_min += random.randint(1, 5)
            resilience = max(0, resilience - zone_risk * 10)

        # Gradual resilience recovery when clear
        if not zone and micro_event < 0.5:
            resilience = min(100, resilience + random.uniform(0, 1.5))

        # Calculate remaining distance
        remaining_km = math.sqrt(
            (dest_coords["lat"] - lat) ** 2 + (dest_coords["lng"] - lng) ** 2
        ) * 111
        eta_remaining_min = (remaining_km / speed_kmh) * 60 + cumulative_delay_min

        predictions.append({
            "time": t.isoformat() + "Z",
            "step_minutes": step * 5,
            "location": {"lat": round(lat, 4), "lng": round(lng, 4)},
            "predicted_delay_minutes": cumulative_delay_min,
            "risk_score": round(max(0, 100 - resilience), 1),
            "resilience_score": round(resilience, 1),
            "eta_remaining_minutes": round(eta_remaining_min, 1),
            "risk_zone": zone["name"] if zone else None,
        })

    return predictions
