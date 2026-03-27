// src/pages/admin/AdminUsers.jsx
import { useEffect, useState } from 'react'
import { adminGetAllUsers } from '../../lib/supabase'
import { Search, Users } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminUsers() {
  const [users, setUsers]     = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminGetAllUsers().then(({ data }) => {
      setUsers(data || [])
      setFiltered(data || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!search) { setFiltered(users); return }
    setFiltered(users.filter(u =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    ))
  }, [search, users])

  const sub = (u) => u.subscriptions?.[0]

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white mb-1">Users</h1>
          <p className="font-body text-sm text-white/40">{users.length} registered users</p>
        </div>
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="text" placeholder="Search users…"
                 className="input-field pl-9 text-sm"
                 value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 card-glow animate-pulse" />)}
        </div>
      ) : (
        <div className="card-glow overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead className="border-b border-white/10 bg-white/2">
              <tr>
                <th className="text-left px-5 py-3 text-white/40 font-medium">User</th>
                <th className="text-left px-5 py-3 text-white/40 font-medium">Role</th>
                <th className="text-left px-5 py-3 text-white/40 font-medium">Plan</th>
                <th className="text-left px-5 py-3 text-white/40 font-medium">Status</th>
                <th className="text-left px-5 py-3 text-white/40 font-medium">Charity</th>
                <th className="text-left px-5 py-3 text-white/40 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-medium shrink-0">
                        {u.full_name?.[0] || u.email?.[0]}
                      </div>
                      <div>
                        <div className="text-white font-medium">{u.full_name || '—'}</div>
                        <div className="text-white/40 text-xs">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.role === 'admin' ? 'bg-gold-500/20 text-gold-400' : 'bg-white/10 text-white/50'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-4 text-white/60 capitalize">{sub(u)?.plan_type || '—'}</td>
                  <td className="px-5 py-4">
                    {sub(u) ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        sub(u).status === 'active'
                          ? 'bg-brand-500/20 text-brand-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>{sub(u).status}</span>
                    ) : (
                      <span className="text-xs text-white/30">No sub</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-white/60 text-xs">
                    {sub(u)?.charities?.name || '—'}
                    {sub(u)?.charity_percentage && (
                      <span className="text-white/30 ml-1">({sub(u).charity_percentage}%)</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-white/40 text-xs">
                    {format(new Date(u.created_at), 'dd MMM yy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-white/30 font-body text-sm">
              No users found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
