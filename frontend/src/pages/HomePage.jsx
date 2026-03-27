// src/pages/HomePage.jsx
// Hero-driven landing page — emotion first, golf second

import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Trophy, Heart, Target, ArrowRight, Star, CheckCircle } from 'lucide-react'
import { getCharities, getPublishedDraws } from '../lib/supabase'

// Animated counter hook
const useCounter = (target, duration = 1500) => {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target])
  return count
}

const StatCard = ({ value, label, prefix = '', suffix = '' }) => {
  const count = useCounter(value)
  return (
    <div className="text-center">
      <div className="font-display text-4xl md:text-5xl font-bold text-gradient mb-1">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="font-body text-sm text-white/40 uppercase tracking-widest">{label}</div>
    </div>
  )
}

const HowStep = ({ number, title, description, delay }) => (
  <div className="relative" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/30
                      flex items-center justify-center mb-4 font-mono font-bold text-brand-400 text-lg">
        {number}
      </div>
      <h3 className="font-display text-lg text-white mb-2">{title}</h3>
      <p className="font-body text-sm text-white/50 leading-relaxed">{description}</p>
    </div>
    {number < 4 && (
      <div className="hidden md:block absolute top-7 left-[calc(100%+1rem)] w-8 border-t border-dashed border-white/10" />
    )}
  </div>
)

const PrizeTier = ({ match, pool, rollover, delay }) => (
  <div className="card-glow p-5 animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-center justify-between mb-3">
      <span className={`prize-badge-${match === '5 Match' ? '5' : match === '4 Match' ? '4' : '3'}`}>
        {match}
      </span>
      {rollover && (
        <span className="text-xs font-body text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">
          Jackpot Rollover
        </span>
      )}
    </div>
    <div className="font-mono text-3xl font-bold text-white mb-1">{pool}%</div>
    <div className="text-xs font-body text-white/40">of prize pool</div>
  </div>
)

