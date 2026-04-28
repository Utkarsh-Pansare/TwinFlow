type ScenarioId =
    | 'normal-flow'
    | 'disruption'
    | 'constraint-failure'
    | 'mid-transit-change'
    | 'signal-loss';

type ScenarioLevel = 'info' | 'warning' | 'success' | 'danger';

interface RouteOption {
    id: string;
    label: string;
    cost: string;
    eta: string;
    risk: string;
    viable: boolean;
    reason: string;
    recommended?: boolean;
}

interface TimelineItem {
    time: string;
    title: string;
    detail: string;
    level: ScenarioLevel;
}

interface ShipmentSnapshot {
    id: string;
    origin: string;
    destination: string;
    mode: string;
    status: string;
    resilience: number;
    eta: string;
    signalStatus: string;
    route: string;
    currentLocation: {
        label: string;
        lat: number;
        lng: number;
    };
    estimatedPosition?: {
        label: string;
        lat: number;
        lng: number;
        confidence: number;
    };
    disruption?: string;
}

interface ScenarioStage {
    afterMs: number;
    title: string;
    detail: string;
    level: ScenarioLevel;
    shipmentPatch: Partial<ShipmentSnapshot>;
    routeOptions?: RouteOption[];
    recommendation: string;
}

interface ScenarioDefinition {
    id: ScenarioId;
    title: string;
    subtitle: string;
    objective: string;
    highlight: string;
    baseShipment: ShipmentSnapshot;
    stages: ScenarioStage[];
}

interface ScenarioSummary {
    id: ScenarioId;
    title: string;
    subtitle: string;
    objective: string;
    highlight: string;
    stageCount: number;
}

interface DemoScenarioState {
    active: boolean;
    scenario: ScenarioSummary | null;
    run: {
        startedAt: string | null;
        elapsedMs: number;
        stageIndex: number;
        stageTitle: string;
        stageDetail: string;
        progress: number;
        completed: boolean;
        level: ScenarioLevel;
    };
    shipment: ShipmentSnapshot | null;
    routeOptions: RouteOption[];
    timeline: TimelineItem[];
    verdict: {
        title: string;
        description: string;
        label: string;
    };
    map: {
        center: { lat: number; lng: number };
        focusLabel: string;
        mode: 'gps' | 'estimated' | 'route';
        currentLocation?: { lat: number; lng: number };
        estimatedPosition?: { lat: number; lng: number; confidence: number };
    };
}

