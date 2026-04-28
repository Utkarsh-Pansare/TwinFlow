"""
TwinFlow AI Decision Layer — FastAPI server.

Endpoints:
  POST /plan           — NL → plan via Gemini
  POST /optimize       — OR-Tools routing
  POST /score          — Resilience scoring
  POST /digipin/resolve— Address → Lat/Lng/DIGIPIN
  POST /agents/run     — Full LangGraph pipeline (4-node StateGraph)
"""
import os
import sys
import uuid
from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# ── New supply-chain graph (top-level agents.py) ─────────────────────────────
# We add the ai-service root to sys.path so that `import agents` resolves
# regardless of how uvicorn is launched.
_ai_service_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ai_service_root not in sys.path:
    sys.path.insert(0, _ai_service_root)

from agents import supply_chain_graph, SupplyChainState  # noqa: E402

from .graph.graph import create_graph
from .agents.gemini_agent import GeminiAgent
from .services.digipin import resolve_address
from .services.maps_client import get_multi_leg_route
from .services.ortools_solver import solve_route
from .routes import explain

from .schemas.schemas import (
    PlanRequest, PlanResponse,
    OptimizeRequest, OptimizeResponse,
    ScoreRequest, ScoreResponse,
    DigipinRequest, DigipinResponse,
    AgentsRunRequest, AgentsRunResponse
)

load_dotenv()

app = FastAPI(title="TwinFlow AI Decision Layer — Day 8")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(explain.router, prefix="/explain", tags=["Explanation"])

graph  = create_graph()   # legacy graph (used by internal nodes)
gemini = GeminiAgent()

# ── POST /plan ─────────────────────────────────────────────────────────────

@app.post("/plan", response_model=PlanResponse)
async def create_plan(req: PlanRequest):
    """Parse natural language into a structured logistics plan."""
    try:
        plan = gemini.parse_query(req.query)
        return plan.model_dump()
    except Exception as e:
        print(f"⚠️ Gemini fallback triggered: {e}")
        return {
            "origin": "Mumbai",
            "destination": "Guwahati",
            "priority": "High",
            "deadline_hours": 48,
            "max_cost_inr": 50000,
            "preferred_mode": "Air",
            "constraints": ["Pharma under ₹50k", "48 hours"],
            "summary": "[FALLBACK] Dummy route due to AI failure."
        }


# ── POST /optimize ─────────────────────────────────────────────────────────

@app.post("/optimize", response_model=OptimizeResponse)
async def optimize_route(req: OptimizeRequest):
    """Use OR-Tools to solve VRP and compute ETA/cost."""
    locations_for_solver = [(n.lat, n.lng) for n in req.nodes]
    
    # Solve TSP
    order = solve_route(locations_for_solver, req.constraints.forbidden_ids)
    if order:
        waypoints = [req.nodes[i] for i in order if i < len(req.nodes)]
    else:
        waypoints = req.nodes

    waypoints_dicts = [{"lat": w.lat, "lng": w.lng} for w in waypoints]
    legs = get_multi_leg_route(waypoints_dicts, mode="road")
    
    # Assign names
    for i, leg in enumerate(legs):
        leg["fromName"] = waypoints[min(i, len(waypoints) - 1)].id
        leg["toName"] = waypoints[min(i + 1, len(waypoints) - 1)].id

    total_dist_km = sum(l["distanceMeters"] for l in legs) / 1000
    total_dur_h = sum(l["durationSeconds"] for l in legs) / 3600

    # Basic cost calculation logic (can be refined)
    total_cost = total_dist_km * 50 # 50 INR per km

    return {
        "legs": legs,
        "totalEtaMinutes": total_dur_h * 60,
        "totalCostINR": total_cost
    }


# ── POST /score (ML Driven) ────────────────────────────────────────────────
from .services.predict import predict_disruption_risk

@app.post("/score", response_model=ScoreResponse)
async def calculate_score(req: ScoreRequest):
    """Calculate resilience score using XGBoost trained model and add predictive disruption."""
    factors = []

    if len(req.route) > 5:
        factors.append("Complex route (many waypoints)")
    
    if req.weather_severity > 0.5:
        factors.append(f"High weather severity ({req.weather_severity})")

    if req.congestion_level > 0.5:
        factors.append(f"High congestion ({req.congestion_level})")
        
    for disruption in req.disruptions:
        factors.append(f"Disruption: {disruption}")
        
    distance_km = 500.0
    eta_minutes = 600.0
    cost_inr = distance_km * 50
    mode = "road"
    
    from .models.resilience_model import ml_model
    score = ml_model.predict_score(
        distance_km=distance_km,
        disruptions_count=len(req.disruptions),
        weather_severity=req.weather_severity,
        congestion_level=req.congestion_level,
        mode=mode,
        cost_inr=cost_inr,
        eta_minutes=eta_minutes
    )
    
    # 3. Add Predictive Disruption
    prediction = await predict_disruption_risk(
        route=req.route, 
        weather={"condition": "unknown", "severity": req.weather_severity},
        mode=mode
    )

    return {
        "score": score,
        "factors": factors,
        "disruptionRisk": prediction
    }

# ── POST /learn ────────────────────────────────────────────────────────────
from .schemas.schemas import LearnRequest, LearnResponse
from .services import data_pipeline

