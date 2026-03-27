// src/pages/SubscribePage.jsx
// Stripe subscription checkout
// Works in TWO modes:
//   1. LIVE MODE: Calls Supabase Edge Function (production)
//   2. DEV BYPASS: Manually inserts subscription row for local testing

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { CheckCircle, Trophy, Zap, Star, AlertTriangle, Wrench } from 'lucide-react'
import toast from 'react-hot-toast'

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: 9.99,
    period: '/month',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY,
    description: 'Perfect for trying it out. Cancel anytime.',
    badge: null,
    icon: Zap,
    poolContribution: 7.99,
    charityMin: 1.00,
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: 99.99,
    period: '/year',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_YEARLY,
    description: 'Best value — save over £19 per year.',
    badge: 'Best Value',
    icon: Star,
    poolContribution: 79.99,
    charityMin: 10.00,
  },
]

const features = [
  'Score tracking with rolling 5-score logic',
  'Monthly draw entries (3, 4 & 5 number match)',
  'Charity contribution — choose your cause',
  'Full subscriber dashboard & winnings tracker',
  'Winner proof upload & payout system',
  'Cancel or change plan anytime',
]

// ── Dev bypass: insert a fake subscription row directly in Supabase ──
// This lets you test the full dashboard flow without Stripe or Edge Functions
const devBypassSubscribe = async (userId, planType, planAmount) => {
  // First get a charity to attach (use first available)
  const { data: charities } = await supabase
    .from('charities')
    .select('id')
    .eq('is_active', true)
    .limit(1)

  const charityId = charities?.[0]?.id || null

  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + (planType === 'yearly' ? 12 : 1))

  const { error } = await supabase.from('subscriptions').upsert({
    user_id:               userId,
    stripe_customer_id:    'dev_customer_' + userId.slice(0, 8),
    stripe_subscription_id: 'dev_sub_' + Date.now(),
    stripe_price_id:       'dev_price_' + planType,
    plan_type:             planType,
    plan_amount:           planAmount,
    status:                'active',
    charity_id:            charityId,
    charity_percentage:    10,
    current_period_start:  now.toISOString(),
    current_period_end:    periodEnd.toISOString(),
  }, { onConflict: 'stripe_subscription_id' })

  return { error }
}

