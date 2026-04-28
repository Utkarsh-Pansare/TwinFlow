"""
External Disruption Signal Ingestion — normalises signals from multiple sources.

In production these would be live API feeds. For the hackathon demo,
we simulate rotating disruption signals that feel realistic.
"""
import random
import time
from datetime import datetime

# Simulated signal catalogue
_SIGNAL_TEMPLATES = [
    {
        "type": "cyclone",
        "description": "Cyclonic storm approaching Bay of Bengal coast",
        "lat": 15.5, "lng": 80.5,
        "severity": "high",
    },
    {
        "type": "flood",
        "description": "Heavy rainfall causing flooding in Assam region",
        "lat": 26.1, "lng": 91.7,
        "severity": "critical",
    },
    {
        "type": "congestion",
        "description": "Major traffic congestion on NH-48 near Pune",
        "lat": 18.5, "lng": 73.9,
        "severity": "medium",
    },
    {
        "type": "customs_delay",
        "description": "Extended customs processing at Nhava Sheva port",
        "lat": 18.95, "lng": 72.95,
        "severity": "medium",
    },
    {
        "type": "weather",
        "description": "Dense fog advisory across Indo-Gangetic Plain",
        "lat": 27.0, "lng": 80.0,
        "severity": "medium",
    },
    {
        "type": "strike",
        "description": "Transport workers strike affecting Delhi freight corridor",
        "lat": 28.6, "lng": 77.2,
        "severity": "high",
    },
    {
        "type": "accident",
        "description": "Multi-vehicle accident blocking NH-44 near Hyderabad",
        "lat": 17.4, "lng": 78.5,
        "severity": "high",
    },
    {
        "type": "port_closure",
        "description": "Chennai port operations suspended due to maintenance",
        "lat": 13.1, "lng": 80.3,
        "severity": "medium",
    },
]

# Active signals rotate every ~30 seconds to simulate a live feed
_cache = {"signals": [], "timestamp": 0}


def get_active_signals() -> list[dict]:
    """
    Return currently active disruption signals.
    Rotates 2-3 random signals every 30 seconds.
    """
    now = time.time()
    if now - _cache["timestamp"] > 30:
        count = random.randint(1, 3)
        selected = random.sample(_SIGNAL_TEMPLATES, min(count, len(_SIGNAL_TEMPLATES)))
        _cache["signals"] = [
            {**sig, "id": f"SIG-{random.randint(1000,9999)}", "timestamp": datetime.utcnow().isoformat() + "Z"}
            for sig in selected
        ]
        _cache["timestamp"] = now

    return _cache["signals"]


def inject_signal(signal_type: str, lat: float, lng: float, severity: str = "high", description: str = "") -> dict:
    """Manually inject a disruption signal (for demo scenarios)."""
    sig = {
        "id": f"SIG-{random.randint(1000,9999)}",
        "type": signal_type,
        "description": description or f"Manual {signal_type} signal",
        "lat": lat,
        "lng": lng,
        "severity": severity,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    _cache["signals"].append(sig)
    return sig
