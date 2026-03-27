// src/pages/DrawsPage.jsx
import { useEffect, useState } from 'react'
import { getPublishedDraws } from '../lib/supabase'
import { Trophy, Calendar, Users } from 'lucide-react'
import { format } from 'date-fns'

const DrawBall = ({ number, delay = 0 }) => (
  <div className="draw-ball" style={{ animationDelay: `${delay}ms` }}>
    {number}
  </div>
)

const PrizeRow = ({ label, amount, badge, hasWinner }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-2">
      <span className={badge}>{label}</span>
      {!hasWinner && label === '5 Match' && (
        <span className="text-xs font-body text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">
          Jackpot Rolled
        </span>
      )}
    </div>
    <span className="font-mono text-white text-sm">
      {amount > 0 ? `£${amount.toLocaleString()}` : '—'}
    </span>
  </div>
)

export default function DrawsPage() {
  const [draws, setDraws] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublishedDraws().then(({ data }) => {
      setDraws(data || [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-gold-400 text-xs font-body uppercase tracking-widest mb-4">
          <Trophy size={14} /> Monthly Prize Draws
        </div>
        <h1 className="font-display text-5xl text-white mb-4">Draw Results</h1>
        <p className="font-body text-white/40 max-w-lg mx-auto">
          Every month, five numbers are drawn. Match 3, 4, or all 5 of your
          Stableford scores to win a share of the prize pool.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card-glow h-48 animate-pulse" />
          ))}
        </div>
      ) : draws.length === 0 ? (
        <div className="card-glow p-12 text-center text-white/40 font-body">
          No draws have been published yet. Check back soon!
        </div>
      ) : (
        <div className="space-y-6">
          {draws.map((draw, i) => (
            <div key={draw.id} className={`card-glow p-6 ${i === 0 ? 'border-brand-500/30' : ''}`}>
              {/* Draw header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-display text-2xl text-white">{draw.period_label}</h2>
                    {i === 0 && (
                      <span className="text-xs bg-brand-500 text-white px-2 py-0.5 rounded-full font-body">
                        Latest
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-body text-white/30">
                    {draw.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {format(new Date(draw.published_at), 'dd MMM yyyy')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {draw.active_subscriber_count} participants
                    </span>
                    <span className="capitalize bg-white/5 px-2 py-0.5 rounded">
                      {draw.draw_logic}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-2xl text-gold-400 font-bold">
                    £{draw.total_pool?.toLocaleString()}
                  </div>
                  <div className="text-xs font-body text-white/30">total pool</div>
                </div>
              </div>

              {/* Drawn numbers */}
              {draw.drawn_numbers?.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-body text-white/30 uppercase tracking-widest mb-3">
                    Drawn numbers
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {draw.drawn_numbers.map((n, idx) => (
                      <DrawBall key={idx} number={n} delay={idx * 150} />
                    ))}
                  </div>
                </div>
              )}

              {/* Prize breakdown */}
              <div className="border-t border-white/5 pt-4">
                <p className="text-xs font-body text-white/30 uppercase tracking-widest mb-3">
                  Prize breakdown
                </p>
                <div className="divide-y divide-white/5">
                  <PrizeRow label="5 Match" badge="prize-badge-5"
                            amount={draw.pool_5match}
                            hasWinner={!draw.jackpot_rollover} />
                  <PrizeRow label="4 Match" badge="prize-badge-4" amount={draw.pool_4match} hasWinner />
                  <PrizeRow label="3 Match" badge="prize-badge-3" amount={draw.pool_3match} hasWinner />
                </div>
                {draw.jackpot_carried_forward > 0 && (
                  <div className="mt-3 p-3 bg-gold-500/10 rounded-xl border border-gold-500/20 text-xs font-body">
                    <span className="text-gold-400 font-medium">
                      £{draw.jackpot_carried_forward.toFixed(2)} jackpot carried forward to next month
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
