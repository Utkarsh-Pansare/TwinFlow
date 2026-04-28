"""
Feedback Learning Loop — tracks prediction accuracy and route performance.

Stores predicted vs actual outcomes and uses a simple regression model
to calibrate future prediction thresholds.
"""
import json
import os
import time
from datetime import datetime

# In-memory feedback store (in production, use a database)
_feedback_log: list[dict] = []
_calibration = {"threshold_adjustment": 0.0, "accuracy_pct": 0.0, "sample_count": 0}

FEEDBACK_FILE = os.path.join(os.path.dirname(__file__), "feedback_data.json")


def record_outcome(shipment_id: str, predicted: dict, actual: dict) -> dict:
    """
    Record a predicted vs actual outcome for learning.

    predicted: {"disruption": bool, "probability": float, "delay_min": int}
    actual:    {"disruption": bool, "delay_min": int, "resilience_final": float}
    """
    entry = {
        "shipment_id": shipment_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "predicted_disruption": predicted.get("disruption", False),
        "predicted_probability": predicted.get("probability", 0),
        "predicted_delay": predicted.get("delay_min", 0),
        "actual_disruption": actual.get("disruption", False),
        "actual_delay": actual.get("delay_min", 0),
        "actual_resilience": actual.get("resilience_final", 100),
        "correct": predicted.get("disruption") == actual.get("disruption"),
    }

    _feedback_log.append(entry)

    # Recalibrate
    _recalibrate()

    return entry


def _recalibrate():
    """Simple accuracy calibration based on accumulated feedback."""
    if len(_feedback_log) < 3:
        return

    correct = sum(1 for e in _feedback_log if e["correct"])
    total = len(_feedback_log)
    accuracy = correct / total

    # If we're over-predicting (too many false positives), raise threshold
    false_positives = sum(
        1 for e in _feedback_log
        if e["predicted_disruption"] and not e["actual_disruption"]
    )
    fp_rate = false_positives / total

    # If we're under-predicting (missing real disruptions), lower threshold
    false_negatives = sum(
        1 for e in _feedback_log
        if not e["predicted_disruption"] and e["actual_disruption"]
    )
    fn_rate = false_negatives / total

    adjustment = 0.0
    if fp_rate > 0.3:
        adjustment = 0.05  # raise threshold (be less aggressive)
    elif fn_rate > 0.2:
        adjustment = -0.05  # lower threshold (be more cautious)

    _calibration["threshold_adjustment"] = adjustment
    _calibration["accuracy_pct"] = round(accuracy * 100, 1)
    _calibration["sample_count"] = total
    _calibration["fp_rate"] = round(fp_rate * 100, 1)
    _calibration["fn_rate"] = round(fn_rate * 100, 1)


def get_calibration() -> dict:
    """Return current calibration state for the prediction model."""
    return {**_calibration}


def get_feedback_log() -> list[dict]:
    """Return recent feedback entries."""
    return _feedback_log[-20:]


def get_adjusted_threshold(base: float = 0.45) -> float:
    """Return the dynamically adjusted prediction threshold."""
    return max(0.2, min(0.8, base + _calibration["threshold_adjustment"]))
