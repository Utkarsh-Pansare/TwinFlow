export const DUMMY_SHIPMENTS = [
  { id: 'SHP-001', origin: 'Mumbai', destination: 'Guwahati', mode: 'air', status: 'at-risk', eta: '2025-06-03', resilience: 42, risk: 'High', co2: 1240, cost: 48500, carrier: 'IndiGo Cargo', priority: 'Critical' },
  { id: 'SHP-002', origin: 'Delhi', destination: 'Bangalore', mode: 'air', status: 'delayed', eta: '2025-06-02', resilience: 61, risk: 'Medium', co2: 890, cost: 32000, carrier: 'Blue Dart', priority: 'High' },
  { id: 'SHP-003', origin: 'Chennai', destination: 'Rotterdam', mode: 'ocean', status: 'on-track', eta: '2025-06-18', resilience: 88, risk: 'Low', co2: 3200, cost: 85000, carrier: 'Maersk', priority: 'Normal' },
  { id: 'SHP-004', origin: 'Nhava Sheva', destination: 'Singapore', mode: 'ocean', status: 'on-track', eta: '2025-06-08', resilience: 92, risk: 'Low', co2: 1800, cost: 62000, carrier: 'MSC', priority: 'Normal' },
  { id: 'SHP-005', origin: 'Pune', destination: 'Mumbai', mode: 'road', status: 'in-transit', eta: '2025-06-01', resilience: 95, risk: 'Low', co2: 145, cost: 8500, carrier: 'Delhivery', priority: 'Normal' },
  { id: 'SHP-006', origin: 'Hyderabad', destination: 'Dubai', mode: 'air', status: 'on-track', eta: '2025-06-04', resilience: 78, risk: 'Low', co2: 2100, cost: 95000, carrier: 'Air India Cargo', priority: 'High' },
  { id: 'SHP-007', origin: 'Kolkata', destination: 'Bangkok', mode: 'ocean', status: 'at-risk', eta: '2025-06-12', resilience: 34, risk: 'Critical', co2: 1560, cost: 41000, carrier: 'Evergreen', priority: 'Critical' },
  { id: 'SHP-008', origin: 'Ahmedabad', destination: 'Surat', mode: 'road', status: 'delivered', eta: '2025-05-31', resilience: 99, risk: 'None', co2: 88, cost: 4200, carrier: 'DTDC', priority: 'Low' },
]

export const DUMMY_ALERTS = [
  { id: 'ALT-001', type: 'Severe Weather', shipmentId: 'SHP-001', severity: 'High', detectedAt: '10:30 AM', impact: 'ETA Delay 2-3 days', action: 'Reroute', description: 'Cyclone forecast in Bay of Bengal affecting air corridor' },
  { id: 'ALT-002', type: 'Port Congestion', shipmentId: 'SHP-007', severity: 'Critical', detectedAt: '09:15 AM', impact: 'ETA Delay 4-5 days', action: 'Hold Shipment', description: 'Bangkok port congestion, 300+ vessels queued' },
  { id: 'ALT-003', type: 'Carrier Delay', shipmentId: 'SHP-002', severity: 'Medium', detectedAt: '08:45 AM', impact: 'ETA Delay 1 day', action: 'Notify Customer', description: 'Blue Dart capacity crunch, flight canceled' },
  { id: 'ALT-004', type: 'Customs Hold', shipmentId: 'SHP-003', severity: 'Medium', detectedAt: '07:20 AM', impact: 'ETA Delay 2 days', action: 'Review Plan', description: 'Documentation incomplete at Rotterdam customs' },
]

export const DUMMY_AGENTS = [
  { id: 'disruption', name: 'Disruption Agent', icon: 'zap', status: 'idle', lastRun: '2 min ago', lastAction: 'Cyclone risk detected for SHP-001, severity 8.4', successRate: 94, runsToday: 142, tech: 'Vertex AI + XGBoost' },
  { id: 'constraint', name: 'Constraint Agent', icon: 'filter', status: 'idle', lastRun: '2 min ago', lastAction: 'Filtered 12 routes, 3 passed constraints for SHP-001', successRate: 98, runsToday: 89, tech: 'Google OR-Tools' },
  { id: 'routing', name: 'Routing Agent', icon: 'route', status: 'idle', lastRun: '2 min ago', lastAction: 'Optimal route: Mumbai→Hyderabad road + air to Guwahati', successRate: 91, runsToday: 89, tech: 'OR-Tools + Maps API' },
  { id: 'learning', name: 'Learning Agent', icon: 'brain', status: 'idle', lastRun: '5 min ago', lastAction: 'Updated XGBoost model with 23 new outcomes, acc +0.3%', successRate: 87, runsToday: 34, tech: 'Vertex AI + LangGraph' },
]