export default function HomePage() {
  const [featuredCharities, setFeaturedCharities] = useState([])
  const [latestDraw, setLatestDraw] = useState(null)

  useEffect(() => {
    getCharities().then(({ data }) => {
      if (data) setFeaturedCharities(data.filter(c => c.is_featured).slice(0, 3))
    })
    getPublishedDraws().then(({ data }) => {
      if (data?.length) setLatestDraw(data[0])
    })
  }, [])

  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full
                          bg-brand-600/20 blur-[120px] animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full
                          bg-gold-500/10 blur-[100px] animate-float"
               style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]
                          rounded-full border border-brand-500/10" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          {/* Pill label */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10
                          border border-brand-500/20 text-brand-400 text-xs font-body font-medium mb-8 animate-fade-in">
            <Heart size={12} className="animate-pulse-slow" />
            Golf that gives back
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight mb-6 animate-slide-up">
            Every round.<br />
            <span className="text-gradient">Every cause.</span><br />
            Every month.
          </h1>

          <p className="font-body text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up"
             style={{ animationDelay: '100ms' }}>
            Subscribe to ParScore — enter your Stableford scores, support a charity you love,
            and compete in monthly prize draws. Where sport meets purpose.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up"
               style={{ animationDelay: '200ms' }}>
            <Link to="/signup" className="btn-primary text-base px-8 py-4">
              Start Playing for Good <ArrowRight size={18} />
            </Link>
            <Link to="/how-it-works" className="btn-secondary text-base px-8 py-4">
              How It Works
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-6 mt-12 text-white/30 text-xs font-body animate-fade-in"
               style={{ animationDelay: '400ms' }}>
            <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-brand-500" /> Stripe Secured</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-brand-500" /> Cancel Anytime</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-brand-500" /> 10%+ to Charity</span>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────── */}
      <section className="py-16 border-y border-white/5 bg-dark-800/50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value={61}     suffix="+"  label="Active Members" />
            <StatCard value={8}              label="Charities Supported" />
            <StatCard prefix="£" value={428000} label="Raised for Good" />
            <StatCard value={3}              label="Monthly Prize Tiers" />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <section className="py-24 max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-brand-400 font-body text-xs uppercase tracking-widest mb-3">Simple by design</p>
          <h2 className="font-display text-4xl md:text-5xl text-white">Four steps to impact</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          <HowStep number={1} delay={0}   title="Subscribe"   description="Choose monthly or yearly. Fair, flexible, and transparent pricing." />
          <HowStep number={2} delay={100} title="Score"       description="Enter your last 5 Stableford scores as you play. Simple, honest logging." />
          <HowStep number={3} delay={200} title="Give"        description="Pick a charity you care about. Minimum 10% goes to them every month." />
          <HowStep number={4} delay={300} title="Win"         description="Monthly draws match your scores to drawn numbers. 3, 4, or 5 matches wins." />
        </div>
      </section>

      {/* ── PRIZE TIERS ─────────────────────────────────── */}
      <section className="py-24 bg-dark-800/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-gold-400 font-body text-xs uppercase tracking-widest mb-3">Monthly Prize Pool</p>
            <h2 className="font-display text-4xl md:text-5xl text-white mb-4">Three ways to win</h2>
            <p className="font-body text-white/40 max-w-lg mx-auto">
              Your scores are automatically entered into each monthly draw.
              Match 3, 4, or all 5 numbers — prizes split equally among all winners.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PrizeTier match="5 Match" pool={40} rollover={true}  delay={0} />
            <PrizeTier match="4 Match" pool={35} rollover={false} delay={100} />
            <PrizeTier match="3 Match" pool={25} rollover={false} delay={200} />
          </div>
          {latestDraw && (
            <div className="mt-8 p-6 card-glow text-center">
              <p className="text-white/40 text-xs font-body uppercase tracking-widest mb-2">Latest Draw</p>
              <p className="font-display text-xl text-white mb-3">{latestDraw.period_label}</p>
              <div className="flex justify-center gap-3 flex-wrap">
                {latestDraw.drawn_numbers?.map((n, i) => (
                  <div key={i} className="draw-ball">{n}</div>
                ))}
              </div>
              <Link to="/draws" className="inline-flex items-center gap-1 text-brand-400 text-sm font-body mt-4 hover:underline">
                View full results <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURED CHARITIES ──────────────────────────── */}
      {featuredCharities.length > 0 && (
        <section className="py-24 max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-pink-400 font-body text-xs uppercase tracking-widest mb-3">Making a difference</p>
            <h2 className="font-display text-4xl md:text-5xl text-white mb-4">Causes we champion</h2>
            <p className="font-body text-white/40 max-w-lg mx-auto">
              Every subscription contributes to a charity of your choice.
              You pick the cause. We make sure it happens.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCharities.map(charity => (
              <Link key={charity.id} to={`/charities/${charity.slug}`}
                    className="card-glow overflow-hidden group block">
                {charity.image_url && (
                  <div className="h-48 overflow-hidden">
                    <img src={charity.image_url} alt={charity.name}
                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-5">
                  <span className="text-xs font-body text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                    {charity.category}
                  </span>
                  <h3 className="font-display text-lg text-white mt-3 mb-2">{charity.name}</h3>
                  <p className="font-body text-sm text-white/50 line-clamp-2">{charity.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs font-mono text-gold-400">
                      £{charity.total_raised?.toLocaleString()} raised
                    </span>
                    <ArrowRight size={14} className="text-white/30 group-hover:text-brand-400 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/charities" className="btn-secondary">
              Explore All Charities <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}

      {/* ── FINAL CTA ───────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-900/30 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl
                          bg-brand-500/20 border border-brand-500/30 mb-8 animate-float">
            <Star size={32} className="text-brand-400" />
          </div>
          <h2 className="font-display text-4xl md:text-6xl text-white mb-6">
            Ready to play for something bigger?
          </h2>
          <p className="font-body text-white/50 text-lg mb-10">
            Join ParScore today. From £9.99/month. Cancel anytime.
          </p>
          <Link to="/signup" className="btn-primary text-lg px-10 py-5">
            Subscribe Now <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  )
}