const nowLabel = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const SCENARIOS: Record<ScenarioId, ScenarioDefinition> = {
    'normal-flow': {
        id: 'normal-flow',
        title: 'Scenario 1 - Normal Flow',
        subtitle: 'Shipment created, route selected, smooth delivery',
        objective: 'Show the baseline path with no disruption.',
        highlight: 'Baseline delivery',
        baseShipment: {
            id: 'SHP-NORMAL-001',
            origin: 'Mumbai',
            destination: 'Bangalore',
            mode: 'road',
            status: 'created',
            resilience: 96,
            eta: '2026-04-28T18:30:00.000Z',
            signalStatus: 'strong',
            route: 'Awaiting route selection',
            currentLocation: { label: 'Mumbai dispatch hub', lat: 19.076, lng: 72.8777 },
        },
        stages: [
            {
                afterMs: 0,
                title: 'Shipment created',
                detail: 'Order booked, twin initialized, and baseline route inputs locked.',
                level: 'info',
                shipmentPatch: {
                    status: 'created',
                    route: 'Awaiting route selection',
                },
                recommendation: 'Baseline captured for comparison.',
            },
            {
                afterMs: 2400,
                title: 'Route selected',
                detail: 'System selects the shortest feasible road route with no constraint violations.',
                level: 'success',
                shipmentPatch: {
                    status: 'planned',
                    route: 'Mumbai → Pune → Hubli → Bangalore',
                    resilience: 97,
                },
                routeOptions: [
                    {
                        id: 'normal-route',
                        label: 'Road corridor via Pune',
                        cost: '₹48,500',
                        eta: '7h 20m',
                        risk: 'Low',
                        viable: true,
                        recommended: true,
                        reason: 'Fastest option with no weather or budget issues.',
                    },
                ],
                recommendation: 'Proceed with the selected baseline route.',
            },
            {
                afterMs: 5200,
                title: 'Smooth delivery',
                detail: 'Shipment arrives on time and the digital twin closes the loop cleanly.',
                level: 'success',
                shipmentPatch: {
                    status: 'delivered',
                    route: 'Delivered on selected road route',
                    resilience: 99,
                },
                recommendation: 'No intervention needed. Baseline delivery confirmed.',
            },
        ],
    },
    disruption: {
        id: 'disruption',
        title: 'Scenario 2 - Disruption',
        subtitle: 'Weather/traffic issue appears, system detects it, picks the best alternate route',
        objective: 'Show the killer demo path with intelligent rerouting.',
        highlight: 'Main disruption demo',
        baseShipment: {
            id: 'SHP-DISRUPT-002',
            origin: 'Chennai',
            destination: 'Delhi',
            mode: 'multimodal',
            status: 'moving',
            resilience: 84,
            eta: '2026-04-29T10:15:00.000Z',
            signalStatus: 'strong',
            route: 'Chennai → Hyderabad → Delhi',
            currentLocation: { label: 'En route near Hyderabad', lat: 17.385, lng: 78.4867 },
        },
        stages: [
            {
                afterMs: 0,
                title: 'Shipment created',
                detail: 'Shipment leaves the origin and the twin starts tracking the live corridor.',
                level: 'info',
                shipmentPatch: {
                    status: 'moving',
                    route: 'Chennai → Hyderabad → Delhi',
                },
                recommendation: 'Track the live route and wait for the event trigger.',
            },
            {
                afterMs: 2200,
                title: 'Weather and traffic issue detected',
                detail: 'The system flags cyclone fallout near the coast and congestion on the preferred corridor.',
                level: 'warning',
                shipmentPatch: {
                    status: 'at-risk',
                    disruption: 'Weather and traffic issue detected near the primary corridor',
                    resilience: 71,
                },
                routeOptions: [
                    {
                        id: 'air-rush',
                        label: 'Air via Bengaluru',
                        cost: '₹93,200',
                        eta: '3h 10m',
                        risk: 'Low',
                        viable: true,
                        reason: 'Fast, but cost is high for this shipment.',
                    },
                    {
                        id: 'rail-road',
                        label: 'Rail-road via Nagpur',
                        cost: '₹58,400',
                        eta: '5h 50m',
                        risk: 'Medium',
                        viable: true,
                        recommended: true,
                        reason: 'Best balance of cost, time, and risk.',
                    },
                    {
                        id: 'coastal',
                        label: 'Coastal road detour',
                        cost: '₹61,000',
                        eta: '8h 40m',
                        risk: 'High',
                        viable: true,
                        reason: 'Safer weather window but longer transit time.',
                    },
                ],
                recommendation: 'Show alternate routes and keep the highest scoring option ready.',
            },
            {
                afterMs: 5200,
                title: 'Alternate routes shown',
                detail: 'The system filters all candidates and surfaces the best viable route to the operator.',
                level: 'info',
                shipmentPatch: {
                    status: 'replanning',
                    route: 'Evaluating alternates',
                    resilience: 76,
                },
                recommendation: 'Keep the route with the best cost/time/risk balance.',
            },
            {
                afterMs: 8600,
                title: 'Best route selected',
                detail: 'Rail-road hybrid is chosen and the shipment resumes with a better ETA than the disrupted route.',
                level: 'success',
                shipmentPatch: {
                    status: 'rerouted',
                    route: 'Rail-road via Nagpur → Delhi',
                    resilience: 86,
                },
                recommendation: 'Best route selected and pushed to execution.',
            },
        ],
    },
    'constraint-failure': {
        id: 'constraint-failure',
        title: 'Scenario 3 - Constraint Failure',
        subtitle: 'One route misses the deadline, another is too expensive, both are rejected',
        objective: 'Show that the engine can reject invalid options instead of guessing.',
        highlight: 'Constraint intelligence',
        baseShipment: {
            id: 'SHP-CONSTRAINT-003',
            origin: 'Pune',
            destination: 'Kolkata',
            mode: 'air',
            status: 'evaluating',
            resilience: 74,
            eta: '2026-04-29T08:00:00.000Z',
            signalStatus: 'strong',
            route: 'Awaiting constraint evaluation',
            currentLocation: { label: 'Pune staging yard', lat: 18.5204, lng: 73.8567 },
        },
        stages: [
            {
                afterMs: 0,
                title: 'Shipment created',
                detail: 'Order arrives with a hard deadline and strict budget cap.',
                level: 'info',
                shipmentPatch: {
                    status: 'evaluating',
                },
                recommendation: 'Run the constraint filter before any route is accepted.',
            },
            {
                afterMs: 2000,
                title: 'Constraint checks running',
                detail: 'The solver checks deadline, cost, and transfer limits against all candidates.',
                level: 'warning',
                shipmentPatch: {
                    status: 'constraint-check',
                    route: 'Testing candidate routes',
                },
                routeOptions: [
                    {
                        id: 'deadline-breaker',
                        label: 'Express air via Delhi',
                        cost: '₹84,000',
                        eta: '4h 10m',
                        risk: 'Low',
                        viable: false,
                        reason: 'Rejected because it still misses the hard delivery deadline.',
                    },
                    {
                        id: 'premium-charter',
                        label: 'Private charter via Chennai',
                        cost: '₹1,16,000',
                        eta: '3h 40m',
                        risk: 'Low',
                        viable: false,
                        reason: 'Rejected because the cost exceeds the allowed budget.',
                    },
                    {
                        id: 'hybrid-backup',
                        label: 'Hybrid road + rail fallback',
                        cost: '₹57,500',
                        eta: '6h 30m',
                        risk: 'Medium',
                        viable: true,
                        recommended: true,
                        reason: 'Only route that satisfies both deadline and cost constraints.',
                    },
                ],
                recommendation: 'Reject the first two routes and keep the hybrid fallback.',
            },
            {
                afterMs: 5200,
                title: 'Invalid routes rejected',
                detail: 'The system proves the rejection path by keeping only the valid candidate alive.',
                level: 'danger',
                shipmentPatch: {
                    status: 'rejected',
                    route: 'Invalid routes removed from the plan',
                    resilience: 68,
                },
                recommendation: 'Avoid guessing: only the valid route can proceed.',
            },
            {
                afterMs: 7600,
                title: 'Fallback approved',
                detail: 'The engine selects the only route that passes the constraints and prepares it for dispatch.',
                level: 'success',
                shipmentPatch: {
                    status: 'approved',
                    route: 'Hybrid road + rail fallback',
                    resilience: 79,
                },
                recommendation: 'Proceed with the verified fallback route.',
            },
        ],
    },
    'mid-transit-change': {
        id: 'mid-transit-change',
        title: 'Scenario 4 - Mid-transit Change',
        subtitle: 'Shipment is already moving and a new issue forces live rerouting',
        objective: 'Show adaptive rerouting while the shipment is already on the move.',
        highlight: 'Live adaptation',
        baseShipment: {
            id: 'SHP-REPLAN-004',
            origin: 'Ahmedabad',
            destination: 'Hyderabad',
            mode: 'road',
            status: 'in-transit',
            resilience: 88,
            eta: '2026-04-28T23:30:00.000Z',
            signalStatus: 'strong',
            route: 'Ahmedabad → Nashik → Hyderabad',
            currentLocation: { label: 'Near Nashik toll corridor', lat: 19.9975, lng: 73.7898 },
        },
        stages: [
            {
                afterMs: 0,
                title: 'Shipment already moving',
                detail: 'Live tracking shows the shipment cruising on the original route.',
                level: 'info',
                shipmentPatch: {
                    status: 'in-transit',
                },
                recommendation: 'Watch the route until the new issue appears.',
            },
            {
                afterMs: 2300,
                title: 'New issue appears mid-transit',
                detail: 'A road closure forces the twin to pause the route and evaluate alternatives live.',
                level: 'warning',
                shipmentPatch: {
                    status: 'reroute-check',
                    disruption: 'Road closure detected after departure',
                    resilience: 74,
                },
                routeOptions: [
                    {
                        id: 'detour-west',
                        label: 'Western detour via Surat',
                        cost: '₹22,400',
                        eta: '2h 05m',
                        risk: 'Medium',
                        viable: true,
                        reason: 'Short detour with acceptable delay.',
                    },
                    {
                        id: 'rail-switch',
                        label: 'Switch to rail at Vadodara',
                        cost: '₹25,800',
                        eta: '1h 40m',
                        risk: 'Low',
                        viable: true,
                        recommended: true,
                        reason: 'Fastest safe option after the disruption.',
                    },
                ],
                recommendation: 'Select the live reroute that keeps the shipment moving.',
            },
            {
                afterMs: 5600,
                title: 'Live reroute applied',
                detail: 'The shipment is re-planned in transit and continues on the new leg immediately.',
                level: 'success',
                shipmentPatch: {
                    status: 'rerouted',
                    route: 'Vadodara rail handoff → Hyderabad',
                    resilience: 82,
                },
                recommendation: 'Live reroute confirmed. Continue tracking the updated leg.',
            },
            {
                afterMs: 8600,
                title: 'Adaptive delivery continues',
                detail: 'The twin proves it can absorb new issues without stopping the shipment.',
                level: 'success',
                shipmentPatch: {
                    status: 'moving',
                    resilience: 84,
                },
                recommendation: 'Adaptive system has recovered and is back on track.',
            },
        ],
    },
    'signal-loss': {
        id: 'signal-loss',
        title: 'Scenario 5 - Signal Loss',
        subtitle: 'GPS lost, digital twin switches to estimated position mode',
        objective: 'Show the unique Digital Twin estimation fallback when tracking disappears.',
        highlight: 'Digital twin estimation',
        baseShipment: {
            id: 'SHP-SIGNAL-005',
            origin: 'Kochi',
            destination: 'Delhi',
            mode: 'multimodal',
            status: 'tracking',
            resilience: 91,
            eta: '2026-04-29T07:15:00.000Z',
            signalStatus: 'strong',
            route: 'Kochi → Chennai → Delhi',
            currentLocation: { label: 'Southbound corridor near Salem', lat: 11.6643, lng: 78.146 },
        },
        stages: [
            {
                afterMs: 0,
                title: 'Tracking is healthy',
                detail: 'GPS and live telemetry are stable before the signal drop.',
                level: 'info',
                shipmentPatch: {
                    status: 'tracking',
                },
                recommendation: 'Keep the live GPS feed visible for the demo.',
            },
            {
                afterMs: 2200,
                title: 'Signal loss detected',
                detail: 'GPS disappears and the UI should switch to Digital Twin estimation immediately.',
                level: 'danger',
                shipmentPatch: {
                    status: 'signal-lost',
                    signalStatus: 'lost',
                    disruption: 'Tracking lost — switching to Digital Twin estimation',
                    resilience: 83,
                },
                recommendation: 'Surface the fallback message and hold the estimated position.',
            },
            {
                afterMs: 4800,
                title: 'Digital Twin estimation active',
                detail: 'The system predicts the most likely location and confidence score until the feed returns.',
                level: 'warning',
                shipmentPatch: {
                    status: 'estimated',
                    signalStatus: 'estimated',
                    estimatedPosition: {
                        label: 'Estimated on Salem bypass',
                        lat: 11.6658,
                        lng: 78.1492,
                        confidence: 87,
                    },
                    route: 'Estimated position from the twin model',
                },
                recommendation: 'Show the estimated position and confidence instead of a GPS pin.',
            },
            {
                afterMs: 7800,
                title: 'Signal recovered',
                detail: 'Tracking resumes after estimation and the shipment keeps moving toward delivery.',
                level: 'success',
                shipmentPatch: {
                    status: 'tracking-resumed',
                    signalStatus: 'strong',
                    route: 'GPS restored and tracking resumed',
                    resilience: 88,
                },
                recommendation: 'Recovery complete, keep the twin running from the live feed.',
            },
        ],
    },
};

