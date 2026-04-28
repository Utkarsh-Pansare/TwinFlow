import { useEffect, useMemo, useState } from 'react'
import { Play, RotateCcw, Zap, MapPin, Route, ShieldCheck, Signal, Clock3 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import { fetchDemoScenarios, fetchDemoState, resetDemoScenario, startDemoScenario, type DemoScenarioState, type ScenarioSummary, type RouteOption, type ScenarioId } from '../../api/demo'

const LEVEL_STYLES: Record<'info' | 'warning' | 'success' | 'danger', string> = {
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
}

function formatTime(value: number) {
  return `${Math.max(0, Math.round(value / 1000))}s`
}

function RouteOptionCard({ option }: { option: RouteOption }) {
  return (
    <div className={`rounded-2xl border p-4 transition-all ${option.viable ? 'border-slate-200 bg-white' : 'border-rose-200 bg-rose-50/60'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{option.label}</p>
          <p className="text-xs text-slate-500 mt-1">{option.reason}</p>
        </div>
        <Badge variant={option.viable ? 'success' : 'danger'}>{option.viable ? 'Valid' : 'Rejected'}</Badge>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-xl bg-slate-50 p-2">
          <p className="text-slate-400">Cost</p>
          <p className="font-semibold text-slate-900">{option.cost}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <p className="text-slate-400">ETA</p>
          <p className="font-semibold text-slate-900">{option.eta}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <p className="text-slate-400">Risk</p>
          <p className="font-semibold text-slate-900">{option.risk}</p>
        </div>
      </div>
      {option.recommended && <div className="mt-3 text-xs font-medium text-emerald-700">Recommended by the solver</div>}
    </div>
  )
}

export default function SimulatorPage() {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([])
  const [state, setState] = useState<DemoScenarioState | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyScenario, setBusyScenario] = useState<ScenarioId | null>(null)
  const [pollingEnabled, setPollingEnabled] = useState(true)

  const activeScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === state?.scenario?.id) ?? null,
    [scenarios, state?.scenario?.id],
  )

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [scenarioList, currentState] = await Promise.all([
        fetchDemoScenarios(),
        fetchDemoState(),
      ])

      setScenarios(scenarioList)
      setState(currentState)
    } catch (error) {
      toast.error('Demo backend is not available yet.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const refreshState = async () => {
    try {
      const currentState = await fetchDemoState()
      setState(currentState)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (!pollingEnabled) {
      return undefined
    }

    const interval = window.setInterval(() => {
      void refreshState()
    }, 2000)

    return () => window.clearInterval(interval)
  }, [pollingEnabled])

  async function handleStartScenario(scenarioId: ScenarioId) {
    setBusyScenario(scenarioId)
    try {
      const nextState = await startDemoScenario(scenarioId)
      setState(nextState)
      toast.success('Scenario started from the backend.')
    } catch (error) {
      toast.error('Could not start the scenario.')
      console.error(error)
    } finally {
      setBusyScenario(null)
    }
  }

  async function handleReset() {
    try {
      const nextState = await resetDemoScenario()
      setState(nextState)
      toast.message('Demo reset to idle.')
    } catch (error) {
      toast.error('Reset failed.')
      console.error(error)
    }
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Scenario Lab"
        subtitle="Five backend-driven demo cases with dynamic shipment state, route decisions, and live rerouting."
        actions={(
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPollingEnabled((value) => !value)}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all ${pollingEnabled ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
            >
              <Zap size={15} />
              {pollingEnabled ? 'Live polling on' : 'Live polling off'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all"
            >
              <RotateCcw size={15} />
              Reset
            </button>
          </div>
        )}
      />

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
            <p className="font-semibold text-slate-900 mb-2">Backend-driven scenarios</p>
            <p className="text-sm text-slate-500">Select a case below and the backend will simulate the story in real time.</p>
            <div className="mt-4 space-y-2">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => void handleStartScenario(scenario.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${state?.scenario?.id === scenario.id ? 'border-orange-300 bg-orange-50/60 ring-2 ring-orange-100' : 'border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/40'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{scenario.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{scenario.subtitle}</p>
                    </div>
                    <Badge variant={state?.scenario?.id === scenario.id ? 'warning' : 'neutral'}>{scenario.highlight}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{scenario.stageCount} stages</span>
                    <span className="font-medium text-slate-700">{busyScenario === scenario.id ? 'Starting...' : 'Run demo'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Run status</p>
                <p className="text-xs text-slate-500">{state?.scenario?.title ?? 'No scenario running'}</p>
              </div>
              <Badge variant={state?.run.completed ? 'success' : state?.active ? 'info' : 'neutral'}>
                {state?.run.completed ? 'Complete' : state?.active ? 'Running' : 'Idle'}
              </Badge>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Progress</span>
                <span>{state ? `${state.run.progress}%` : '0%'}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all" style={{ width: `${state?.run.progress ?? 0}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-slate-400 text-xs flex items-center gap-1"><Clock3 size={12} /> Elapsed</p>
                <p className="font-semibold text-slate-900 mt-1">{state ? formatTime(state.run.elapsedMs) : '0s'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-slate-400 text-xs flex items-center gap-1"><ShieldCheck size={12} /> Stage</p>
                <p className="font-semibold text-slate-900 mt-1">{state ? `${state.run.stageIndex + 1}/${activeScenario?.stageCount ?? 0}` : '0/0'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
            <p className="font-semibold text-slate-900 mb-4">Shipment snapshot</p>
            {state?.shipment ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-slate-900">{state.shipment.id}</span>
                  <Badge auto>{state.shipment.status}</Badge>
                </div>
                <p className="text-slate-600">{state.shipment.origin} → {state.shipment.destination}</p>
                <p className="text-slate-600">Mode: {state.shipment.mode}</p>
                <p className="text-slate-600">Resilience: {state.shipment.resilience}%</p>
                <p className="text-slate-600">ETA: {new Date(state.shipment.eta).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                <p className="text-slate-600 flex items-center gap-2"><Signal size={14} /> {state.shipment.signalStatus}</p>
                <p className="text-slate-700 rounded-xl bg-slate-50 p-3">{state.shipment.disruption ?? state.shipment.route}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Start a scenario to see the live shipment state.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
            <p className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><MapPin size={16} className="text-orange-500" /> Map focus</p>
            {state?.map ? (
              <div className="space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Location mode</p>
                  <p className="font-semibold text-slate-900 mt-1">{state.map.mode === 'estimated' ? 'Digital Twin estimation' : state.map.mode === 'gps' ? 'Live GPS' : 'Route view'}</p>
                </div>
                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-900 mb-2">{state.map.focusLabel}</p>
                  {state.map.currentLocation && <p>GPS: {state.map.currentLocation.lat.toFixed(4)}, {state.map.currentLocation.lng.toFixed(4)}</p>}
                  {state.map.estimatedPosition && <p>Estimate: {state.map.estimatedPosition.lat.toFixed(4)}, {state.map.estimatedPosition.lng.toFixed(4)} · {state.map.estimatedPosition.confidence}% confidence</p>}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">The map focus will appear when a scenario starts.</p>
            )}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Current stage</p>
                <h2 className="text-2xl font-semibold text-slate-900 mt-1">{state?.run.stageTitle ?? 'Waiting for scenario start'}</h2>
                <p className="text-sm text-slate-500 mt-2 max-w-2xl">{state?.run.stageDetail ?? 'Select a scenario on the left and the backend will begin the story.'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={state ? 'warning' : 'neutral'}>{state?.scenario?.highlight ?? 'Ready'}</Badge>
                <Badge variant={state?.run.level === 'danger' ? 'danger' : state?.run.level === 'warning' ? 'warning' : state?.run.level === 'success' ? 'success' : 'info'}>
                  {state?.run.level ?? 'info'}
                </Badge>
              </div>
            </div>

            {state?.verdict && (
              <div className="mt-5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-orange-500 font-semibold">Decision</p>
                <p className="font-semibold text-slate-900 mt-1">{state.verdict.title}</p>
                <p className="text-sm text-slate-600 mt-1">{state.verdict.description}</p>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="font-semibold text-slate-900">Route options</p>
                  <p className="text-xs text-slate-500">Valid options are shown together with rejected ones when constraints fail.</p>
                </div>
                <Badge variant="neutral">{state?.routeOptions.length ?? 0} routes</Badge>
              </div>

              <div className="space-y-3">
                {state?.routeOptions.length ? (
                  state.routeOptions.map((option) => <RouteOptionCard key={option.id} option={option} />)
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                    Route options will appear after the scenario reaches the planning stage.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#0a0c10] rounded-2xl border border-slate-800 overflow-hidden text-white">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <div>
                  <p className="font-semibold">Live timeline</p>
                  <p className="text-xs text-slate-400">Backend updates every time the scenario advances.</p>
                </div>
                <Badge variant="neutral" className="bg-slate-900 text-slate-200 border-slate-700">{state?.timeline.length ?? 0} events</Badge>
              </div>
              <div className="max-h-[560px] overflow-y-auto divide-y divide-slate-800">
                <AnimatePresence initial={false}>
                  {state?.timeline.map((item, index) => (
                    <motion.div
                      key={`${item.title}-${index}`}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-5 py-4 flex items-start gap-3"
                    >
                      <span className="text-[11px] text-slate-400 mt-0.5 font-mono min-w-[68px]">{item.time}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${LEVEL_STYLES[item.level]}`}>{item.title}</span>
                          <span className="text-xs text-slate-400 capitalize">{item.level}</span>
                        </div>
                        <p className="text-sm text-slate-200 mt-2 leading-6">{item.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {!state?.timeline.length && (
                  <div className="px-5 py-8 text-sm text-slate-400">
                    Start a scenario and the timeline will begin streaming here.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { label: 'Stage index', value: state ? state.run.stageIndex + 1 : 0 },
              { label: 'Time elapsed', value: state ? formatTime(state.run.elapsedMs) : '0s' },
              { label: 'Route count', value: state?.routeOptions.length ?? 0 },
              { label: 'Scenario count', value: scenarios.length },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-2xl border border-slate-200 shadow-card p-4 text-center">
                <p className="text-2xl font-semibold text-orange-600">{item.value}</p>
                <p className="text-xs text-slate-400 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="mt-6 text-sm text-slate-500">Loading demo scenarios from the backend...</div>
      )}
    </div>
  )
}
