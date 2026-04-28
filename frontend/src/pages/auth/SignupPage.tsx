import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function SignupPage() {
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSignup(e: React.FormEvent) {
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
            Predict disruptions.<br />
            <span className="text-indigo-400">Before they happen.</span>
          </h2>
          <p className="text-slate-400 text-base">Get started in 30 seconds. Instant demo data, 4 AI agents, full digital twin pipeline.</p>
          <div className="mt-10 space-y-3">
            {['Instant setup with demo data', '4 AI agents running live', 'Digital twins for every entity', 'OR-Tools VRP routing', 'CO₂ sustainability tracking'].map(item => (
              <div key={item} className="flex items-center gap-3 text-slate-300 text-sm">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-400 text-xs">✓</span>
                </div>
                {item}
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
            <h1 className="text-3xl font-display text-slate-900 font-bold mb-2">Create your account</h1>
            <p className="text-slate-500">Start your proactive supply chain journey</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Company name"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
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
                  placeholder="Create a password"
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Demo mode — any credentials will work</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <> Create Account <ArrowRight size={16} /> </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-8">
            Already have an account? <Link to="/login" className="text-indigo-500 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
