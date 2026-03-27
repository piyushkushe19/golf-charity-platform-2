// src/pages/admin/AdminWinners.jsx
import { useEffect, useState } from 'react'
import { adminGetPendingVerifications, adminUpdateVerification, supabase } from '../../lib/supabase'
import { CheckCircle, XCircle, DollarSign, Eye } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

// ── StatusBadge defined OUTSIDE component to prevent "destroy is not a function" ──
const STATUS_STYLES = {
  pending:  'bg-orange-500/20 text-orange-400',
  approved: 'bg-gold-500/20 text-gold-400',
  approved_paid: 'bg-brand-500/20 text-brand-400',
  rejected: 'bg-red-500/20 text-red-400',
}

const StatusBadge = ({ status, payout }) => {
  const key   = status === 'approved' && payout === 'paid' ? 'approved_paid' : status
  const label = status === 'approved' && payout === 'paid' ? 'Paid' : status
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-body capitalize ${STATUS_STYLES[key] || STATUS_STYLES.pending}`}>
      {label}
    </span>
  )
}

const MatchBadge = ({ matchType }) => {
  if (!matchType) return null
  const tier = matchType === '5_match' ? '5' : matchType === '4_match' ? '4' : '3'
  return (
    <span className={`prize-badge-${tier}`}>
      {matchType.replace('_', ' ')}
    </span>
  )
}

export default function AdminWinners() {
  const [verifications, setVerifications] = useState([])
  const [allVerifs, setAllVerifs]         = useState([])
  const [tab, setTab]                     = useState('pending')
  const [loading, setLoading]             = useState(true)
  const [actionNote, setActionNote]       = useState({})
  const [proofUrls, setProofUrls]         = useState({})

  const loadData = async () => {
    setLoading(true)
    const [pendingRes, allRes] = await Promise.all([
      adminGetPendingVerifications(),
      supabase
        .from('winner_verifications')
        .select('*, profiles(full_name, email), draw_periods(period_label), draw_entries(prize_amount, match_type)')
        .order('created_at', { ascending: false })
        .limit(50),
    ])
    setVerifications(pendingRes.data || [])
    setAllVerifs(allRes.data || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const getProofUrl = async (v) => {
    if (!v.proof_url) return
    if (proofUrls[v.id]) { window.open(proofUrls[v.id], '_blank'); return }
    const { data } = await supabase.storage
      .from('winner-proofs')
      .createSignedUrl(v.proof_url, 3600)
    if (data?.signedUrl) {
      setProofUrls(p => ({ ...p, [v.id]: data.signedUrl }))
      window.open(data.signedUrl, '_blank')
    }
  }

  const handleReview = async (id, status) => {
    const { error } = await adminUpdateVerification(id, {
      status,
      admin_notes: actionNote[id] || null,
      reviewed_at: new Date().toISOString(),
    })
    if (error) { toast.error(error.message); return }
    toast.success(`Submission ${status}`)
    loadData()
  }

  const handleMarkPaid = async (id) => {
    const { error } = await adminUpdateVerification(id, {
      payout_status: 'paid',
      payout_date:   new Date().toISOString(),
    })
    if (error) { toast.error(error.message); return }
    toast.success('Marked as paid!')
    loadData()
  }

  const displayed = tab === 'pending' ? verifications : allVerifs

  return (
    <div className="p-8 max-w-5xl">

      {/* Header + tabs */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white mb-1">Winners</h1>
          <p className="font-body text-sm text-white/40">
            {verifications.length} pending verification{verifications.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {[
            { key: 'pending', label: `Pending (${verifications.length})` },
            { key: 'all',     label: 'All' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-body transition-colors ${
                tab === t.key
                  ? 'bg-brand-500 text-white'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-36 card-glow animate-pulse" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="card-glow p-12 text-center text-white/30 font-body">
          {tab === 'pending' ? 'No pending verifications 🎉' : 'No submissions yet'}
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map(v => (
            <div key={v.id} className="card-glow p-5">
              <div className="flex flex-col sm:flex-row gap-4">

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-display text-lg text-white">
                        {v.profiles?.full_name || v.profiles?.email}
                      </div>
                      <div className="text-xs font-body text-white/40">{v.profiles?.email}</div>
                    </div>
                    <StatusBadge status={v.status} payout={v.payout_status} />
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs font-body mb-3">
                    <span className="text-white/40">
                      Draw: <span className="text-white">{v.draw_periods?.period_label}</span>
                    </span>
                    <span className="text-white/40 flex items-center gap-1">
                      Match: <MatchBadge matchType={v.draw_entries?.match_type} />
                    </span>
                    <span className="text-white/40">
                      Prize: <span className="text-gold-400 font-mono">
                        £{v.draw_entries?.prize_amount?.toFixed(2) || '0.00'}
                      </span>
                    </span>
                    <span className="text-white/40">
                      {format(new Date(v.created_at), 'dd MMM yyyy')}
                    </span>
                  </div>

                  {v.proof_url && (
                    <button
                      onClick={() => getProofUrl(v)}
                      className="flex items-center gap-1.5 text-xs font-body text-brand-400 hover:underline mb-3"
                    >
                      <Eye size={12} /> View proof: {v.proof_filename || 'screenshot'}
                    </button>
                  )}

                  {v.admin_notes && (
                    <div className="text-xs font-body text-white/40 bg-white/5 p-2 rounded-lg">
                      Note: {v.admin_notes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {v.status === 'pending' && (
                  <div className="shrink-0 flex flex-col gap-2 min-w-[180px]">
                    <input
                      type="text"
                      placeholder="Admin note (optional)"
                      className="input-field text-xs py-2"
                      value={actionNote[v.id] || ''}
                      onChange={e => setActionNote(p => ({ ...p, [v.id]: e.target.value }))}
                    />
                    <button
                      onClick={() => handleReview(v.id, 'approved')}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl
                                 bg-brand-500/15 text-brand-400 text-sm font-body hover:bg-brand-500/25 transition-colors"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleReview(v.id, 'rejected')}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl
                                 bg-red-500/15 text-red-400 text-sm font-body hover:bg-red-500/25 transition-colors"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}

                {v.status === 'approved' && v.payout_status === 'pending' && (
                  <div className="shrink-0">
                    <button
                      onClick={() => handleMarkPaid(v.id)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold-500/15
                                 text-gold-400 text-sm font-body hover:bg-gold-500/25 transition-colors"
                    >
                      <DollarSign size={14} /> Mark Paid
                    </button>
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