export const DUMMY_SUPPLIERS = [
  { id: 'SUP-001', name: 'Mumbai Freight Co.', onTimeRate: 94, capacity: 78, riskScore: 12, reliability: 'High', trend: [88,90,92,91,94,94] },
  { id: 'SUP-002', name: 'Chennai Logistics', onTimeRate: 76, capacity: 45, riskScore: 38, reliability: 'Medium', trend: [80,78,75,74,76,76] },
  { id: 'SUP-003', name: 'Delhi Air Cargo', onTimeRate: 88, capacity: 91, riskScore: 18, reliability: 'High', trend: [82,85,86,88,88,89] },
  { id: 'SUP-004', name: 'Kolkata Shipping', onTimeRate: 61, capacity: 30, riskScore: 72, reliability: 'Low', trend: [70,68,64,63,61,61] },
]

export const DUMMY_TWINS: Record<string, { lat: number; lng: number; speed: string; altitude: string; lastEvent: string; eta: string; executionStatus: string; currentSegment: string }> = {
  'SHP-001': { lat: 19.076, lng: 72.877, speed: '820 km/h', altitude: '35,000 ft', lastEvent: 'Weather alert issued', eta: '2025-06-03T14:30:00', executionStatus: 'disrupted', currentSegment: 'Mumbai → Hyderabad (Road)' },
  'SHP-002': { lat: 28.644, lng: 77.216, speed: '0 km/h', altitude: 'Ground', lastEvent: 'Flight canceled, rebooking', eta: '2025-06-02T09:00:00', executionStatus: 'delayed', currentSegment: 'Delhi Airport — Holding' },
  'SHP-003': { lat: 12.972, lng: 80.243, speed: '22 knots', altitude: 'Sea level', lastEvent: 'Departed Chennai port', eta: '2025-06-18T08:00:00', executionStatus: 'normal', currentSegment: 'Indian Ocean — Open Sea' },
}

export const DUMMY_FINANCIALS = [
  { shipmentId: 'SHP-001', baseCost: 38000, fuelSurcharge: 4200, customs: 1800, lastMile: 4500, total: 48500, margin: 14.2 },
  { shipmentId: 'SHP-002', baseCost: 26000, fuelSurcharge: 2800, customs: 0, lastMile: 3200, total: 32000, margin: 18.6 },
  { shipmentId: 'SHP-003', baseCost: 72000, fuelSurcharge: 6500, customs: 4200, lastMile: 2300, total: 85000, margin: 22.1 },
]

export const DUMMY_AGENT_LOG = [
  { time: '14:32:01', agent: 'DisruptionAgent', level: 'danger', message: 'Cyclone risk detected for SHP-001, severity 8.4/10' },
  { time: '14:32:02', agent: 'ConstraintAgent', level: 'warning', message: 'Running constraint check — 15 candidate routes' },
  { time: '14:32:03', agent: 'RoutingAgent', level: 'info', message: 'OR-Tools VRP solver started for SHP-001' },
  { time: '14:32:04', agent: 'RoutingAgent', level: 'success', message: 'Optimal route found: Mumbai→Hyd road + Hyd→Guwahati air' },
  { time: '14:32:05', agent: 'LearningAgent', level: 'info', message: 'Storing outcome for model update batch #342' },
  { time: '14:28:11', agent: 'DisruptionAgent', level: 'warning', message: 'Port congestion detected at Bangkok — SHP-007 impacted' },
  { time: '14:28:12', agent: 'ConstraintAgent', level: 'danger', message: 'No valid routes found — triggering Loop B regen' },
  { time: '14:28:15', agent: 'ConstraintAgent', level: 'success', message: 'Alternative route via Colombo port found, resilience 71' },
  { time: '14:20:00', agent: 'LearningAgent', level: 'info', message: 'Model retrained with 23 new outcomes, acc: 91.4% (+0.3%)' },
]

export const DUMMY_ANALYTICS = {
  onTimeDelivery: [
    { date: 'May 15', rate: 88 }, { date: 'May 17', rate: 90 }, { date: 'May 19', rate: 87 },
    { date: 'May 21', rate: 91 }, { date: 'May 23', rate: 89 }, { date: 'May 25', rate: 92 }, { date: 'May 27', rate: 94 },
  ],
  disruptionTypes: [
    { name: 'Weather', value: 38 }, { name: 'Congestion', value: 27 },
    { name: 'Customs', value: 21 }, { name: 'Last Mile', value: 14 },
  ],
  costByMode: [
    { mode: 'Ocean', cost: 285000 }, { mode: 'Air', cost: 412000 },
    { mode: 'Road', cost: 98000 }, { mode: 'Multi-modal', cost: 167000 },
  ],
  co2ByMode: [
    { mode: 'Ocean', co2: 8400 }, { mode: 'Air', co2: 24800 },
    { mode: 'Road', co2: 1240 }, { mode: 'Multi-modal', co2: 6200 },
  ],
}
