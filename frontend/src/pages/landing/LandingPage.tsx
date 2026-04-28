import { useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, OrbitControls, Stars } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import * as THREE from 'three'
import { Zap, Shield, Map, Brain, Leaf, TrendingUp, ArrowRight } from 'lucide-react'

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.08
  })
  return (
    <mesh ref={meshRef}>
      <Sphere args={[2.4, 64, 64]}>
        <meshPhongMaterial
          color="#1a365d"
          emissive="#0ea5e9"
          emissiveIntensity={0.08}
          wireframe={false}
          transparent
          opacity={0.92}
        />
      </Sphere>
      <Sphere args={[2.41, 32, 32]}>
        <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.08} />
      </Sphere>
      <Sphere args={[2.6, 32, 32]}>
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.03} side={THREE.BackSide} />
      </Sphere>
    </mesh>
  )
}

function RouteArcs() {
  const points = [
    [0.8, 1.2, 2.0],
    [-0.4, 1.8, 1.6],
    [1.4, 0.2, 2.0],
    [-2.1, 1.0, 0.8],
    [-2.2, 0.6, -1.0],
  ]
  const arcs = points.map(p => new THREE.Vector3(...(p as [number, number, number])))
  return (
    <>
      {arcs.map((point, i) => (
        <mesh key={i} position={point}>
          <Sphere args={[0.04, 8, 8]}>
            <meshBasicMaterial color="#6366f1" />
          </Sphere>
        </mesh>
      ))}
    </>
  )
}

const FEATURES = [
  { icon: Brain, title: 'Multi-Agent AI', desc: 'LangGraph orchestrates 4 agents: Disruption, Constraint, Routing, and Learning — in real-time parallel execution.' },
  { icon: Zap, title: 'Digital Twins', desc: '4 live twin types mirror every order, shipment, supplier, and financial state with millisecond sync via MongoDB Change Streams.' },
  { icon: Map, title: 'Smart Routing', desc: 'Google OR-Tools VRP solver with DIGIPIN last-mile resolution for Tier 2/3 Indian cities — zero address ambiguity.' },
  { icon: Shield, title: 'Proactive Alerts', desc: 'XGBoost resilience scoring + Open-Meteo real weather data detects disruptions before SLA breach.' },
  { icon: TrendingUp, title: 'Resilience Scoring', desc: 'Every route gets a live 0–100 resilience score. System auto-rereplans when score drops below threshold.' },
  { icon: Leaf, title: 'CO₂ Tracking', desc: 'Real-time carbon footprint per shipment and per transport mode. Compare routes by sustainability impact.' },
]

const STATS = [
  { label: 'Shipments Tracked', value: '12,847', suffix: '' },
  { label: 'Disruptions Prevented', value: '2,341', suffix: '' },
  { label: 'Avg Resilience Score', value: '91.4', suffix: '%' },
  { label: 'CO₂ Saved', value: '48.2', suffix: 't' },
]

const LAYERS = [
  { num: 1, name: 'Data Ingestion', desc: 'Carrier Feeds · Event Streams · AIS + Flight · Customs + Tariff · Spot Rates', color: 'bg-sky-500' },
  { num: 2, name: 'Central Intelligence Store', desc: 'Source of Truth · Event Bus · Data Lake · MongoDB + PostgreSQL + Redis + BigQuery', color: 'bg-indigo-500' },
  { num: 3, name: 'Digital Twin Engine', desc: 'Order Twin · Shipment Twin · Supplier Twin · Financial Twin', color: 'bg-violet-500' },
  { num: 4, name: 'Multi-Agent Orchestration', desc: 'Disruption Agent → Constraint Agent → Routing Agent → Learning Agent (LangGraph)', color: 'bg-purple-500' },
  { num: 5, name: 'Execution & Mode Layer', desc: 'Ocean · Road · Air · DIGIPIN Last Mile', color: 'bg-emerald-500' },
  { num: 6, name: 'Execution Monitoring', desc: 'Real-time Tracking · ETA · Exception Detection · Disruption Re-trigger', color: 'bg-amber-500' },
  { num: 7, name: 'Enterprise Integration', desc: 'ERP Connectors · Dashboards · Alerts · Explainability · CO₂ Sustainability', color: 'bg-rose-500' },
]

