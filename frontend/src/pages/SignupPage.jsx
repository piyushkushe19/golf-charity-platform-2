// src/pages/SignupPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../lib/supabase'
import { Trophy, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const perks = [
  'Monthly prize draws (3/4/5 match)',
  'Charity contribution of your choice',
  'Score tracking dashboard',
  'Cancel anytime',
]

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPw: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPw) { toast.error('Passwords do not match'); return }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    const { error } = await signUp(form.email, form.password, form.fullName)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Account created! Please check your email to confirm.')
    navigate('/subscribe')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Left — benefits */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
              <Trophy size={18} className="text-white" />
            </div>
            <span className="font-display text-2xl text-white">ParScore</span>
          </div>
          <h1 className="font-display text-4xl text-white mb-4">
            Join the community that plays for good.
          </h1>
          <p className="font-body text-white/50 text-sm leading-relaxed mb-8">
            From £9.99/month. Every score counts. Every month, a chance to win.
            Every subscription supports a cause you believe in.
          </p>
          <ul className="space-y-3">
            {perks.map((perk, i) => (
              <li key={i} className="flex items-center gap-3 font-body text-sm text-white/70">
                <CheckCircle size={16} className="text-brand-400 shrink-0" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form */}
        <div className="card-glow p-8">
          <h2 className="font-display text-2xl text-white mb-6">Create your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'fullName',    label: 'Full Name',        type: 'text',     placeholder: 'John Smith' },
              { key: 'email',       label: 'Email Address',    type: 'email',    placeholder: 'you@example.com' },
              { key: 'password',    label: 'Password',         type: 'password', placeholder: '8+ characters' },
              { key: 'confirmPw',   label: 'Confirm Password', type: 'password', placeholder: 'Repeat password' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-body text-white/50 mb-1.5 uppercase tracking-wide">
                  {label}
                </label>
                <input type={type} required placeholder={placeholder}
                       className="input-field"
                       value={form[key]}
                       onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}

            <p className="text-xs font-body text-white/30 leading-relaxed">
              By signing up you agree to our Terms of Service and Privacy Policy.
            </p>

            <button type="submit" disabled={loading}
                    className="btn-primary w-full justify-center py-3.5">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center font-body text-sm text-white/40 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
