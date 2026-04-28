import React, { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'

const LandingPage = lazy(() => import('./pages/landing/LandingPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const SignupPage = lazy(() => import('./pages/auth/SignupPage'))
const DashboardPage = lazy(() => import('./pages/app/DashboardPage'))
const ShipmentsPage = lazy(() => import('./pages/app/ShipmentsPage'))
const AIPlanner = lazy(() => import('./pages/app/AIPlanner'))
const DigitalTwinsPage = lazy(() => import('./pages/app/DigitalTwinsPage'))
const AgentsPage = lazy(() => import('./pages/app/AgentsPage'))
const SimulatorPage = lazy(() => import('./pages/app/SimulatorPage'))
const AnalyticsPage = lazy(() => import('./pages/app/AnalyticsPage'))
const DockConsole = lazy(() => import('./pages/app/DockConsole'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authed = localStorage.getItem('tf_authed')
  return authed ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="shipments" element={<ShipmentsPage />} />
        <Route path="ai-planner" element={<AIPlanner />} />
        <Route path="twins" element={<DigitalTwinsPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="simulator" element={<SimulatorPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="dock-console" element={<DockConsole />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
