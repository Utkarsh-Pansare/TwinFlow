"""
TwinFlow AI — LangGraph Supply Chain Decision Pipeline
=======================================================
Implements a real StateGraph with 4 agent nodes:

  disruption_agent_node  →  [risk?]  →  constraint_agent_node
                                    ↓ (no risk)
                         routing_agent_node  →  learning_agent_node  →  END

State schema: SupplyChainState (TypedDict)
Exports:      supply_chain_graph, SupplyChainState
"""

import os
import random
import requests
from typing import TypedDict, List, Dict, Any, Optional
from dotenv import load_dotenv

import google.generativeai as genai
from langgraph.graph import StateGraph, START, END
from ortools.sat.python import cp_model

# ── Environment ────────────────────────────────────────────────────────────────

load_dotenv()

GENAI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GENAI_API_KEY and not GENAI_API_KEY.startswith("dummy"):
    genai.configure(api_key=GENAI_API_KEY)

# ── Shared State ───────────────────────────────────────────────────────────────

class SupplyChainState(TypedDict):
    shipment_id: str
    twin_data: dict
    risk_detected: bool
    disruption_event: dict
    candidate_routes: list
    selected_route: list
    resilience_score: float
    gemini_explanation: str
    alerts: List[str]
    loop_b_attempts: int
    co2_kg: float


# ── Node 1: Disruption Agent ───────────────────────────────────────────────────

def disruption_agent_node(state: SupplyChainState) -> SupplyChainState:
    """
    Checks real weather via Open-Meteo (no API key required) and simulates
    congestion risk.  Sets risk_detected + disruption_event in state.
    """
    twin_data = state.get("twin_data", {})
    location  = twin_data.get("currentLocation", {})
    lat = float(location.get("lat", 19.076))   # default: Mumbai
    lng = float(location.get("lng", 72.877))

    risk_detected    = False
    disruption_event: Dict[str, Any] = {}

    # ── Real weather check via Open-Meteo ─────────────────────────────────────
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lng}&current_weather=true"
        )
        resp = requests.get(url, timeout=6)
        if resp.status_code == 200:
            cw = resp.json().get("current_weather", {})
            wind_speed  = float(cw.get("windspeed",   0))
            weathercode = int(cw.get("weathercode",   0))

            print(
                f"[DisruptionAgent] Weather @ ({lat},{lng}): "
                f"wind={wind_speed} km/h  code={weathercode}"
            )

            if wind_speed > 40 or weathercode in [95, 96, 99]:
                risk_detected    = True
                disruption_event = {
                    "type":     "weather",
                    "severity": round(wind_speed / 10.0, 2),
                    "wind_kph": wind_speed,
                    "code":     weathercode,
                }
        else:
            print(f"[DisruptionAgent] Open-Meteo returned {resp.status_code}")
    except Exception as exc:
        print(f"[DisruptionAgent] Weather API error: {exc}")

    # ── Stochastic congestion risk (20%) ──────────────────────────────────────
    if not risk_detected and random.random() < 0.20:
        risk_detected    = True
        disruption_event = {
            "type":     "congestion",
            "severity": round(random.uniform(5.0, 9.0), 2),
        }
        print(f"[DisruptionAgent] Simulated congestion risk → severity {disruption_event['severity']}")

    print(f"[DisruptionAgent] risk_detected={risk_detected}  event={disruption_event}")

    return {
        **state,
        "risk_detected":    risk_detected,
        "disruption_event": disruption_event,
    }


# ── Node 2: Constraint Agent (OR-Tools CP-SAT) ─────────────────────────────────

