// src/pages/admin/AdminDraws.jsx
// Full draw management: create, simulate, configure logic, publish

import { useEffect, useState } from 'react'
import { getAllDraws, adminCreateDraw, adminUpdateDraw, supabase } from '../../lib/supabase'
import { Trophy, Play, CheckCheck, Plus, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

// ── Draw engine (runs in browser for simulation) ──────────────
const runDrawEngine = async (drawId, logic) => {
  // Fetch all active subscribers with their 5 scores
  const { data: subscribers } = await supabase
    .from('subscriptions')
    .select('user_id, plan_amount')
    .eq('status', 'active')

  if (!subscribers?.length) return { error: 'No active subscribers' }

  // Fetch all their scores
  const { data: allScores } = await supabase
    .from('golf_scores')
    .select('user_id, score')
    .in('user_id', subscribers.map(s => s.user_id))

  // Determine 5 drawn numbers
  let drawnNumbers = []
  if (logic === 'random') {
    // Pure random — 5 unique numbers 1-45
    const pool = Array.from({ length: 45 }, (_, i) => i + 1)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]]
    }
    drawnNumbers = pool.slice(0, 5)
  } else {
    // Weighted — numbers that appear LESS frequently are weighted HIGHER
    const freq = {}
    allScores?.forEach(s => { freq[s.score] = (freq[s.score] || 0) + 1 })
    const pool = []
    for (let n = 1; n <= 45; n++) {
      const weight = Math.max(1, 10 - (freq[n] || 0)) // rare = higher weight
      for (let w = 0; w < weight; w++) pool.push(n)
    }
    const drawn = new Set()
    while (drawn.size < 5) {
      drawn.add(pool[Math.floor(Math.random() * pool.length)])
    }
    drawnNumbers = [...drawn]
  }

  // Calculate total pool (80% of all subscription revenue this month)
  const totalPool = subscribers.reduce((sum, s) => sum + (s.plan_amount * 0.8), 0)
  const pool5 = totalPool * 0.40
  const pool4 = totalPool * 0.35
  const pool3 = totalPool * 0.25

  // Score each subscriber's entries
  const entries = []
  for (const sub of subscribers) {
    const userScores = allScores?.filter(s => s.user_id === sub.user_id).map(s => s.score) || []
    const matchCount = userScores.filter(s => drawnNumbers.includes(s)).length
    const matchType = matchCount >= 5 ? '5_match' : matchCount === 4 ? '4_match' : matchCount === 3 ? '3_match' : 'no_match'
    entries.push({ user_id: sub.user_id, matched_count: matchCount, match_type: matchType,
                   score_1: userScores[0], score_2: userScores[1], score_3: userScores[2],
                   score_4: userScores[3], score_5: userScores[4] })
  }

  // Calculate prizes per winner
  const winners5 = entries.filter(e => e.match_type === '5_match')
  const winners4 = entries.filter(e => e.match_type === '4_match')
  const winners3 = entries.filter(e => e.match_type === '3_match')

  const prize5 = winners5.length > 0 ? pool5 / winners5.length : 0
  const prize4 = winners4.length > 0 ? pool4 / winners4.length : 0
  const prize3 = winners3.length > 0 ? pool3 / winners3.length : 0

  entries.forEach(e => {
    e.prize_amount = e.match_type === '5_match' ? prize5
                   : e.match_type === '4_match' ? prize4
                   : e.match_type === '3_match' ? prize3 : 0
    e.draw_period_id = drawId
  })

  return {
    drawnNumbers, totalPool, pool5, pool4, pool3,
    jackpotRollover: winners5.length === 0,
    subscriberCount: subscribers.length,
    entries,
  }
}

