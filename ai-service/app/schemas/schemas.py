from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

# /plan
class PlanRequest(BaseModel):
    query: str = Field(..., min_length=3, description="Natural language query from user")

class PlanResponse(BaseModel):
    origin: str
    destination: str
    priority: str
    deadline_hours: int
    max_cost_inr: int
    preferred_mode: str
    constraints: List[str]
    summary: str

# /optimize
class NodeConstraint(BaseModel):
    deadline_h: int
    max_cost_inr: int
    forbidden_ids: List[str] = []

class NodeData(BaseModel):
    id: str
    lat: float
    lng: float

class OptimizeRequest(BaseModel):
    shipment_id: str
    nodes: List[NodeData]
    constraints: NodeConstraint

class RouteLeg(BaseModel):
    mode: str
    from_name: str = Field(alias="fromName", default="")
    to_name: str = Field(alias="toName", default="")
    from_loc: Dict[str, float] = Field(alias="from")
    to_loc: Dict[str, float] = Field(alias="to")
    distance_km: float = Field(alias="distanceMeters")
    eta_minutes: float = Field(alias="durationSeconds")
    polyline: Optional[str] = None
    
    class Config:
        populate_by_name = True

class OptimizeResponse(BaseModel):
    legs: List[Dict[str, Any]]
    totalEtaMinutes: float
    totalCostINR: float

# /score
class ScoreRequest(BaseModel):
    route: List[str]
    disruptions: List[str] = []
    weather_severity: float = 0.0
    congestion_level: float = 0.0

class ScoreResponse(BaseModel):
    score: float
    factors: List[str]
    disruptionRisk: Optional[Dict[str, Any]] = None

# /digipin/resolve
class DigipinRequest(BaseModel):
    address: str

class DigipinResponse(BaseModel):
    address: str
    lat: float
    lng: float
    digipin: str
    lastMileLeg: Optional[Dict[str, float]] = None

# /learn
class LearnRequest(BaseModel):
    route: List[str]
    final_outcome_score: float
    disruptions: List[str] = []
    total_distance_km: float = 0.0
    total_eta_minutes: float = 0.0
    cost_inr: float = 0.0
    mode: str = "road"

class LearnResponse(BaseModel):
    status: str
    message: str

# /agents/run
class AgentsRunRequest(BaseModel):
    shipment_id: str
    twin_data: Dict[str, Any]

class AgentsRunResponse(BaseModel):
    selected_route: List[str]
    resilience_score: float
    gemini_explanation: str
    alerts: List[str]
    route_legs: List[Dict[str, Any]]
    disruptionRisk: Optional[Dict[str, Any]] = None
    recommendation: Optional[str] = None
    # New fields from LangGraph SupplyChainState
    co2_kg: Optional[float] = None
    risk_detected: Optional[bool] = None
