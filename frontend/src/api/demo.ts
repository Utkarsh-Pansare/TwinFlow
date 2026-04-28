import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export type ScenarioId = 'normal-flow' | 'disruption' | 'constraint-failure' | 'mid-transit-change' | 'signal-loss'

export interface ScenarioSummary {
    id: ScenarioId
    title: string
    subtitle: string
    objective: string
    highlight: string
    stageCount: number
}

export interface RouteOption {
    id: string
    label: string
    cost: string
    eta: string
    risk: string
    viable: boolean
    reason: string
    recommended?: boolean
}

export interface DemoScenarioState {
    active: boolean
    scenario: ScenarioSummary | null
    run: {
        startedAt: string | null
        elapsedMs: number
        stageIndex: number
        stageTitle: string
        stageDetail: string
        progress: number
        completed: boolean
        level: 'info' | 'warning' | 'success' | 'danger'
    }
    shipment: {
        id: string
        origin: string
        destination: string
        mode: string
        status: string
        resilience: number
        eta: string
        signalStatus: string
        route: string
        currentLocation: { label: string; lat: number; lng: number }
        estimatedPosition?: { label: string; lat: number; lng: number; confidence: number }
        disruption?: string
    } | null
    routeOptions: RouteOption[]
    timeline: Array<{ time: string; title: string; detail: string; level: 'info' | 'warning' | 'success' | 'danger' }>
    verdict: { title: string; description: string; label: string }
    map: {
        center: { lat: number; lng: number }
        focusLabel: string
        mode: 'gps' | 'estimated' | 'route'
        currentLocation?: { lat: number; lng: number }
        estimatedPosition?: { lat: number; lng: number; confidence: number }
    }
}

const demoApi = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
})

export async function fetchDemoScenarios() {
    const response = await demoApi.get<{ data: ScenarioSummary[] }>('/demo/scenarios')
    return response.data.data
}

export async function fetchDemoState() {
    const response = await demoApi.get<{ data: DemoScenarioState }>('/demo/state')
    return response.data.data
}

export async function startDemoScenario(scenarioId: ScenarioId) {
    const response = await demoApi.post<{ data: DemoScenarioState }>('/demo/start', { scenarioId })
    return response.data.data
}

export async function resetDemoScenario() {
    const response = await demoApi.post<{ data: DemoScenarioState }>('/demo/reset')
    return response.data.data
}