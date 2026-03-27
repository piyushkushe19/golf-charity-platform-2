// src/pages/dashboard/ScoresPage.jsx
// Score entry and management — rolling last 5

import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getScores, addScore, deleteScore } from '../../lib/supabase'
import { Plus, Trash2, Target, Info } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function ScoresPage() {
  const { user } = useAuth()
  const [scores, setScores]   = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding]   = useState(false)
  const [form, setForm]       = useState({ score: '', date: format(new Date(), 'yyyy-MM-dd'), notes: '' })
  const [showForm, setShowForm] = useState(false)

  const loadScores = async () => {
    const { data } = await getScores(user.id)
    setScores(data || [])
    setLoading(false)
  }

  useEffect(() => { loadScores() }, [user])

  const handleAdd = async (e) => {
    e.preventDefault()
    const scoreVal = parseInt(form.score)
    if (isNaN(scoreVal) || scoreVal < 1 || scoreVal > 45) {
      toast.error('Score must be between 1 and 45 (Stableford format)')
      return
    }
    setAdding(true)
    const { error } = await addScore(user.id, scoreVal, form.date, form.notes)
    setAdding(false)
    if (error) { toast.error(error.message); return }
    toast.success('Score added!')
    setForm({ score: '', date: format(new Date(), 'yyyy-MM-dd'), notes: '' })
    setShowForm(false)
    loadScores()
  }

  const handleDelete = async (scoreId) => {
    if (!confirm('Remove this score?')) return
    const { error } = await deleteScore(scoreId, user.id)
    if (error) { toast.error(error.message); return }
    toast.success('Score removed')
    loadScores()
  }

  // Score quality helper
  const getScoreLabel = (s) => {
    if (s >= 36) return { label: 'Excellent', color: 'text-gold-400' }
    if (s >= 28) return { label: 'Good',      color: 'text-brand-400' }
    if (s >= 20) return { label: 'Average',   color: 'text-blue-400' }
    return                { label: 'Below par', color: 'text-white/40' }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white mb-1">Your Scores</h1>
          <p className="font-body text-sm text-white/40">
            Last 5 Stableford scores · Oldest auto-removed when 6th is added
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
                className="btn-primary">
          <Plus size={16} /> Add Score
        </button>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 p-4 mb-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs font-body text-white/50 leading-relaxed">
          Your 5 most recent scores are used in monthly draws. Adding a 6th score automatically
          removes the oldest. Stableford scores range from 1 to 45.
        </p>
      </div>

      {/* Add score form */}
      {showForm && (
        <div className="card-glow p-6 mb-6 animate-slide-up">
          <h3 className="font-display text-xl text-white mb-4">Add New Score</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-body text-white/50 mb-1.5 uppercase tracking-wide">
                  Score (1–45)
                </label>
                <input type="number" min="1" max="45" required
                       placeholder="e.g. 32"
                       className="input-field font-mono text-lg"
                       value={form.score}
                       onChange={e => setForm(p => ({ ...p, score: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-body text-white/50 mb-1.5 uppercase tracking-wide">
                  Date Played
                </label>
                <input type="date" required
                       max={format(new Date(), 'yyyy-MM-dd')}
                       className="input-field"
                       value={form.date}
                       onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-body text-white/50 mb-1.5 uppercase tracking-wide">
                Notes (optional)
              </label>
              <input type="text" placeholder="e.g. Royal Birkdale, sunny day"
                     className="input-field"
                     value={form.notes}
                     onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>

            {/* Score preview */}
            {form.score && !isNaN(parseInt(form.score)) && parseInt(form.score) >= 1 && parseInt(form.score) <= 45 && (
              <div className="flex items-center gap-3 p-3 bg-white/3 rounded-xl">
                <div className="font-mono text-3xl font-bold text-white">{form.score}</div>
                <div>
                  <div className={`text-sm font-body font-medium ${getScoreLabel(parseInt(form.score)).color}`}>
                    {getScoreLabel(parseInt(form.score)).label}
                  </div>
                  <div className="text-xs font-body text-white/30">Stableford points</div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={adding} className="btn-primary flex-1 justify-center">
                {adding ? 'Saving…' : 'Save Score'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-4">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Score list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 card-glow animate-pulse" />
          ))}
        </div>
      ) : scores.length === 0 ? (
        <div className="card-glow p-12 text-center">
          <Target size={32} className="text-white/20 mx-auto mb-4" />
          <p className="font-body text-white/40 text-sm">
            No scores logged yet. Add your first Stableford score above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scores.map((score, i) => {
            const { label, color } = getScoreLabel(score.score)
            return (
              <div key={score.id}
                   className="card-glow p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center
                                font-mono text-xs text-white/40 shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 flex items-center gap-4">
                  <div className="font-mono font-bold text-3xl text-white w-16">{score.score}</div>
                  <div>
                    <div className={`text-sm font-body font-medium ${color}`}>{label}</div>
                    <div className="text-xs font-body text-white/30">
                      {format(new Date(score.score_date), 'EEEE, dd MMMM yyyy')}
                    </div>
                    {score.notes && (
                      <div className="text-xs font-body text-white/30 mt-0.5 italic">{score.notes}</div>
                    )}
                  </div>
                </div>
                <button onClick={() => handleDelete(score.id)}
                        className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}

          {/* Slots remaining */}
          {scores.length < 5 && (
            <div className="text-center py-4 text-xs font-body text-white/20">
              {5 - scores.length} slot{5 - scores.length !== 1 ? 's' : ''} remaining
            </div>
          )}
        </div>
      )}
    </div>
  )
}
