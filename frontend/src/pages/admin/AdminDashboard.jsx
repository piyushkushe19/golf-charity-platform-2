// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from 'react'
import { adminGetAnalytics, getAllDraws } from '../../lib/supabase'
import { Users, Trophy, Heart, Award, DollarSign, Clock } from 'lucide-react'

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card-glow p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <div className="text-xs font-body text-white/40 uppercase tracking-wide mb-1">{label}</div>
      <div className="font-mono text-2xl text-white font-bold">{value}</div>
    </div>
  </div>
)

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [draws, setDraws]         = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([adminGetAnalytics(), getAllDraws()]).then(
      ([{ data: a }, { data: d }]) => {
        setAnalytics(a)
        setDraws(d || [])
        setLoading(false)
      }
    )
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white mb-1">Admin Dashboard</h1>
        <p className="font-body text-sm text-white/40">Platform overview and key metrics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <StatCard icon={Users}      label="Total Users"           value={analytics?.total_users || 0}            color="bg-blue-600" />
        <StatCard icon={DollarSign} label="Active Subscribers"    value={analytics?.active_subscribers || 0}     color="bg-brand-600" />
        <StatCard icon={Trophy}     label="Published Draws"       value={analytics?.published_draws || 0}        color="bg-gold-600" />
        <StatCard icon={Heart}      label="Active Charities"      value={analytics?.active_charities || 0}       color="bg-pink-600" />
        <StatCard icon={Award}      label="Total Prizes Awarded"  value={`£${(analytics?.total_prizes_awarded || 0).toFixed(2)}`} color="bg-purple-600" />
        <StatCard icon={Clock}      label="Pending Verifications" value={analytics?.pending_verifications || 0}  color="bg-orange-600" />
      </div>

      {/* Draw status table */}
      <div className="card-glow p-6">
        <h2 className="font-display text-xl text-white mb-5">All Draw Periods</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-3 text-white/40 font-medium">Period</th>
                <th className="pb-3 text-white/40 font-medium">Status</th>
                <th className="pb-3 text-white/40 font-medium">Logic</th>
                <th className="pb-3 text-white/40 font-medium text-right">Pool</th>
                <th className="pb-3 text-white/40 font-medium text-right">Subscribers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {draws.map(draw => (
                <tr key={draw.id}>
                  <td className="py-3 font-display text-white">{draw.period_label}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      draw.status === 'published' ? 'bg-brand-500/20 text-brand-400' :
                      draw.status === 'simulated' ? 'bg-gold-500/20 text-gold-400' :
                      'bg-white/10 text-white/40'
                    }`}>
                      {draw.status}
                    </span>
                  </td>
                  <td className="py-3 text-white/60 capitalize">{draw.draw_logic}</td>
                  <td className="py-3 text-right font-mono text-white/80">£{draw.total_pool?.toFixed(2)}</td>
                  <td className="py-3 text-right text-white/60">{draw.active_subscriber_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
