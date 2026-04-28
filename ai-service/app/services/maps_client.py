"""
Google Routes API client — fetches real-world route legs with polylines.

Uses POST https://routes.googleapis.com/directions/v2:computeRoutes
Falls back to mock data when API key is absent or request fails.
"""
import os
import math
import requests


def _mock_polyline(origin_ll: dict, dest_ll: dict) -> str:
    """
    Generate a simple encoded polyline approximation (straight line)
    for display purposes when the real API is unavailable.
    """
    # Return raw coordinate pairs as a simple format the frontend can decode
    # We'll just return a GeoJSON-compatible coordinate string instead
    return None  # frontend will draw straight line from coords


def _haversine_km(lat1, lng1, lat2, lng2) -> float:
    """Great-circle distance in km."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _speed_for_mode(mode: str) -> float:
    """Average speed in km/h for each mode."""
    return {"road": 60, "rail": 80, "air": 700, "sea": 30}.get(mode, 60)


def get_route_leg(origin_ll: dict, dest_ll: dict, mode: str = "road") -> dict:
    """
    Compute a single route leg.
    origin_ll / dest_ll: {"lat": float, "lng": float}

    Returns:
        {
            "from": {"lat", "lng"},
            "to":   {"lat", "lng"},
            "mode": str,
            "durationSeconds": int,
            "distanceMeters": int,
            "polyline": str | None,       # encoded polyline from Google
            "coordinates": [[lng,lat]...]  # GeoJSON coords for fallback rendering
        }
    """
    api_key = os.getenv("MAPS_API_KEY")
    polyline = None
    duration_sec = None
    distance_m = None

    # ── Try Google Routes API ──────────────────────────────────────────────
    if api_key and mode == "road":
        try:
            url = "https://routes.googleapis.com/directions/v2:computeRoutes"
            headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
            }
            body = {
                "origin": {
                    "location": {
                        "latLng": {"latitude": origin_ll["lat"], "longitude": origin_ll["lng"]}
                    }
                },
                "destination": {
                    "location": {
                        "latLng": {"latitude": dest_ll["lat"], "longitude": dest_ll["lng"]}
                    }
                },
                "travelMode": "DRIVE",
                "routingPreference": "TRAFFIC_AWARE",
            }
            resp = requests.post(url, json=body, headers=headers, timeout=8)
            data = resp.json()

            if "routes" in data and len(data["routes"]) > 0:
                route = data["routes"][0]
                polyline = route.get("polyline", {}).get("encodedPolyline")
                duration_sec = int(route.get("duration", "0s").rstrip("s"))
                distance_m = route.get("distanceMeters", 0)
        except Exception as e:
            print(f"Google Routes API error: {e}")

    # ── Fallback: haversine estimate ───────────────────────────────────────
    if duration_sec is None:
        dist_km = _haversine_km(origin_ll["lat"], origin_ll["lng"], dest_ll["lat"], dest_ll["lng"])
        # Add ~30% road factor for non-air modes
        if mode != "air":
            dist_km *= 1.3
        distance_m = int(dist_km * 1000)
        speed = _speed_for_mode(mode)
        duration_sec = int((dist_km / speed) * 3600)

    # Build GeoJSON coordinate pair for simple line rendering
    coordinates = [
        [origin_ll["lng"], origin_ll["lat"]],
        [dest_ll["lng"], dest_ll["lat"]],
    ]

    return {
        "from": origin_ll,
        "to": dest_ll,
        "mode": mode,
        "durationSeconds": duration_sec,
        "distanceMeters": distance_m,
        "polyline": polyline,
        "coordinates": coordinates,
    }


def get_multi_leg_route(waypoints: list[dict], mode: str = "road") -> list[dict]:
    """
    Given an ordered list of waypoints [{"lat", "lng"}, ...],
    compute each consecutive leg and return the full journey.
    """
    legs = []
    for i in range(len(waypoints) - 1):
        leg = get_route_leg(waypoints[i], waypoints[i + 1], mode)
        legs.append(leg)
    return legs
