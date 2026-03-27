// src/pages/dashboard/WinningsPage.jsx
// Shows wins + winner verification upload flow

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getMyVerifications, getUserDrawEntries, uploadProof, submitVerification } from '../../lib/supabase'
import { Award, Upload, CheckCircle, Clock, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const StatusBadge = ({ status, payoutStatus }) => {
  if (status === 'approved' && payoutStatus === 'paid')
    return <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Paid</span>
  if (status === 'approved')
    return <span className="text-xs bg-gold-500/20 text-gold-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={10} /> Approved — payout pending</span>
  if (status === 'rejected')
    return <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1"><XCircle size={10} /> Rejected</span>
  return <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={10} /> Pending review</span>
}

export default function WinningsPage() {
  const { user } = useAuth()
  const [verifications, setVerifications] = useState([])
  const [unverifiedWins, setUnverifiedWins] = useState([])
  const [loading, setLoading]   = useState(true)
  const [uploading, setUploading] = useState(null) // entry id being uploaded
  const fileRef = useRef()

  const loadData = async () => {
    const [{ data: verifs }, { data: entries }] = await Promise.all([
      getMyVerifications(user.id),
      getUserDrawEntries(user.id),
    ])
    setVerifications(verifs || [])
    // Wins without a verification submission yet
    const verifiedEntryIds = new Set((verifs || []).map(v => v.draw_entry_id))
    const wins = (entries || []).filter(e =>
      e.match_type && e.match_type !== 'no_match' && !verifiedEntryIds.has(e.id)
    )
    setUnverifiedWins(wins)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [user])

  const handleUpload = async (entryId, drawPeriodId, file) => {
    if (!file) return
    setUploading(entryId)
    try {
      const proofPath = await uploadProof(user.id, file)
      await submitVerification({
        draw_entry_id:  entryId,
        user_id:        user.id,
        draw_period_id: drawPeriodId,
        proof_url:      proofPath,
        proof_filename: file.name,
      })
      toast.success('Proof submitted! We\'ll review it within 48 hours.')
      loadData()
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
    } finally {
      setUploading(null)
    }
  }

  const totalPaid = verifications
    .filter(v => v.payout_status === 'paid')
    .reduce((sum, v) => sum + (v.draw_entries?.prize_amount || 0), 0)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white mb-1">Winnings</h1>
        <p className="font-body text-sm text-white/40">Track your prizes and submit verification proofs</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total paid', value: `£${totalPaid.toFixed(2)}`, color: 'text-brand-400' },
          { label: 'Pending review', value: verifications.filter(v => v.status === 'pending').length, color: 'text-gold-400' },
          { label: 'Unsubmitted wins', value: unverifiedWins.length, color: 'text-pink-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card-glow p-4 text-center">
            <div className={`font-mono text-2xl font-bold ${color} mb-1`}>{value}</div>
            <div className="text-xs font-body text-white/30">{label}</div>
          </div>
        ))}
      </div>

      {/* Wins needing proof */}
      {unverifiedWins.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-xl text-white mb-4">
            🏆 Submit Proof — {unverifiedWins.length} win{unverifiedWins.length !== 1 ? 's' : ''} pending
          </h2>
          <div className="space-y-4">
            {unverifiedWins.map(entry => (
              <div key={entry.id} className="card-glow p-5 border border-gold-500/20 bg-gold-500/5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="font-display text-lg text-white">{entry.draw_periods?.period_label}</div>
                    <span className={`prize-badge-${entry.match_type === '5_match' ? '5' : entry.match_type === '4_match' ? '4' : '3'} mt-2 inline-block`}>
                      {entry.match_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="font-mono text-2xl text-gold-400">
                    £{entry.prize_amount?.toFixed(2)}
                  </div>
                </div>
                <p className="text-xs font-body text-white/40 mb-4">
                  Upload a screenshot from your golf club's scoring system confirming your scores.
                </p>
                <label className={`flex items-center gap-2 cursor-pointer btn-primary w-full justify-center ${uploading === entry.id ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Upload size={15} />
                  {uploading === entry.id ? 'Uploading…' : 'Upload Proof Screenshot'}
                  <input type="file" accept="image/*" className="hidden"
                         onChange={e => handleUpload(entry.id, entry.draw_period_id, e.target.files[0])} />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification history */}
      <div>
        <h2 className="font-display text-xl text-white mb-4">Submission history</h2>
        {verifications.length === 0 ? (
          <div className="card-glow p-10 text-center">
            <Award size={32} className="text-white/20 mx-auto mb-4" />
            <p className="font-body text-white/40 text-sm">
              No submissions yet. Win a draw to unlock the verification flow!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {verifications.map(v => (
              <div key={v.id} className="card-glow p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-display text-lg text-white mb-1">
                      {v.draw_periods?.period_label}
                    </div>
                    <div className="font-mono text-sm text-gold-400 mb-2">
                      £{v.draw_entries?.prize_amount?.toFixed(2)}
                    </div>
                    <StatusBadge status={v.status} payoutStatus={v.payout_status} />
                  </div>
                  <div className="text-right text-xs font-body text-white/30">
                    Submitted {format(new Date(v.created_at), 'dd MMM yyyy')}
                    {v.reviewed_at && (
                      <div>Reviewed {format(new Date(v.reviewed_at), 'dd MMM yyyy')}</div>
                    )}
                  </div>
                </div>
                {v.admin_notes && (
                  <div className="mt-3 p-3 bg-white/3 rounded-lg text-xs font-body text-white/50">
                    <span className="text-white/30">Admin note: </span>{v.admin_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
