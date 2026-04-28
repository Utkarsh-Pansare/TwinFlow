"""
Logic agents for the LangGraph pipeline.
Each function takes and returns SupplyChainState.
"""
import os
import random
import requests
from ..services.ortools_solver import solve_route
from ..services.maps_client import get_route_leg
from ..services.digipin import resolve_address


# ─── Known hub coordinates for route construction ────────────────────────────
_HUBS = {
    "Pune":       {"lat": 18.5204, "lng": 73.8567},
    "Mumbai":     {"lat": 19.0760, "lng": 72.8777},
    "Delhi":      {"lat": 28.6139, "lng": 77.2090},
    "Bangalore":  {"lat": 12.9716, "lng": 77.5946},
    "Chennai":    {"lat": 13.0827, "lng": 80.2707},
    "Hyderabad":  {"lat": 17.3850, "lng": 78.4867},
    "Kolkata":    {"lat": 22.5726, "lng": 88.3639},
    "Ahmedabad":  {"lat": 23.0225, "lng": 72.5714},
    "Guwahati":   {"lat": 26.1445, "lng": 91.7362},
    "Nagpur":     {"lat": 21.1458, "lng": 79.0882},
    "Jaipur":     {"lat": 26.9124, "lng": 75.7873},
    "Lucknow":    {"lat": 26.8467, "lng": 80.9462},
}


def _nearest_hub(lat, lng, exclude_names=None):
    """Find the nearest hub to a given lat/lng."""
    exclude_names = exclude_names or []
    best_name, best_dist = None, float("inf")
    for name, coord in _HUBS.items():
        if name in exclude_names:
            continue
        d = abs(coord["lat"] - lat) + abs(coord["lng"] - lng)
        if d < best_dist:
            best_dist = d
            best_name = name
    return best_name


# ═══════════════════════════════════════════════════════════════════════════════
# AGENT 1: DISRUPTION DETECTION
# ═══════════════════════════════════════════════════════════════════════════════

def disruption_agent(state):
    """Detects disruptions in the shipment twin."""
    twin = state.get("twin", {})
    resilience = twin.get("resilience", {}).get("score", 100)

    disruptions = []
    if resilience < 50:
        disruptions.append("Critical resilience drop detected.")

    # Simulated random events
    events = [
        "Sudden traffic congestion on primary route.",
        "Adverse weather warning in transit corridor.",
        "Customs clearance delay at checkpoint.",
    ]
    if random.random() > 0.6:
        disruptions.append(random.choice(events))

    state["disruptions"] = disruptions
    state["replan_needed"] = len(disruptions) > 0
    return state


# ═══════════════════════════════════════════════════════════════════════════════
# AGENT 2: ROUTE OPTIMIZATION (OR-Tools + Maps API legs)
# ═══════════════════════════════════════════════════════════════════════════════

def route_agent(state):
    """Generate candidate routes using OR-Tools, then fetch real legs via Maps API."""
    if not state.get("replan_needed"):
        return state

    twin = state.get("twin", {})
    mode = twin.get("mode", "road")

    # Resolve origin / destination
    origin_geo = state.get("origin_geo")
    dest_geo = state.get("dest_geo")

    if not origin_geo:
        origin_name = twin.get("origin", "Pune")
        origin_geo = resolve_address(origin_name)
        state["origin_geo"] = origin_geo

    if not dest_geo:
        dest_name = twin.get("destination", "Mumbai")
        dest_geo = resolve_address(dest_name)
        state["dest_geo"] = dest_geo

    # Build waypoints: origin → hub → destination
    mid_hub_name = _nearest_hub(
        (origin_geo["lat"] + dest_geo["lat"]) / 2,
        (origin_geo["lng"] + dest_geo["lng"]) / 2,
        exclude_names=[twin.get("origin"), twin.get("destination")],
    )
    mid_hub = _HUBS.get(mid_hub_name, {"lat": 20.0, "lng": 78.0})

    waypoints = [
        {"lat": origin_geo["lat"], "lng": origin_geo["lng"]},
        mid_hub,
        {"lat": dest_geo["lat"], "lng": dest_geo["lng"]},
    ]

    # OR-Tools: solve ordering of waypoints (TSP)
    locations_for_solver = [(w["lat"], w["lng"]) for w in waypoints]
    order = solve_route(locations_for_solver, [])

    if order:
        waypoints = [waypoints[i] for i in order if i < len(waypoints)]

    # Fetch real legs from Maps API (or haversine fallback)
    legs = []
    names = [twin.get("origin", "Origin"), mid_hub_name or "Hub", twin.get("destination", "Destination")]
    for i in range(len(waypoints) - 1):
        leg = get_route_leg(waypoints[i], waypoints[i + 1], mode)
        leg["fromName"] = names[min(i, len(names) - 1)]
        leg["toName"] = names[min(i + 1, len(names) - 1)]
        legs.append(leg)

    state["candidate_routes"] = names
    state["route_legs"] = legs
    return state


# ═══════════════════════════════════════════════════════════════════════════════
# AGENT 3: RESILIENCE SCORING
# ═══════════════════════════════════════════════════════════════════════════════

def resilience_agent(state):
    """Score candidate routes using the ML model based on distance, duration, disruption exposure."""
    if not state.get("replan_needed"):
        return state

    legs = state.get("route_legs", [])
    total_dist = sum(l.get("distanceMeters", 0) for l in legs)
    total_dur = sum(l.get("durationSeconds", 0) for l in legs)

    distance_km = total_dist / 1000
    eta_minutes = total_dur / 60
    
    twin = state.get("twin", {})
    mode = twin.get("mode", "road")
    
    # Rough estimate cost for now
    cost_inr = distance_km * 50
    disruptions_count = len(state.get("disruptions", []))

    from ..models.resilience_model import ml_model
    
    score = ml_model.predict_score(
        distance_km=distance_km,
        disruptions_count=disruptions_count,
        weather_severity=0.0, # We'd inject real data here if we had it
        congestion_level=0.0,
        mode=mode,
        cost_inr=cost_inr,
        eta_minutes=eta_minutes
    )

    state["resilience_scores"] = score
    state["selected_route"] = state.get("candidate_routes", [])
    state["total_duration_hours"] = round(eta_minutes / 60, 1)
    state["total_distance_km"] = round(distance_km, 1)
    return state


# ═══════════════════════════════════════════════════════════════════════════════
# AGENT 5: TWIN WRITER (syncs back to Node.js API)
# ═══════════════════════════════════════════════════════════════════════════════

def twin_writer(state):
    """Twin writer now simply returns state, as the Node.js worker handles DB persistence."""
    if not state.get("replan_needed"):
        return state

    shipment_id = state.get("shipment_id")
    print(f"TwinWriter: LangGraph pipeline completed for {shipment_id}")
    return state