@app.post("/learn", response_model=LearnResponse)
async def learn_from_route(req: LearnRequest):
    """Ingest outcome of a completed route into the DB for future training."""
    await data_pipeline.insert_historical_route(
        route=req.route,
        final_outcome_score=req.final_outcome_score,
        disruptions=req.disruptions,
        total_distance=req.total_distance_km,
        total_duration_minutes=req.total_eta_minutes,
        cost=req.cost_inr,
        mode=req.mode
    )
    return {"status": "success", "message": "Feedback recorded for learning"}


# ── POST /digipin/resolve ──────────────────────────────────────────────────

@app.post("/digipin/resolve", response_model=DigipinResponse)
async def resolve_digipin(req: DigipinRequest):
    """Resolve address to lat/lng and DIGIPIN."""
    geo = resolve_address(req.address)
    
    return {
        "address": geo.get("address", req.address),
        "lat": geo["lat"],
        "lng": geo["lng"],
        "digipin": geo.get("digipin", "UNKNOWN"),
        "lastMileLeg": None # Could add specific last mile routing here
    }


# ── POST /agents/run ───────────────────────────────────────────────────────

@app.post("/agents/run", response_model=AgentsRunResponse)
async def agents_run(req: AgentsRunRequest):
    """
    Full 4-node LangGraph pipeline:
      disruption_agent → [risk?] → constraint_agent
                               ↓ (no risk)
                       routing_agent → learning_agent → END
    """
    # Build initial SupplyChainState
    initial_state: SupplyChainState = {
        "shipment_id":       req.shipment_id,
        "twin_data":         req.twin_data,
        "risk_detected":     False,
        "disruption_event":  {},
        "candidate_routes":  [],
        "selected_route":    [],
        "resilience_score":  0.0,
        "gemini_explanation": "",
        "alerts":            [],
        "loop_b_attempts":   0,
        "co2_kg":            0.0,
    }

    try:
        final_state = supply_chain_graph.invoke(initial_state)
        print(f"[AgentsRun] Pipeline completed for {req.shipment_id}")
    except Exception as exc:
        print(f"⚠️ Agents fallback triggered: {exc}")
        origin      = req.twin_data.get("origin",      "Origin")
        destination = req.twin_data.get("destination", "Destination")
        return {
            "selected_route":    [origin, "HUB-NORTH", destination],
            "resilience_score":  85.0,
            "gemini_explanation": "[FALLBACK] Default route used due to pipeline error.",
            "alerts":            [f"Pipeline error: {exc}"],
            "route_legs":        [{
                "mode":            "road",
                "fromName":        origin,
                "toName":          destination,
                "from":            {"lat": 0, "lng": 0},
                "to":              {"lat": 0, "lng": 0},
                "distanceMeters":  800000,
                "durationSeconds": 28800,
            }],
            "disruptionRisk":    {"risk_factor": "Unknown", "probability": 0.0},
            "recommendation":    "Proceed with caution",
            "co2_kg":            168.0,
            "risk_detected":     False,
        }

    selected_route   = final_state.get("selected_route",    [])
    resilience_score = final_state.get("resilience_score",  85.0)
    alerts           = list(final_state.get("alerts",       []))
    co2_kg           = final_state.get("co2_kg",            0.0)
    risk_detected    = final_state.get("risk_detected",     False)
    disruption_event = final_state.get("disruption_event",  {})

    # ── Optional: predictive risk overlay ─────────────────────────────────
    try:
        prediction = await predict_disruption_risk(
            route=selected_route,
            weather={"condition": disruption_event.get("type", "unknown"),
                     "severity":  disruption_event.get("severity", 0.0)},
            mode=req.twin_data.get("mode", "road"),
        )
        if prediction["probability"] > 0.4:
            alerts.append(
                f"[PREDICTED RISK {prediction['probability']*100:.0f}%] "
                f"{prediction['risk_factor']}"
            )
    except Exception:
        prediction = {"risk_factor": "N/A", "probability": 0.0}

    recommendation = (
        "Consider alternative transport mode"
        if prediction.get("probability", 0) > 0.6
        else "Route is optimal — proceed with caution"
    )

    # Build route_legs from selected_route (lightweight representation)
    route_legs = []
    for i in range(len(selected_route) - 1):
        route_legs.append({
            "mode":            req.twin_data.get("mode", "road"),
            "fromName":        selected_route[i],
            "toName":          selected_route[i + 1],
            "from":            {"lat": 0, "lng": 0},
            "to":              {"lat": 0, "lng": 0},
            "distanceMeters":  400000,
            "durationSeconds": 14400,
        })

    return {
        "selected_route":     selected_route,
        "resilience_score":   resilience_score,
        "gemini_explanation": final_state.get("gemini_explanation", ""),
        "alerts":             alerts,
        "route_legs":         route_legs,
        "disruptionRisk":     prediction,
        "recommendation":     recommendation,
        "co2_kg":             co2_kg,
        "risk_detected":      risk_detected,
    }


# ── GET /health ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "AI Brain Active", "version": "day7-intelligence"}

# ── LIFECYCLE ──────────────────────────────────────────────────────────────────
from .db.database import db
from .models.resilience_model import ml_model
import asyncio

@app.on_event("startup")
async def startup_event():
    # 1. Connect to DB
    await db.connect()
    
    # 2. Initialize Schema
    await db.init_schema()
    
    # 3. Load or Train Model
    loaded = ml_model.load_model()
    if not loaded:
        # Train asynchronously so we don't block startup too long, or train synchronously if required.
        # Since the assignment asks to train if not found, we'll await it.
        await ml_model.train_model()

@app.on_event("shutdown")
async def shutdown_event():
    await db.disconnect()

