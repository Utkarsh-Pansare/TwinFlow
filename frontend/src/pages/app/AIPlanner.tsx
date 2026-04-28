import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Map, ArrowRight, CheckCircle, AlertTriangle, Truck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import ModeIcon from '../../components/ui/ModeIcon'
import ResilienceBar from '../../components/ui/ResilienceBar'
import { queryAIPlanner } from '../../api/client'
import { formatCurrency } from '../../lib/utils'

interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }
interface RouteResult { origin: string; destination: string; mode: string; eta: string; cost: number; co2: number; resilience: number; explanation: string[]; constraints: string[] }

const SUGGESTED_PROMPTS = [
  'Critical pharma from Mumbai to Guwahati within 48 hours, under ₹50,000, avoid Assam flood zone',
  'Worldwide Logistics route renegotiation for Pooler, GA to Lebec, CA with lower risk and better rate',
]

const DUMMY_RESPONSE = {
  text: 'Route recomputed. Exception detected on origin milestone and fallback carrier negotiation is available.',
  route: { origin: 'Pooler, GA', destination: 'Lebec, CA', mode: 'road', eta: '2026-05-03', cost: 678, co2: 1200, resilience: 82, explanation: ['Predicted +5 day delay on current lane', 'Alternative carrier provides better on-time confidence', 'AI updated milestones from missing to in-transit'], constraints: ['Budget cap passed', 'Delivery SLA passed', 'Exception workflow linked'] },
}

function TypingIndicator() {
  return <div className="flex gap-1.5 items-center px-4 py-3 bg-orange-50 rounded-2xl rounded-tl-sm w-fit">{[0,1,2].map(i => <motion.div key={i} className="w-2 h-2 bg-orange-400 rounded-full" animate={{y:[0,-4,0]}} transition={{duration:0.6,delay:i*0.15,repeat:Infinity}} />)}</div>
}

export default function AIPlanner() {
  const [messages, setMessages] = useState<Message[]>([{ id: '0', role: 'assistant', timestamp: new Date(), content: "AI agent online. I can resolve missing milestones, negotiate alternate carriers, and apply route corrections automatically." }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleSend(text?: string) {
    const msg = text ?? input
    if (!msg.trim() || loading) return
    setInput('')
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: msg, timestamp: new Date() }])
    setLoading(true)
    const result = await queryAIPlanner(msg)
    await new Promise(r => setTimeout(r, 1400))
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: result?.text ?? DUMMY_RESPONSE.text, timestamp: new Date() }])
    setRouteResult(result?.route ?? DUMMY_RESPONSE.route)
    setLoading(false)
  }

  return (
    <div className="page-enter h-[calc(100vh-120px)] flex flex-col">
      <PageHeader title="AI Planner + Exception Desk" subtitle="Dynamic route planning, milestone recovery, and carrier negotiation" />

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-[#0d1117] to-[#111827] text-white">
            <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><Truck size={14} className="text-orange-400" /> Agent Oversight</span><Badge variant="info">3 Live Routes</Badge></div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0b0f14]">
            {messages.map(msg => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-orange-500 text-white rounded-tr-sm' : 'bg-[#1a2230] text-slate-100 rounded-tl-sm border border-slate-700'}`}>{msg.content}</div>
              </motion.div>
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && <div className="px-6 pb-3 pt-2 bg-[#0b0f14]"><div className="flex flex-wrap gap-2">{SUGGESTED_PROMPTS.map(p => <button key={p} onClick={() => handleSend(p)} className="text-xs bg-orange-500/20 text-orange-200 border border-orange-500/30 rounded-lg px-3 py-1.5 hover:bg-orange-500/30 text-left">{p.slice(0, 70)}...</button>)}</div></div>}

          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="flex gap-3">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Ask AI to replan, negotiate, or fix milestones..." className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
              <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white px-4 py-3 rounded-xl"><Send size={16} /></button>
            </div>
          </div>
        </div>

        <div className="w-96 flex-shrink-0 space-y-4">
          {!routeResult ? <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8 text-center h-full flex flex-col items-center justify-center"><Map size={24} className="text-orange-400 mb-3" /><p className="font-semibold">Route results appear here</p></div> : (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
                <div className="flex items-center justify-between mb-3"><p className="font-semibold text-slate-900">Negotiated Route</p><Badge variant="success">AI Optimal</Badge></div>
                <div className="rounded-xl bg-[#0a0c10] text-white p-4 mb-4 map-grid">
                  <div className="flex items-center justify-between text-sm"><span>{routeResult.origin}</span><span className="text-orange-300">🚚 →</span><span>{routeResult.destination}</span></div>
                </div>
                <ModeIcon mode={routeResult.mode} />
                <div className="grid grid-cols-2 gap-3 mt-4"><div className="bg-slate-50 rounded-xl p-3"><p className="text-xs text-slate-400">New Rate</p><p className="font-bold text-slate-900 text-base">{formatCurrency(routeResult.cost, '$')}</p></div><div className="bg-slate-50 rounded-xl p-3"><p className="text-xs text-slate-400">CO₂</p><p className="font-bold text-slate-900 text-base">{routeResult.co2} kg</p></div></div>
                <div className="mt-4"><p className="text-xs text-slate-500 mb-1.5">Resilience Score</p><ResilienceBar score={routeResult.resilience} /></div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
                <p className="font-semibold text-slate-900 mb-3 text-sm flex items-center gap-2"><AlertTriangle size={14} className="text-orange-500" /> Constraint + Exception Validation</p>
                <div className="space-y-2">{routeResult.constraints.map(c => <div key={c} className="flex items-center gap-2 text-sm"><CheckCircle size={14} className="text-emerald-500" /><span>{c}</span></div>)}</div>
              </div>

              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl text-sm">Apply Negotiated Contract →</button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
