// src/pages/dashboard/MyDrawsPage.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getUserDrawEntries } from '../../lib/supabase'
import { Trophy } from 'lucide-react'
import { format } from 'date-fns'

export default function MyDrawsPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserDrawEntries(user.id).then(({ data }) => {
      setEntries(data || [])
      setLoading(false)
    })
  }, [user])

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white mb-1">My Draw History</h1>
        <p className="font-body text-sm text-white/40">
          Your participation and results in every monthly draw
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 card-glow animate-pulse" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="card-glow p-12 text-center">
          <Trophy size={32} className="text-white/20 mx-auto mb-4" />
          <p className="font-body text-white/40 text-sm">
            You haven't been entered into any draws yet.
            Make sure you have scores logged before the monthly draw runs.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map(entry => (
            <div key={entry.id} className="card-glow p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="font-display text-xl text-white">{entry.draw_periods?.period_label}</div>
                  <div className="text-xs font-body text-white/30 mt-0.5">
                    {entry.draw_periods?.status === 'published' ? 'Results published' : 'Pending draw'}
                  </div>
                </div>
                <div className="text-right">
                  {entry.match_type && entry.match_type !== 'no_match' ? (
                    <div>
                      <span className={`prize-badge-${entry.match_type === '5_match' ? '5' : entry.match_type === '4_match' ? '4' : '3'}`}>
                        {entry.match_type.replace('_', ' ')}!
                      </span>
                      <div className="font-mono text-lg text-brand-400 mt-1">
                        £{entry.prize_amount?.toFixed(2)}
                      </div>
                    </div>
                  ) : entry.draw_periods?.status === 'published' ? (
                    <span className="text-xs font-body text-white/30 bg-white/5 px-3 py-1 rounded-full">
                      No match
                    </span>
                  ) : (
                    <span className="text-xs font-body text-gold-400 bg-gold-500/10 px-3 py-1 rounded-full">
                      Awaiting draw
                    </span>
                  )}
                </div>
              </div>

              {/* Scores snapshot */}
              <div className="grid grid-cols-5 gap-2">
                {[entry.score_1, entry.score_2, entry.score_3, entry.score_4, entry.score_5].map((s, i) => (
                  <div key={i}
                       className={`text-center p-2 rounded-lg font-mono text-sm ${
                         s ? 'bg-white/5 text-white' : 'bg-white/2 text-white/20'
                       }`}>
                    {s || '—'}
                  </div>
                ))}
              </div>
              <p className="text-xs font-body text-white/20 text-center mt-1">Your 5 scores at draw time</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