let activeScenarioId: ScenarioId | null = null;
let startedAt: number | null = null;

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const getScenarioSummaries = (): ScenarioSummary[] => Object.values(SCENARIOS).map((scenario) => ({
    id: scenario.id,
    title: scenario.title,
    subtitle: scenario.subtitle,
    objective: scenario.objective,
    highlight: scenario.highlight,
    stageCount: scenario.stages.length,
}));

const buildTimeline = (stages: ScenarioStage[], currentIndex: number): TimelineItem[] =>
    stages.slice(0, currentIndex + 1).map((stage) => ({
        time: nowLabel(),
        title: stage.title,
        detail: stage.detail,
        level: stage.level,
    }));

const getCurrentStageIndex = (scenario: ScenarioDefinition, elapsedMs: number) => {
    const index = scenario.stages.reduce((currentIndex, stage, stageIndex) => (
        elapsedMs >= stage.afterMs ? stageIndex : currentIndex
    ), 0);

    return Math.min(index, scenario.stages.length - 1);
};

const buildShipmentSnapshot = (scenario: ScenarioDefinition, stageIndex: number): ShipmentSnapshot => {
    const snapshot = clone(scenario.baseShipment);

    scenario.stages.slice(0, stageIndex + 1).forEach((stage) => {
        Object.assign(snapshot, clone(stage.shipmentPatch));
    });

    return snapshot;
};