export default function AdminDraws() {
  const [draws, setDraws]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [simulating, setSimulating] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]         = useState({
    period_label: '', period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(), draw_logic: 'random',
  })

  const loadDraws = () => {
    getAllDraws().then(({ data }) => { setDraws(data || []); setLoading(false) })
  }
  useEffect(loadDraws, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    const { data, error } = await adminCreateDraw(form)
    if (error) { toast.error(error.message); return }
    toast.success('Draw period created!')
    setShowCreate(false)
    loadDraws()
  }

  const handleSimulate = async (draw) => {
    setSimulating(draw.id)
    toast.loading('Running draw simulation…', { id: 'sim' })

    const result = await runDrawEngine(draw.id, draw.draw_logic)
    if (result.error) { toast.error(result.error, { id: 'sim' }); setSimulating(null); return }

    // Save draw_entries for this period
    // First delete any old entries for this draw
    await supabase.from('draw_entries').delete().eq('draw_period_id', draw.id)

    const { error: entryErr } = await supabase.from('draw_entries').insert(result.entries)
    if (entryErr) { toast.error('Failed to save entries: ' + entryErr.message, { id: 'sim' }); setSimulating(null); return }

    // Update draw period with results
    const { error: updateErr } = await adminUpdateDraw(draw.id, {
      status:                   'simulated',
      drawn_numbers:            result.drawnNumbers,
      total_pool:               result.totalPool,
      pool_5match:              result.pool5,
      pool_4match:              result.pool4,
      pool_3match:              result.pool3,
      jackpot_rollover:         result.jackpotRollover,
      active_subscriber_count:  result.subscriberCount,
    })

    if (updateErr) { toast.error(updateErr.message, { id: 'sim' }); setSimulating(null); return }

    toast.success(
      `Simulation complete! Drawn: ${result.drawnNumbers.join(', ')}. Pool: £${result.totalPool.toFixed(2)}`,
      { id: 'sim', duration: 5000 }
    )
    setSimulating(null)
    loadDraws()
  }

  const handlePublish = async (draw) => {
    if (!confirm(`Publish "${draw.period_label}" results? This cannot be undone.`)) return
    const { error } = await adminUpdateDraw(draw.id, {
      status: 'published', published_at: new Date().toISOString(),
    })
    if (error) { toast.error(error.message); return }
    toast.success('Draw published!')
    loadDraws()
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white mb-1">Draw Management</h1>
          <p className="font-body text-sm text-white/40">Configure, simulate, and publish monthly draws</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
          <Plus size={16} /> New Draw Period
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card-glow p-6 mb-6 animate-slide-up">
          <h3 className="font-display text-xl text-white mb-4">Create Draw Period</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-body text-white/50 mb-1.5 uppercase tracking-wide">Period Label</label>
              <input type="text" required placeholder="e.g. April 2026"
                     className="input-field" value={form.period_label}
                     onChange={e => setForm(p => ({ ...p, period_label: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-body text-white/50 mb-1.5 uppercase tracking-wide">Month (1–12)</label>
              <input type="number" min="1" max="12" required className="input-field"
                     value={form.period_month}
                     onChange={e => setForm(p => ({ ...p, period_month: parseInt(e.target.value) }))} />
            </div>
            <div>
              <label className="block text-xs font-body text-white/50 mb-1.5 uppercase tracking-wide">Year</label>
              <input type="number" required className="input-field"
                     value={form.period_year}
                     onChange={e => setForm(p => ({ ...p, period_year: parseInt(e.target.value) }))} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-body text-white/50 mb-1.5 uppercase tracking-wide">Draw Logic</label>
              <select className="input-field" value={form.draw_logic}
                      onChange={e => setForm(p => ({ ...p, draw_logic: e.target.value }))}>
                <option value="random">Random — standard lottery style</option>
                <option value="weighted">Weighted — rare scores favoured</option>
              </select>
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="btn-primary flex-1 justify-center">Create Period</button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary px-6">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Draws list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 card-glow animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {draws.map(draw => (
            <div key={draw.id} className="card-glow p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-display text-xl text-white">{draw.period_label}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      draw.status === 'published' ? 'bg-brand-500/20 text-brand-400' :
                      draw.status === 'simulated' ? 'bg-gold-500/20 text-gold-400' :
                      'bg-white/10 text-white/40'
                    }`}>{draw.status}</span>
                  </div>
                  <div className="text-xs font-body text-white/30">
                    Logic: {draw.draw_logic} · Subscribers: {draw.active_subscriber_count} · Pool: £{draw.total_pool?.toFixed(2)}
                  </div>
                  {draw.drawn_numbers?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {draw.drawn_numbers.map((n, i) => (
                        <span key={i} className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/30
                                                 flex items-center justify-center font-mono text-xs text-brand-400">
                          {n}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {draw.status === 'pending' && (
                    <button onClick={() => handleSimulate(draw)}
                            disabled={simulating === draw.id}
                            className="btn-secondary text-sm px-4 py-2 gap-1.5">
                      {simulating === draw.id
                        ? <><RefreshCw size={13} className="animate-spin" /> Simulating…</>
                        : <><Play size={13} /> Simulate</>}
                    </button>
                  )}
                  {draw.status === 'simulated' && (
                    <>
                      <button onClick={() => handleSimulate(draw)}
                              disabled={simulating === draw.id}
                              className="btn-secondary text-sm px-4 py-2 gap-1.5">
                        <RefreshCw size={13} /> Re-run
                      </button>
                      <button onClick={() => handlePublish(draw)}
                              className="btn-primary text-sm px-4 py-2 gap-1.5">
                        <CheckCheck size={13} /> Publish
                      </button>
                    </>
                  )}
                  {draw.status === 'published' && draw.published_at && (
                    <span className="text-xs font-body text-white/30 self-center">
                      Published {format(new Date(draw.published_at), 'dd MMM yyyy')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
