// src/pages/LoginPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '../lib/supabase'
import { Trophy, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(form.email, form.password)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Welcome back!')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="card-glow p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-4">
              <Trophy size={22} className="text-white" />
            </div>
            <h1 className="font-display text-3xl text-white mb-1">Welcome back</h1>
            <p className="font-body text-white/40 text-sm">Sign in to your ParScore account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-body text-white/50 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input type="email" required placeholder="you@example.com"
                     className="input-field"
                     value={form.email}
                     onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-body text-white/50 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required
                       placeholder="••••••••"
                       className="input-field pr-10"
                       value={form.password}
                       onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
                    className="btn-primary w-full justify-center py-3.5 mt-2">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center font-body text-sm text-white/40 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-400 hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
