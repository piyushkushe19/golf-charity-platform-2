// src/pages/dashboard/MyCharityPage.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getCharities, updateSubscriptionCharity } from '../../lib/supabase'
import { Heart, Search, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MyCharityPage() {
  const { subscription, refreshSubscription } = useAuth()
  const [charities, setCharities]     = useState([])
  const [search, setSearch]           = useState('')
  const [selectedId, setSelectedId]   = useState(subscription?.charity_id || '')
  const [percentage, setPercentage]   = useState(subscription?.charity_percentage || 10)
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    getCharities().then(({ data }) => setCharities(data || []))
  }, [])

  const filtered = charities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async () => {
    if (!selectedId) { toast.error('Please select a charity'); return }
    if (!subscription?.id) { toast.error('No active subscription found'); return }
    setSaving(true)
    const { error } = await updateSubscriptionCharity(subscription.id, selectedId, percentage)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Charity preference updated!')
    refreshSubscription()
  }

  const currentCharity = charities.find(c => c.id === subscription?.charity_id)

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white mb-1">My Charity</h1>
        <p className="font-body text-sm text-white/40">
          Choose the charity that receives a portion of your subscription each month
        </p>
      </div>

      {/* Current charity */}
      {currentCharity && (
        <div className="card-glow p-5 mb-6 border border-brand-500/20 bg-brand-500/5">
          <div className="flex items-center gap-3 mb-1">
            <CheckCircle size={16} className="text-brand-400" />
            <span className="font-body text-xs text-brand-400 uppercase tracking-wide">Currently supporting</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-xl text-white">{currentCharity.name}</div>
              <div className="text-xs font-body text-white/40">{currentCharity.category}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-2xl text-pink-400">{subscription?.charity_percentage}%</div>
              <div className="text-xs font-body text-white/30">of subscription</div>
            </div>
          </div>
        </div>
      )}

      {/* Percentage slider */}
      <div className="card-glow p-6 mb-6">
        <h3 className="font-display text-lg text-white mb-4">Contribution percentage</h3>
        <div className="flex items-center gap-4">
          <input type="range" min="10" max="100" step="5"
                 className="flex-1 accent-brand-500"
                 value={percentage}
                 onChange={e => setPercentage(parseInt(e.target.value))} />
          <div className="text-right w-20">
            <div className="font-mono text-2xl text-pink-400">{percentage}%</div>
            <div className="text-xs font-body text-white/30">to charity</div>
          </div>
        </div>
        <div className="flex justify-between text-xs font-body text-white/30 mt-2">
          <span>Min 10%</span>
          <span>Max 100%</span>
        </div>
        {subscription && (
          <div className="mt-3 text-xs font-body text-white/40">
            ≈ £{(subscription.plan_amount * (percentage / 100)).toFixed(2)}/month to charity
          </div>
        )}
      </div>

      {/* Charity picker */}
      <div className="card-glow p-6 mb-6">
        <h3 className="font-display text-lg text-white mb-4">Choose a charity</h3>
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="text" placeholder="Search charities…"
                 className="input-field pl-9 text-sm"
                 value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filtered.map(charity => (
            <button key={charity.id} onClick={() => setSelectedId(charity.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      selectedId === charity.id
                        ? 'bg-brand-500/15 border border-brand-500/30'
                        : 'bg-white/3 border border-white/5 hover:bg-white/5'
                    }`}>
              {charity.image_url && (
                <img src={charity.image_url} alt={charity.name}
                     className="w-10 h-10 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-body text-sm text-white font-medium truncate">{charity.name}</div>
                <div className="text-xs font-body text-white/40">{charity.category}</div>
              </div>
              {selectedId === charity.id && (
                <CheckCircle size={16} className="text-brand-400 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving || !selectedId}
              className="btn-primary w-full justify-center py-4">
        <Heart size={16} />
        {saving ? 'Saving…' : 'Save Charity Preference'}
      </button>
    </div>
  )
}