export default function SubscribePage() {
  const { user, subscription, refreshSubscription } = useAuth()
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [loading, setLoading]           = useState(false)
  const [showDevPanel, setShowDevPanel] = useState(false)

  // Already subscribed → go to dashboard
  if (subscription?.status === 'active') {
    navigate('/dashboard')
    return null
  }

  const plan = PLANS.find(p => p.id === selectedPlan)

  // ── PRODUCTION: call Edge Function → Stripe Checkout ─────────
  const handleStripeCheckout = async () => {
    if (!plan.stripePriceId) {
      toast.error('Stripe Price ID missing in .env — use Dev Bypass below to test locally.')
      setShowDevPanel(true)
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        toast.error('Not logged in')
        setLoading(false)
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            priceId:    plan.stripePriceId,
            planType:   plan.id,
            userId:     user.id,
            successUrl: `${window.location.origin}/dashboard?subscribed=true`,
            cancelUrl:  `${window.location.origin}/subscribe`,
          }),
        }
      )

      if (!response.ok) {
        const text = await response.text()
        console.error('Edge function error:', response.status, text)
        throw new Error(`Edge function returned ${response.status}: ${text}`)
      }

      const data = await response.json()

      if (data.error) throw new Error(data.error)
      if (!data.url)  throw new Error('No checkout URL returned from Edge Function')

      window.location.href = data.url

    } catch (err) {
      console.error('Stripe checkout error:', err)
      toast.error(err.message || 'Checkout failed')
      setShowDevPanel(true) // show dev bypass as fallback
      setLoading(false)
    }
  }

  // ── DEV BYPASS: insert subscription directly, skip Stripe ────
  const handleDevBypass = async () => {
    setLoading(true)
    const { error } = await devBypassSubscribe(user.id, plan.id, plan.price)
    setLoading(false)

    if (error) {
      console.error('Dev bypass error:', error)
      toast.error('Dev bypass failed: ' + error.message)
      return
    }

    toast.success('✅ Dev subscription activated! Redirecting to dashboard…')
    await refreshSubscription()
    setTimeout(() => navigate('/dashboard?subscribed=true'), 800)
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10
                          border border-brand-500/20 text-brand-400 text-xs font-body mb-6">
            <Trophy size={12} /> One step away from playing for good
          </div>
          <h1 className="font-display text-5xl text-white mb-4">Choose your plan</h1>
          <p className="font-body text-white/40 text-lg">
            Every plan includes full access. Pick what works for you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Plan selector */}
          <div className="lg:col-span-2 space-y-4">
            {PLANS.map(p => {
              const Icon = p.icon
              const active = selectedPlan === p.id
              return (
                <button key={p.id} onClick={() => setSelectedPlan(p.id)}
                        className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${
                          active
                            ? 'border-brand-500 bg-brand-500/10'
                            : 'border-white/10 bg-dark-800 hover:border-white/20'
                        }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        active ? 'bg-brand-500' : 'bg-white/5'
                      }`}>
                        <Icon size={18} className={active ? 'text-white' : 'text-white/40'} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-xl text-white">{p.label}</span>
                          {p.badge && (
                            <span className="text-xs font-body bg-gold-500 text-dark-900 px-2 py-0.5 rounded-full font-medium">
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <p className="font-body text-sm text-white/40 mt-0.5">{p.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-2xl text-white font-bold">£{p.price}</div>
                      <div className="text-xs font-body text-white/40">{p.period}</div>
                    </div>
                  </div>
                  {active && (
                    <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-xs font-body">
                      <div className="text-white/40">→ Pool contribution: <span className="text-brand-400">£{p.poolContribution.toFixed(2)}</span></div>
                      <div className="text-white/40">→ Min. charity: <span className="text-pink-400">£{p.charityMin.toFixed(2)}</span></div>
                    </div>
                  )}
                </button>
              )
            })}

            {/* Features */}
            <div className="card-glow p-6">
              <h3 className="font-display text-lg text-white mb-4">Everything included</h3>
              <ul className="space-y-3">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 font-body text-sm text-white/60">
                    <CheckCircle size={15} className="text-brand-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Checkout panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card-glow p-6 sticky top-24">
              <h3 className="font-display text-xl text-white mb-6">Order summary</h3>

              <div className="space-y-3 mb-6 text-sm font-body">
                <div className="flex justify-between text-white/60">
                  <span>Plan</span>
                  <span className="text-white capitalize">{plan.label}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Prize pool</span>
                  <span className="text-brand-400">£{plan.poolContribution.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Min. charity (10%)</span>
                  <span className="text-pink-400">£{plan.charityMin.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between font-medium text-white">
                  <span>Total</span>
                  <span>£{plan.price}{plan.period}</span>
                </div>
              </div>

              {/* Main Stripe button */}
              <button
                onClick={handleStripeCheckout}
                disabled={loading}
                className="btn-primary w-full justify-center py-4 text-base mb-3"
              >
                {loading ? 'Please wait…' : `Subscribe — £${plan.price}${plan.period}`}
              </button>

              <div className="text-center text-xs font-body text-white/30 mb-4">
                🔒 Secured by Stripe · Cancel anytime
              </div>

              {/* Dev bypass toggle */}
              <button
                onClick={() => setShowDevPanel(!showDevPanel)}
                className="w-full flex items-center justify-center gap-2 text-xs font-body
                           text-white/20 hover:text-white/40 transition-colors py-1"
              >
                <Wrench size={11} />
                {showDevPanel ? 'Hide' : 'Show'} dev bypass
              </button>
            </div>

            {/* Dev bypass panel */}
            {showDevPanel && (
              <div className="card-glow p-5 border border-orange-500/20 bg-orange-500/5 animate-slide-up">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} className="text-orange-400" />
                  <span className="text-xs font-body font-medium text-orange-400 uppercase tracking-wide">
                    Dev Bypass — Local Testing Only
                  </span>
                </div>
                <p className="text-xs font-body text-white/40 leading-relaxed mb-4">
                  Skips Stripe entirely. Inserts a fake active subscription directly
                  into Supabase so you can test the full dashboard. Do NOT use in production.
                </p>
                <button
                  onClick={handleDevBypass}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                             bg-orange-500/15 text-orange-400 text-sm font-body font-medium
                             hover:bg-orange-500/25 transition-colors border border-orange-500/20"
                >
                  <Wrench size={14} />
                  {loading ? 'Activating…' : `Activate Dev ${plan.label} Subscription`}
                </button>
                <p className="text-xs font-body text-white/20 text-center mt-3">
                  You'll need to run the SQL below first if RLS blocks insert
                </p>
                <pre className="text-xs font-mono text-white/30 bg-dark-700 p-3 rounded-lg mt-2 overflow-x-auto whitespace-pre-wrap">{`-- Allow users to insert own subscription (run in Supabase):
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;`}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
