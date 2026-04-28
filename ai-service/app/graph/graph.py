"""
LangGraph Orchestration — Proactive Supply Chain Decision Pipeline (Day 5).

NEW FLOW:
  simulation → predictive_agent → (if risk) → route_agent → resilience → gemini → writer
                                  (if clear) → END
"""
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from ..agents.logic_agents import route_agent, resilience_agent, twin_writer
from ..agents.predictive_agent import predictive_agent
from ..agents.gemini_agent import GeminiAgent
from ..simulation.simulator import simulate_future


class SupplyChainState(TypedDict):
    shipment_id: str
    twin: Dict[str, Any]
    disruptions: List[str]
    candidate_routes: List[str]
    route_legs: List[Dict[str, Any]]
    resilience_scores: float
    selected_route: List[str]
    replan_needed: bool
    gemini_explanation: str
    origin_geo: Optional[Dict[str, Any]]
    dest_geo: Optional[Dict[str, Any]]
    total_duration_hours: float
    total_distance_km: float
    # Day 5 additions
    predictions: List[Dict[str, Any]]
    predicted_disruption: bool
    prediction_probability: float
    prediction_reason: str


# ── Simulation Node ────────────────────────────────────────────────────────────

def simulation_node(state: SupplyChainState):
    """Run forward simulation on the twin to project future states."""
    twin = state.get("twin", {})
    predictions = simulate_future(twin, horizon_minutes=60)
    state["predictions"] = predictions
    return state


# ── Gemini Explanation Node ────────────────────────────────────────────────────

def gemini_node(state: SupplyChainState):
    """Generate human-readable explanation for the selected route."""
    if not state.get("replan_needed"):
        return state

    agent = GeminiAgent()
    route = state.get("selected_route", [])
    score = state.get("resilience_scores", 0)
    dur_h = state.get("total_duration_hours", 0)
    dist_km = state.get("total_distance_km", 0)
    reason = state.get("prediction_reason", "")

    explanation = agent.explain_route(route, score, legs_summary={
        "total_hours": dur_h,
        "total_km": dist_km,
        "leg_count": len(state.get("route_legs", [])),
        "trigger": reason,
    })
    state["gemini_explanation"] = explanation
    return state


# ── Conditional Edge ───────────────────────────────────────────────────────────

def should_replan(state: SupplyChainState):
    """Route to replan if predictive agent flagged a risk."""
    if state.get("replan_needed"):
        return "replan"
    return "skip"


# ── Graph Builder ──────────────────────────────────────────────────────────────

def create_graph():
    """
    Build the proactive decision pipeline:
    simulation → predictive → [replan?] → route → resilience → gemini → writer → END
    """
    workflow = StateGraph(SupplyChainState)

    # Nodes
    workflow.add_node("simulation", simulation_node)
    workflow.add_node("predictive", predictive_agent)
    workflow.add_node("route", route_agent)
    workflow.add_node("resilience", resilience_agent)
    workflow.add_node("gemini", gemini_node)
    workflow.add_node("writer", twin_writer)

    # Entry
    workflow.set_entry_point("simulation")

    # Edges
    workflow.add_edge("simulation", "predictive")

    workflow.add_conditional_edges(
        "predictive",
        should_replan,
        {
            "replan": "route",
            "skip": END,
        },
    )

    workflow.add_edge("route", "resilience")
    workflow.add_edge("resilience", "gemini")
    workflow.add_edge("gemini", "writer")
    workflow.add_edge("writer", END)

    return workflow.compile()