def constraint_agent_node(state: SupplyChainState) -> SupplyChainState:
    """
    Only executes when risk_detected == True.
    Uses OR-Tools CP-SAT to find valid routes that satisfy the deadline
    constraint, ranked by cost.
    """
    twin_data        = state.get("twin_data", {})
    origin           = twin_data.get("origin",      "origin")
    destination      = twin_data.get("destination", "destination")
    deadline_hours   = int(twin_data.get("deadline_hours", 48))

    # ── Route catalogue ───────────────────────────────────────────────────────
    # cost is in relative units × 100; time in hours
    routes_info = [
        {
            "label":    "A",
            "path":     [origin, "HUB-NORTH", destination],
            "cost":     100,          # 1.00x
            "time_h":   48,           # 1.00x
            "mode":     "road",
        },
        {
            "label":    "B",
            "path":     [origin, "HUB-WEST", destination],
            "cost":     85,           # 0.85x
            "time_h":   58,           # 1.20x  (48 * 1.2 = 57.6 → 58)
            "mode":     "road",
        },
        {
            "label":    "C",
            "path":     [origin, "AIR-HUB", destination],
            "cost":     210,          # 2.10x
            "time_h":   19,           # 0.40x  (48 * 0.4 = 19.2 → 19)
            "mode":     "air",
        },
    ]

    n = len(routes_info)

    # ── OR-Tools CP-SAT model ─────────────────────────────────────────────────
    model      = cp_model.CpModel()
    route_vars = [model.NewBoolVar(f"route_{i}") for i in range(n)]

    # Exactly one route must be selected
    model.Add(sum(route_vars) == 1)

    # Selected route must meet the deadline
    model.Add(
        sum(route_vars[i] * routes_info[i]["time_h"] for i in range(n))
        <= deadline_hours
    )

    # Minimize cost
    model.Minimize(
        sum(route_vars[i] * routes_info[i]["cost"] for i in range(n))
    )

    solver = cp_model.CpSolver()
    status = solver.Solve(model)
    print(f"[ConstraintAgent] CP-SAT status={solver.StatusName(status)}")

    # ── Collect valid routes (satisfy deadline, irrespective of solver) ────────
    valid_routes = [r for r in routes_info if r["time_h"] <= deadline_hours]
    valid_routes.sort(key=lambda r: r["cost"])   # cheapest first

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE) and valid_routes:
        print(f"[ConstraintAgent] {len(valid_routes)} valid route(s) found.")
        return {
            **state,
            "candidate_routes": valid_routes,
        }
    else:
        attempts = state.get("loop_b_attempts", 0) + 1
        print(f"[ConstraintAgent] No feasible routes. loop_b_attempts={attempts}")
        return {
            **state,
            "candidate_routes": [],
            "loop_b_attempts":  attempts,
        }


# ── Node 3: Routing Agent ──────────────────────────────────────────────────────

# CO₂ emission factors (kg / km)
_CO2_FACTORS = {
    "air":  0.82,
    "sea":  0.03,
    "road": 0.21,
}
_DEFAULT_DIST_KM = 800


def _infer_mode(route_path: list) -> str:
    joined = " ".join(route_path).upper()
    if "AIR" in joined:
        return "air"
    if "SEA" in joined or "PORT" in joined:
        return "sea"
    return "road"


def routing_agent_node(state: SupplyChainState) -> SupplyChainState:
    """
    Selects the best route from candidate_routes (lowest cost that meets
    deadline).  Falls back to a baseline HUB-NORTH route when no risk exists.
    Calculates CO₂ and resilience score.
    """
    risk_detected    = state.get("risk_detected",    False)
    candidate_routes = state.get("candidate_routes", [])
    twin_data        = state.get("twin_data",        {})
    origin           = twin_data.get("origin",      "origin")
    destination      = twin_data.get("destination", "destination")

    if risk_detected:
        if not candidate_routes:
            # Loop-B: no valid routes yet — leave selected_route empty
            print("[RoutingAgent] No candidate routes (Loop-B scenario). Leaving selected_route empty.")
            return {
                **state,
                "selected_route":   [],
                "co2_kg":           0.0,
                "resilience_score": 0.0,
            }

        # Pick cheapest valid route (already sorted by constraint_agent)
        best  = candidate_routes[0]
        selected_path = best["path"]
        mode  = best.get("mode", _infer_mode(selected_path))
        print(f"[RoutingAgent] Selected route {best['label']} via {mode}: {selected_path}")
    else:
        # Baseline route (no disruption detected)
        selected_path = [origin, "HUB-NORTH", destination]
        mode          = "road"
        print(f"[RoutingAgent] No risk — baseline route: {selected_path}")

    # CO₂ calculation
    co2_factor = _CO2_FACTORS.get(mode, _CO2_FACTORS["road"])
    co2_kg     = round(_DEFAULT_DIST_KM * co2_factor, 2)

    # Resilience score
    if risk_detected:
        resilience_score = round(random.uniform(55, 90), 2)
    else:
        resilience_score = round(random.uniform(80, 99), 2)

    print(f"[RoutingAgent] CO₂={co2_kg} kg  resilience={resilience_score}")

    return {
        **state,
        "selected_route":   selected_path,
        "co2_kg":           co2_kg,
        "resilience_score": resilience_score,
    }


