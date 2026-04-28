"""
DIGIPIN Resolver — converts raw addresses to geo-coordinates and India-specific DIGIPIN codes.

Pipeline: Raw address → Google Geocoding API → lat/lng → DIGIPIN encoding
"""
import os
import requests
import math
from typing import Optional

# DIGIPIN character set (India's 10-char grid encoding)
DIGIPIN_CHARS = "23456789CFGHJMPQRVWX"

# India bounding box (approx)
INDIA_LAT_MIN = 6.0
INDIA_LAT_MAX = 37.0
INDIA_LNG_MIN = 68.0
INDIA_LNG_MAX = 98.0


def _encode_digipin(lat: float, lng: float, precision: int = 10) -> str:
    """
    Encode a lat/lng pair into a DIGIPIN-style grid code.
    Uses recursive bisection of the India bounding box.
    """
    lat_min, lat_max = INDIA_LAT_MIN, INDIA_LAT_MAX
    lng_min, lng_max = INDIA_LNG_MIN, INDIA_LNG_MAX
    code = []
    base = len(DIGIPIN_CHARS)

    for i in range(precision):
        # Alternate: even chars encode longitude, odd chars encode latitude
        if i % 2 == 0:
            mid = (lng_min + lng_max) / 2
            if lng >= mid:
                idx = min(base - 1, int((lng - mid) / (lng_max - mid) * (base // 2)) + base // 2)
                lng_min = mid
            else:
                idx = min(base // 2 - 1, int((lng - lng_min) / (mid - lng_min) * (base // 2)))
                lng_max = mid
        else:
            mid = (lat_min + lat_max) / 2
            if lat >= mid:
                idx = min(base - 1, int((lat - mid) / (lat_max - mid) * (base // 2)) + base // 2)
                lat_min = mid
            else:
                idx = min(base // 2 - 1, int((lat - lat_min) / (mid - lat_min) * (base // 2)))
                lat_max = mid

        code.append(DIGIPIN_CHARS[idx])

    # Format as XXX-XXX-XXXX
    raw = "".join(code)
    return f"{raw[:3]}-{raw[3:6]}-{raw[6:]}"


def _geocode_google(address: str) -> Optional[dict]:
    """Call Google Geocoding API. Returns {lat, lng} or None."""
    api_key = os.getenv("MAPS_API_KEY")
    if not api_key:
        return None

    url = "https://maps.googleapis.com/maps/api/geocode/json"
    resp = requests.get(url, params={"address": address, "key": api_key}, timeout=5)
    data = resp.json()

    if data.get("status") == "OK" and data.get("results"):
        loc = data["results"][0]["geometry"]["location"]
        return {"lat": loc["lat"], "lng": loc["lng"]}
    return None


# ── Well-known Indian city coordinates (fallback when API key absent) ──────────
_KNOWN_CITIES = {
    "pune":       {"lat": 18.5204, "lng": 73.8567},
    "mumbai":     {"lat": 19.0760, "lng": 72.8777},
    "delhi":      {"lat": 28.6139, "lng": 77.2090},
    "new delhi":  {"lat": 28.6139, "lng": 77.2090},
    "bangalore":  {"lat": 12.9716, "lng": 77.5946},
    "bengaluru":  {"lat": 12.9716, "lng": 77.5946},
    "chennai":    {"lat": 13.0827, "lng": 80.2707},
    "hyderabad":  {"lat": 17.3850, "lng": 78.4867},
    "kolkata":    {"lat": 22.5726, "lng": 88.3639},
    "ahmedabad":  {"lat": 23.0225, "lng": 72.5714},
    "jaipur":     {"lat": 26.9124, "lng": 75.7873},
    "lucknow":    {"lat": 26.8467, "lng": 80.9462},
    "guwahati":   {"lat": 26.1445, "lng": 91.7362},
    "kochi":      {"lat": 9.9312,  "lng": 76.2673},
    "surat":      {"lat": 21.1702, "lng": 72.8311},
    "nagpur":     {"lat": 21.1458, "lng": 79.0882},
    "patna":      {"lat": 25.6093, "lng": 85.1376},
    "bhopal":     {"lat": 23.2599, "lng": 77.4126},
    "chandigarh": {"lat": 30.7333, "lng": 76.7794},
    "visakhapatnam": {"lat": 17.6868, "lng": 83.2185},
    "vizag":      {"lat": 17.6868, "lng": 83.2185},
    "coimbatore":  {"lat": 11.0168, "lng": 76.9558},
    "indore":     {"lat": 22.7196, "lng": 75.8577},
    "vadodara":   {"lat": 22.3072, "lng": 73.1812},
    "thiruvananthapuram": {"lat": 8.5241, "lng": 76.9366},
    "singapore":  {"lat": 1.3521,  "lng": 103.8198},
    "dubai":      {"lat": 25.2048, "lng": 55.2708},
    "london":     {"lat": 51.5074, "lng": -0.1278},
    "new york":   {"lat": 40.7128, "lng": -74.0060},
    "shanghai":   {"lat": 31.2304, "lng": 121.4737},
}


def resolve_address(address: str) -> dict:
    """
    Master resolver: address → lat/lng → DIGIPIN.
    Tries Google Geocoding first, falls back to known-city lookup.
    """
    # 1. Try Google Geocoding API
    geo = _geocode_google(address)

    # 2. Fallback to known cities
    if geo is None:
        key = address.strip().lower()
        geo = _KNOWN_CITIES.get(key)

    # 3. Last resort — centre of India
    if geo is None:
        geo = {"lat": 20.5937, "lng": 78.9629}

    lat, lng = geo["lat"], geo["lng"]
    digipin = _encode_digipin(lat, lng)

    return {
        "address": address,
        "lat": lat,
        "lng": lng,
        "digipin": digipin,
    }
