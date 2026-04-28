import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const AI_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export const aiApi = axios.create({
  baseURL: AI_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Intercept errors gracefully — fall back to dummy data
api.interceptors.response.use(
  res => res,
  err => {
    console.warn('[API] Backend unreachable, using dummy data:', err.message)
    return Promise.reject(err)
  }
)

export async function fetchShipments() {
  try { return (await api.get('/api/shipments')).data }
  catch { return null } // caller falls back to dummy
}

export async function fetchAlerts() {
  try { return (await api.get('/api/alerts')).data }
  catch { return null }
}

export async function triggerDisruption(shipmentId: string) {
  try {
    return (await api.post('/api/internal/inject-disruption', { shipmentId, type: 'cyclone', severity: 9 })).data
  } catch { return null }
}

export async function queryAIPlanner(message: string) {
  try { return (await aiApi.post('/plan', { message })).data }
  catch { return null }
}

export async function replanShipment(id: string) {
  try { return (await api.post(`/api/shipments/${id}/replan`)).data }
  catch { return null }
}
