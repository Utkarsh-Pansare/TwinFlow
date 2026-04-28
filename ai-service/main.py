"""
TwinFlow AI Service — FastAPI entry point
==========================================

Endpoints
---------
  POST /plan                        NL → structured logistics plan
  POST /optimize                    OR-Tools VRP routing
  POST /score                       Resilience scoring (rule-based)
  GET  /health                      Health check

  POST /agents/run                  Full 4-node LangGraph pipeline
  POST /agents/learn                Record shipment outcome (learning loop)
  POST /internal/inject-disruption  Force a disruption + re-run pipeline (demo button)

  GET  /twins/supplier              3 hardcoded SupplierTwin objects
  GET  /twins/financial/{id}        FinancialTwin for a given shipment

Run with:
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import os
import random
import logging
from typing import Any, Dict, List, Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Import the compiled LangGraph ────────────────────────────────────────────
# agents.py lives in the same directory as this file; no package gymnastics needed.
from agents import supply_chain_graph, SupplyChainState

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("twinflow.ai")

# ═══════════════════════════════════════════════════════════════════════════════
# App
# ═══════════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="TwinFlow AI Service",
    description="LangGraph-powered supply chain decision engine",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════════
# Pydantic Schemas
# ═══════════════════════════════════════════════════════════════════════════════

# ── /plan ────────────────────────────────────────────────────────────────────
class PlanRequest(BaseModel):
    query: str = Field(..., min_length=3, description="Natural language logistics query")

# ── /optimize ────────────────────────────────────────────────────────────────
class OptimizeRequest(BaseModel):
    origin: str
    destination: str
    mode: str = "road"
    deadline_hours: int = 48

# ── /score ───────────────────────────────────────────────────────────────────
class ScoreRequest(BaseModel):
    shipment_id: str
    route: List[str] = []
    disruptions: List[str] = []
    weather_severity: float = 0.0
    congestion_level: float = 0.0

# ── /agents/run ──────────────────────────────────────────────────────────────
class AgentsRunRequest(BaseModel):
    shipment_id: str
    twin_data: Dict[str, Any]

class AgentsRunResponse(BaseModel):
    selected_route: List[str]
    resilience_score: float
    gemini_explanation: str
    alerts: List[str]
    co2_kg: float
    risk_detected: bool
    loop_b_attempts: int
    disruption_event: Dict[str, Any] = {}

# ── /agents/learn ────────────────────────────────────────────────────────────
class LearnRequest(BaseModel):
    shipment_id: str
    outcome: Dict[str, Any]

# ── /internal/inject-disruption ──────────────────────────────────────────────
class InjectDisruptionRequest(BaseModel):
    shipment_id: str
    type: str = Field(..., description="e.g. 'weather', 'congestion', 'port_strike'")
    severity: float = Field(..., ge=0, le=10, description="Severity 0–10")
    twin_data: Dict[str, Any] = Field(
        default_factory=lambda: {
            "origin": "Mumbai",
            "destination": "Delhi",
            "deadline_hours": 48,
            "currentLocation": {"lat": 19.076, "lng": 72.877},
        },
        description="Optional twin snapshot; defaults to Mumbai→Delhi",
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════════

def _build_initial_state(shipment_id: str, twin_data: Dict[str, Any]) -> SupplyChainState:
    """Return a zeroed-out SupplyChainState ready for graph invocation."""
    return {
        "shipment_id":        shipment_id,
        "twin_data":          twin_data,
        "risk_detected":      False,
        "disruption_event":   {},
        "candidate_routes":   [],
        "selected_route":     [],
        "resilience_score":   0.0,
        "gemini_explanation": "",
        "alerts":             [],
        "loop_b_attempts":    0,
        "co2_kg":             0.0,
    }


def _extract_response(final_state: SupplyChainState) -> Dict[str, Any]:
    """Map final graph state to the canonical API response dict."""
    alerts           = list(final_state.get("alerts",          []))
    loop_b_attempts  = int(final_state.get("loop_b_attempts",  0))

    if loop_b_attempts >= 1:
        alerts.append(
            "Loop B triggered: no valid constrained routes, re-generating alternatives"
        )

    return {
        "selected_route":     final_state.get("selected_route",    []),
        "resilience_score":   final_state.get("resilience_score",  0.0),
        "gemini_explanation": final_state.get("gemini_explanation", ""),
        "alerts":             alerts,
        "co2_kg":             final_state.get("co2_kg",            0.0),
        "risk_detected":      final_state.get("risk_detected",     False),
        "loop_b_attempts":    loop_b_attempts,
        "disruption_event":   final_state.get("disruption_event",  {}),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# POST /plan
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/plan", tags=["Core"])
async def create_plan(req: PlanRequest):
    """
    Parse a natural-language query into a structured logistics plan.
    Falls back to a sensible default when Gemini is unavailable.
    """
    try:
        import google.generativeai as genai

        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key or api_key.startswith("dummy"):
            raise ValueError("No valid Gemini API key")

        genai.configure(api_key=api_key)
        model  = genai.GenerativeModel("gemini-1.5-flash")
        prompt = (
            "You are a logistics AI. Parse the following query into JSON with keys: "
            "origin, destination, priority, deadline_hours (int), max_cost_inr (int), "
            "preferred_mode, constraints (list), summary.\n\n"
            f"Query: {req.query}\n\nRespond ONLY with valid JSON."
        )
        resp   = model.generate_content(prompt)
        import json, re
        text   = resp.text.strip()
        # Strip markdown code fences if present
        text   = re.sub(r"```(?:json)?", "", text).strip().strip("`").strip()
        return json.loads(text)

    except Exception as exc:
        log.warning(f"/plan fallback: {exc}")
        return {
            "origin":         "Mumbai",
            "destination":    "Delhi",
            "priority":       "High",
            "deadline_hours": 48,
            "max_cost_inr":   50000,
            "preferred_mode": "Road",
            "constraints":    ["48-hour deadline", "cost < ₹50k"],
            "summary":        "[FALLBACK] Default plan — Gemini unavailable.",
        }


# ═══════════════════════════════════════════════════════════════════════════════
# POST /optimize
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/optimize", tags=["Core"])
async def optimize_route(req: OptimizeRequest):
    """
    Simple OR-Tools CP-SAT route selector.
    Returns cost, ETA estimate, and the chosen hub path.
    """
    from ortools.sat.python import cp_model

    routes = [
        {"label": "A", "hub": "HUB-NORTH", "cost": 100, "time_h": 36},
        {"label": "B", "hub": "HUB-WEST",  "cost":  85, "time_h": 44},
        {"label": "C", "hub": "AIR-HUB",   "cost": 210, "time_h": 14},
    ]
    n = len(routes)

    model      = cp_model.CpModel()
    route_vars = [model.NewBoolVar(f"r{i}") for i in range(n)]
    model.Add(sum(route_vars) == 1)
    model.Add(
        sum(route_vars[i] * routes[i]["time_h"] for i in range(n))
        <= req.deadline_hours
    )
    model.Minimize(sum(route_vars[i] * routes[i]["cost"] for i in range(n)))

    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        chosen = next(
            (routes[i] for i in range(n) if solver.Value(route_vars[i]) == 1),
            routes[0],
        )
    else:
        chosen = routes[0]

    mode    = "air" if "AIR" in chosen["hub"] else req.mode
    co2_map = {"air": 0.82, "sea": 0.03, "road": 0.21}
    co2_kg  = 800 * co2_map.get(mode, 0.21)

    return {
        "origin":          req.origin,
        "destination":     req.destination,
        "selected_route":  [req.origin, chosen["hub"], req.destination],
        "mode":            mode,
        "estimated_cost":  chosen["cost"],
        "eta_hours":       chosen["time_h"],
        "co2_kg":          round(co2_kg, 2),
        "solver_status":   solver.StatusName(status),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# POST /score
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/score", tags=["Core"])
async def calculate_score(req: ScoreRequest):
    """Rule-based resilience scoring (0–100)."""
    score   = 100.0
    factors = []

    if len(req.route) > 5:
        score -= 10
        factors.append("Complex route (many waypoints)")

    if req.weather_severity > 0.5:
        penalty = req.weather_severity * 20
        score  -= penalty
        factors.append(f"High weather severity ({req.weather_severity:.2f}) −{penalty:.1f}pts")

    if req.congestion_level > 0.5:
        penalty = req.congestion_level * 15
        score  -= penalty
        factors.append(f"High congestion ({req.congestion_level:.2f}) −{penalty:.1f}pts")

    for d in req.disruptions:
        score -= 5
        factors.append(f"Disruption: {d}")

    score = round(max(0.0, min(100.0, score)), 2)
    log.info(f"/score  shipment={req.shipment_id}  score={score}")

    return {
        "shipment_id":      req.shipment_id,
        "score":            score,
        "factors":          factors,
        "disruption_count": len(req.disruptions),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# POST /agents/run  — Full LangGraph pipeline
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/agents/run", response_model=AgentsRunResponse, tags=["Agents"])
async def agents_run(req: AgentsRunRequest):
    """
    Invoke the 4-node LangGraph supply-chain pipeline:

      disruption_agent → [risk?] → constraint_agent → routing_agent → learning_agent → END
                               ↓ (no risk)
                       routing_agent → learning_agent → END
    """
    log.info(f"[/agents/run] Invoking pipeline for shipment={req.shipment_id}")
    initial_state = _build_initial_state(req.shipment_id, req.twin_data)

    try:
        # Use ainvoke for async-friendly execution inside FastAPI event loop
        final_state = await supply_chain_graph.ainvoke(initial_state)
        log.info(f"[/agents/run] Completed  shipment={req.shipment_id}  "
                 f"risk={final_state.get('risk_detected')}  "
                 f"route={final_state.get('selected_route')}")
    except Exception as exc:
        log.error(f"[/agents/run] Pipeline error: {exc}")
        raise HTTPException(status_code=500, detail=f"Agent pipeline failed: {exc}")

    return _extract_response(final_state)


# ═══════════════════════════════════════════════════════════════════════════════
# POST /agents/learn
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/agents/learn", tags=["Agents"])
async def agents_learn(req: LearnRequest):
    """
    Record a shipment outcome into the learning loop.

    In production this would write to BigQuery / a time-series store
    so the model can be periodically retrained. For now we log and ack.
    """
    log.info(
        f"[/agents/learn] Outcome recorded  "
        f"shipment={req.shipment_id}  outcome_keys={list(req.outcome.keys())}"
    )
    # TODO (production): await bigquery_client.insert(req.shipment_id, req.outcome)
    return {
        "status":      "recorded",
        "shipment_id": req.shipment_id,
        "message":     "Outcome logged for future model training.",
    }


# ═══════════════════════════════════════════════════════════════════════════════
# POST /internal/inject-disruption  — Demo "big red button"
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/internal/inject-disruption", response_model=AgentsRunResponse, tags=["Internal"])
async def inject_disruption(req: InjectDisruptionRequest):
    """
    Force a specific disruption event into the pipeline, bypassing the
    weather API check.  Useful for live demos and integration tests.

    Sets risk_detected=True and disruption_event directly, then runs the
    constraint → routing → learning nodes.
    """
    log.info(
        f"[/inject-disruption] Injecting  shipment={req.shipment_id}  "
        f"type={req.type}  severity={req.severity}"
    )

    # Build state with the disruption pre-injected — skip the disruption node
    initial_state = _build_initial_state(req.shipment_id, req.twin_data)
    initial_state["risk_detected"]    = True
    initial_state["disruption_event"] = {
        "type":     req.type,
        "severity": req.severity,
    }

    try:
        # Run the full graph; disruption_agent_node will see risk_detected=True
        # and the conditional edge will route to constraint_agent_node.
        # (The disruption node itself may overwrite with real weather, but since
        #  we pre-set risk_detected, the conditional still routes correctly even
        #  if weather is fine on the day.)
        final_state = await supply_chain_graph.ainvoke(initial_state)
        log.info(
            f"[/inject-disruption] Done  route={final_state.get('selected_route')}  "
            f"resilience={final_state.get('resilience_score')}"
        )
    except Exception as exc:
        log.error(f"[/inject-disruption] Pipeline error: {exc}")
        raise HTTPException(status_code=500, detail=f"Injection pipeline failed: {exc}")

    return _extract_response(final_state)


# ═══════════════════════════════════════════════════════════════════════════════
# GET /twins/supplier
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/twins/supplier", tags=["Digital Twins"])
async def get_supplier_twins():
    """Return 3 hardcoded SupplierTwin objects."""
    return {
        "suppliers": [
            {
                "id":                "SUP-PUNE-001",
                "name":              "Pune Auto Components",
                "city":              "Pune",
                "state":             "Maharashtra",
                "lat":               18.5204,
                "lng":               73.8567,
                "reliability_score": 91,
                "capacity_units":    1200,
                "lead_time_days":    3,
                "risk_flags":        [],
                "status":            "active",
                "last_updated":      "2026-04-28T00:00:00Z",
            },
            {
                "id":                "SUP-DELHI-002",
                "name":              "Delhi Industrial Supplies",
                "city":              "Delhi",
                "state":             "Delhi",
                "lat":               28.6139,
                "lng":               77.2090,
                "reliability_score": 74,
                "capacity_units":    950,
                "lead_time_days":    5,
                "risk_flags":        ["congestion_risk"],
                "status":            "at_risk",
                "last_updated":      "2026-04-28T00:00:00Z",
            },
            {
                "id":                "SUP-CHENNAI-003",
                "name":              "Chennai Textile Exports",
                "city":              "Chennai",
                "state":             "Tamil Nadu",
                "lat":               13.0827,
                "lng":               80.2707,
                "reliability_score": 88,
                "capacity_units":    800,
                "lead_time_days":    4,
                "risk_flags":        ["monsoon_exposure"],
                "status":            "active",
                "last_updated":      "2026-04-28T00:00:00Z",
            },
        ]
    }


# ═══════════════════════════════════════════════════════════════════════════════
# GET /twins/financial/{shipment_id}
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/twins/financial/{shipment_id}", tags=["Digital Twins"])
async def get_financial_twin(shipment_id: str):
    """
    Return a FinancialTwin for the given shipment.
    Numbers are representative post-disruption figures.
    """
    base_cost    = 42_000.0
    current_cost = 47_800.0
    delta_pct    = round((current_cost - base_cost) / base_cost * 100, 1)

    return {
        "shipment_id":        shipment_id,
        "currency":           "INR",
        "base_cost_inr":      base_cost,
        "current_cost_inr":   current_cost,
        "cost_delta_inr":     current_cost - base_cost,
        "cost_delta_pct":     delta_pct,
        "margin_pct":         12.4,
        "cost_delta_reason":  (
            "Route changed from road to air due to weather disruption, "
            f"+{delta_pct}% cost"
        ),
        "insurance_inr":      1_200.0,
        "duties_inr":         3_500.0,
        "last_recalculated":  "2026-04-28T00:00:00Z",
        "risk_exposure_inr":  round((current_cost - base_cost) * 1.5, 2),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# GET /health
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/health", tags=["Meta"])
async def health():
    """Service liveness probe."""
    return {
        "status":  "healthy",
        "service": "twinflow-ai",
        "version": "2.0.0",
        "graph_nodes": list(supply_chain_graph.nodes.keys()),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Dev entrypoint
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