const getStageRouteOptions = (scenario: ScenarioDefinition, stageIndex: number): RouteOption[] => {
    for (let index = stageIndex; index >= 0; index -= 1) {
        const routeOptions = scenario.stages[index]?.routeOptions;
        if (routeOptions && routeOptions.length > 0) {
            return clone(routeOptions);
        }
    }

    return [];
};

const getScenarioState = (): DemoScenarioState => {
    if (!activeScenarioId || !startedAt) {
        return {
            active: false,
            scenario: null,
            run: {
                startedAt: null,
                elapsedMs: 0,
                stageIndex: 0,
                stageTitle: 'Select a scenario',
                stageDetail: 'Choose a demo flow to start the integration.',
                progress: 0,
                completed: false,
                level: 'info',
            },
            shipment: null,
            routeOptions: [],
            timeline: [],
            verdict: {
                title: 'Demo idle',
                description: 'Pick one of the five scenarios to begin the backend-driven demo.',
                label: 'Ready',
            },
            map: {
                center: { lat: 20, lng: 78 },
                focusLabel: 'No active scenario',
                mode: 'route',
            },
        };
    }

    const scenario = SCENARIOS[activeScenarioId];
    const elapsedMs = Date.now() - startedAt;
    const stageIndex = getCurrentStageIndex(scenario, elapsedMs);
    const stage = scenario.stages[stageIndex];
    const shipment = buildShipmentSnapshot(scenario, stageIndex);
    const routeOptions = getStageRouteOptions(scenario, stageIndex);
    const timeline = buildTimeline(scenario.stages, stageIndex);
    const completed = elapsedMs >= (scenario.stages.at(-1)?.afterMs ?? 0) + 1800;
    const progress = Math.min(100, Math.round((elapsedMs / ((scenario.stages.at(-1)?.afterMs ?? 1) + 1800)) * 100));

    return {
        active: true,
        scenario: {
            id: scenario.id,
            title: scenario.title,
            subtitle: scenario.subtitle,
            objective: scenario.objective,
            highlight: scenario.highlight,
            stageCount: scenario.stages.length,
        },
        run: {
            startedAt: new Date(startedAt).toISOString(),
            elapsedMs,
            stageIndex,
            stageTitle: stage.title,
            stageDetail: stage.detail,
            progress,
            completed,
            level: stage.level,
        },
        shipment,
        routeOptions,
        timeline,
        verdict: {
            title: stage.title,
            description: stage.recommendation,
            label: scenario.highlight,
        },
        map: {
            center: shipment.estimatedPosition
                ? { lat: shipment.estimatedPosition.lat, lng: shipment.estimatedPosition.lng }
                : { lat: shipment.currentLocation.lat, lng: shipment.currentLocation.lng },
            focusLabel: shipment.estimatedPosition?.label ?? shipment.currentLocation.label,
            mode: shipment.estimatedPosition ? 'estimated' : 'gps',
            currentLocation: shipment.signalStatus === 'lost' ? undefined : shipment.currentLocation,
            estimatedPosition: shipment.estimatedPosition
                ? {
                    lat: shipment.estimatedPosition.lat,
                    lng: shipment.estimatedPosition.lng,
                    confidence: shipment.estimatedPosition.confidence,
                }
                : undefined,
        },
    };
};

const startScenario = (scenarioId: ScenarioId) => {
    if (!SCENARIOS[scenarioId]) {
        throw new Error(`Unknown scenario: ${scenarioId}`);
    }

    activeScenarioId = scenarioId;
    startedAt = Date.now();

    return getScenarioState();
};

const resetScenario = () => {
    activeScenarioId = null;
    startedAt = null;

    return getScenarioState();
};

export const demoScenarios = {
    getScenarioSummaries,
    getScenarioState,
    startScenario,
    resetScenario,
};

export type { ScenarioId, DemoScenarioState, ScenarioSummary, RouteOption };