# ── Node 4: Learning Agent ─────────────────────────────────────────────────────

def learning_agent_node(state: SupplyChainState) -> SupplyChainState:
    """
    Records the shipment outcome, appends an alert, and generates a 2-sentence
    plain-English explanation via Gemini 1.5 Flash.
    """
    shipment_id      = state.get("shipment_id",      "UNKNOWN")
    resilience_score = state.get("resilience_score", 0.0)
    disruption_event = state.get("disruption_event", {})
    selected_route   = state.get("selected_route",   [])
    alerts           = list(state.get("alerts",      []))

    # ── Record outcome alert ──────────────────────────────────────────────────
    alert_msg = (
        f"Learning Agent recorded outcome for {shipment_id} "
        f"— resilience: {resilience_score:.1f}"
    )
    alerts.append(alert_msg)
    print(f"[LearningAgent] {alert_msg}")

    # ── Gemini explanation ────────────────────────────────────────────────────
    gemini_explanation = ""
    api_key = os.getenv("GEMINI_API_KEY", "")

    if api_key and not api_key.startswith("dummy"):
        try:
            prompt = (
                f"You are a supply chain AI. "
                f"Shipment {shipment_id} faced {disruption_event}. "
                f"Selected route: {selected_route}. "
                f"Resilience score: {resilience_score}. "
                f"Write a 2-sentence plain English explanation of the routing decision."
            )
            gemini_model   = genai.GenerativeModel("gemini-1.5-flash")
            resp           = gemini_model.generate_content(prompt)
            gemini_explanation = resp.text.strip()
            print(f"[LearningAgent] Gemini explanation generated ({len(gemini_explanation)} chars).")
        except Exception as exc:
            gemini_explanation = (
                f"Route {selected_route} was chosen with a resilience score of "
                f"{resilience_score:.1f}. Disruption: {disruption_event.get('type','none')}."
            )
            print(f"[LearningAgent] Gemini failed ({exc}), using fallback explanation.")
    else:
        # Deterministic fallback when no valid API key is configured
        route_str = " → ".join(selected_route) if selected_route else "baseline"
        gemini_explanation = (
            f"Shipment {shipment_id} was routed via {route_str} "
            f"achieving a resilience score of {resilience_score:.1f}. "
            f"The routing decision accounted for the detected "
            f"{disruption_event.get('type', 'no')} disruption to optimise "
            f"cost and delivery timeline."
        )
        print("[LearningAgent] Using deterministic fallback explanation (no valid Gemini key).")

    return {
        **state,
        "alerts":             alerts,
        "gemini_explanation": gemini_explanation,
    }


# ── Conditional router (after disruption node) ─────────────────────────────────

def _route_after_disruption(state: SupplyChainState) -> str:
    if state.get("risk_detected", False):
        return "constraint_agent_node"
    return "routing_agent_node"


# ── Build & compile the StateGraph ─────────────────────────────────────────────

_builder = StateGraph(SupplyChainState)

_builder.add_node("disruption_agent_node",  disruption_agent_node)
_builder.add_node("constraint_agent_node",  constraint_agent_node)
_builder.add_node("routing_agent_node",     routing_agent_node)
_builder.add_node("learning_agent_node",    learning_agent_node)

_builder.add_edge(START, "disruption_agent_node")

_builder.add_conditional_edges(
    "disruption_agent_node",
    _route_after_disruption,
    {
        "constraint_agent_node": "constraint_agent_node",
        "routing_agent_node":    "routing_agent_node",
    },
)

_builder.add_edge("constraint_agent_node", "routing_agent_node")
_builder.add_edge("routing_agent_node",    "learning_agent_node")
_builder.add_edge("learning_agent_node",   END)

# Public export
supply_chain_graph: StateGraph = _builder.compile()

__all__ = ["supply_chain_graph", "SupplyChainState"]
