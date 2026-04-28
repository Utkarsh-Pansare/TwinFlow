"""
Predictive Disruption Agent — detects risks BEFORE they materialise.

Analyses simulation projections and external signals to determine
whether a shipment is likely to face a disruption within the next hour.
"""
from ..simulation.simulator import simulate_future
from ..services.signals import get_active_signals


def predictive_agent(state: dict) -> dict:
    """
    Run predictive analysis on a shipment twin.

    Pipeline:
    1. Simulate future states (next 60 min)
    2. Check for external disruption signals
    3. Score overall predicted risk
    4. Set replan_needed if threshold exceeded

    Adds to state:
        predictions, predicted_disruption, prediction_probability, prediction_reason
    """
    twin = state.get("twin", {})

    # ── 1. Forward simulation ──────────────────────────────────────────────
    predictions = simulate_future(twin, horizon_minutes=60)
    state["predictions"] = predictions

    # Analyse prediction trajectory
    if not predictions:
        state["predicted_disruption"] = False
        state["prediction_probability"] = 0.0
        state["prediction_reason"] = "Insufficient data for prediction"
        return state

    # Find worst projected state
    worst = max(predictions, key=lambda p: p["risk_score"])
    avg_risk = sum(p["risk_score"] for p in predictions) / len(predictions)
    max_delay = max(p["predicted_delay_minutes"] for p in predictions)
    final_resilience = predictions[-1]["resilience_score"]

    # ── 2. External signal overlay ─────────────────────────────────────────
    signals = get_active_signals()
    signal_boost = 0
    signal_reasons = []

    for sig in signals:
        # Check if signal location is near current or future path
        for pred in predictions[:4]:  # check first 20 min of travel
            loc = pred["location"]
            dlat = abs(loc["lat"] - sig.get("lat", 0))
            dlng = abs(loc["lng"] - sig.get("lng", 0))
            if dlat < 2.0 and dlng < 2.0:
                severity_map = {"low": 0.1, "medium": 0.25, "high": 0.4, "critical": 0.6}
                signal_boost += severity_map.get(sig.get("severity", "low"), 0.1)
                signal_reasons.append(f"{sig['type']}: {sig.get('description', 'Unknown')}")
                break  # one match per signal is enough

    # ── 3. Composite probability ───────────────────────────────────────────
    base_probability = min(1.0, avg_risk / 100)
    delay_factor = min(0.3, max_delay / 60)  # up to 0.3 for 60+ min delay
    resilience_factor = max(0, (50 - final_resilience) / 100)  # boost if resilience < 50

    probability = min(1.0, base_probability + delay_factor + resilience_factor + signal_boost)
    probability = round(probability, 2)

    # ── 4. Build reason string ─────────────────────────────────────────────
    reasons = []
    if avg_risk > 30:
        reasons.append(f"Elevated avg risk ({avg_risk:.0f}%)")
    if max_delay > 10:
        reasons.append(f"Projected delay {max_delay} min")
    if final_resilience < 60:
        reasons.append(f"Resilience degrading to {final_resilience:.0f}%")
    if worst.get("risk_zone"):
        reasons.append(f"Enters risk zone: {worst['risk_zone']}")
    reasons.extend(signal_reasons)

    reason_str = " + ".join(reasons) if reasons else "Nominal conditions"

    # ── 5. Decision ────────────────────────────────────────────────────────
    THRESHOLD = 0.45
    state["predicted_disruption"] = probability >= THRESHOLD
    state["prediction_probability"] = probability
    state["prediction_reason"] = reason_str

    # If predicted disruption, mark for proactive replan
    if state["predicted_disruption"]:
        state["replan_needed"] = True
        state["disruptions"] = state.get("disruptions", []) + [
            f"[PREDICTED] {reason_str} (p={probability})"
        ]

    return state
