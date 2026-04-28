import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      localStorage.setItem('tf_authed', 'true')
      localStorage.setItem('tf_user', email || 'admin@twinflow.ai')
      navigate('/app/dashboard')
    }, 800)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex w-1/2 bg-[#0F172A] flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold font-display">TF</span>
          </div>
          <span className="text-white font-display font-semibold text-xl">TwinFlow</span>
        </div>
        <div>
          <h2 className="text-4xl font-display text-white leading-tight mb-4">
            Supply chain intelligence that<br />
            <span className="text-indigo-400">acts before things break.</span>
          </h2>
          <p className="text-slate-400 text-base">Digital twins + multi-agent AI watching your logistics 24/7.</p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[['12,847', 'Shipments Live'], ['91.4%', 'On-Time Rate'], ['4', 'AI Agents'], ['99.2%', 'System Uptime']].map(([val, label]) => (
              <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-2xl font-display text-white font-bold">{val}</p>
                <p className="text-slate-400 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-slate-600 text-sm">© 2025 TwinFlow · Google Hackathon</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center bg-white px-8">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="text-3xl font-display text-slate-900 font-bold mb-2">Welcome back</h1>
            <p className="text-slate-500">Sign in to your TwinFlow dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@twinflow.ai"
                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Any password works"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Demo: any email + any password works</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <> Sign In <ArrowRight size={16} /> </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-8">
            No account? <Link to="/signup" className="text-indigo-500 font-medium hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