function FadeInView({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-16 bg-[#060D1A]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold font-display">TF</span>
          </div>
          <span className="text-white font-semibold font-display text-lg">TwinFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="text-slate-300 text-sm hover:text-white transition-colors px-4 py-2">
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Get Started →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="h-screen bg-[#060D1A] relative flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" />
            <pointLight position={[-10, -5, 5]} intensity={0.4} color="#6366f1" />
            <Suspense fallback={null}>
              <Earth />
              <RouteArcs />
              <Stars radius={100} depth={50} count={2000} factor={4} fade />
            </Suspense>
            <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
          </Canvas>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <span className="inline-flex items-center gap-2 text-indigo-400 text-sm font-medium bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="status-dot active" /> Live at Google Hackathon 2025
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-display text-white leading-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
          >
            Supply Chain<br />
            <span className="text-indigo-400">Intelligence</span>
          </motion.h1>

          <motion.p
            className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            A proactive, simulation-driven platform using digital twins and multi-agent AI to predict and prevent logistics disruptions before they happen.
          </motion.p>

          <motion.div
            className="flex items-center gap-4 justify-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
          >
            <button
              onClick={() => navigate('/signup')}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all hover:shadow-lg hover:shadow-indigo-500/25 flex items-center gap-2"
            >
              Get Started <ArrowRight size={18} />
            </button>
            <a href="#architecture" className="text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-8 py-3.5 rounded-xl text-base transition-all">
              View Architecture
            </a>
          </motion.div>

          <motion.div
            className="flex items-center gap-3 justify-center mt-12 flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            {['99.2% Uptime', '4 AI Agents', 'Digital Twins', 'OR-Tools Routing', 'Gemini AI'].map(chip => (
              <span key={chip} className="text-xs text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                {chip}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs">Scroll to explore</span>
          <div className="w-0.5 h-8 bg-gradient-to-b from-slate-500 to-transparent" />
        </motion.div>
      </section>

      {/* STATS STRIP */}
      <section className="bg-white border-b border-slate-100 py-12 px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <FadeInView key={stat.label} delay={i * 0.1}>
              <div className="text-center">
                <p className="text-4xl font-display text-slate-900 font-bold">{stat.value}<span className="text-indigo-500">{stat.suffix}</span></p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            </FadeInView>
          ))}
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-24 px-8 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <FadeInView>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display text-slate-900 mb-4">Built for Modern Logistics</h2>
              <p className="text-slate-500 text-lg max-w-xl mx-auto">Every layer of TwinFlow is purpose-built for proactive supply chain intelligence.</p>
            </div>
          </FadeInView>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <FadeInView key={feature.title} delay={i * 0.08}>
                <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-200 hover:shadow-elevated transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                    <feature.icon size={20} className="text-indigo-500" />
                  </div>
                  <h3 className="text-slate-900 font-semibold mb-2">{feature.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* 7-LAYER ARCHITECTURE */}
      <section id="architecture" className="py-24 px-8 bg-[#060D1A]">
        <div className="max-w-3xl mx-auto">
          <FadeInView>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display text-white mb-4">7-Layer Architecture</h2>
              <p className="text-slate-400">From raw data to enterprise insights — every layer purpose-built.</p>
            </div>
          </FadeInView>
          <div className="space-y-3">
            {LAYERS.map((layer, i) => (
              <FadeInView key={layer.num} delay={i * 0.07}>
                <div className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.08] transition-colors group">
                  <div className={`w-8 h-8 ${layer.color} rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm`}>
                    {layer.num}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{layer.name}</p>
                    <p className="text-slate-400 text-xs mt-1">{layer.desc}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors ml-auto flex-shrink-0 mt-1" />
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 bg-white text-center">
        <FadeInView>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-display text-slate-900 mb-4">Ready to Predict Disruptions?</h2>
            <p className="text-slate-500 mb-8">Join the proactive supply chain revolution powered by digital twins and multi-agent AI.</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => navigate('/signup')}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-10 py-4 rounded-xl text-base transition-all hover:shadow-lg hover:shadow-indigo-500/25 flex items-center gap-2"
              >
                Start Free <ArrowRight size={18} />
              </button>
            </div>
            <p className="text-slate-400 text-sm mt-6">✓ No credit card &nbsp; ✓ Instant demo data &nbsp; ✓ Full AI pipeline</p>
          </div>
        </FadeInView>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-8 px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">TF</span>
            </div>
            <span className="text-slate-600 font-semibold font-display">TwinFlow</span>
          </div>
          <p className="text-slate-400 text-sm">Built for Google Hackathon 2025</p>
        </div>
      </footer>
    </div>
  )
}
