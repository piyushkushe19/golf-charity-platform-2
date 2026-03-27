// src/components/layout/AdminLayout.jsx
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { LayoutDashboard, Users, Trophy, Heart, Award, LogOut, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/admin',            label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { to: '/admin/users',      label: 'Users',      icon: Users },
  { to: '/admin/draws',      label: 'Draws',      icon: Trophy },
  { to: '/admin/charities',  label: 'Charities',  icon: Heart },
  { to: '/admin/winners',    label: 'Winners',    icon: Award },
]

export default function AdminLayout() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out')
    navigate('/')
  }

  const isActive = (item) => item.exact
    ? location.pathname === item.to
    : location.pathname.startsWith(item.to)

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="w-64 shrink-0 bg-dark-800 border-r border-white/5 flex flex-col">
        {/* Brand */}
        <div className="p-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Trophy size={16} className="text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-base text-white">ParScore</div>
              <div className="text-xs font-body text-white/30">Admin Panel</div>
            </div>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            return (
              <Link key={item.to} to={item.to}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-body transition-all ${
                      active
                        ? 'bg-brand-500/15 text-brand-400 font-medium'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}>
                <Icon size={16} />
                {item.label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            )
          })}
        </nav>

        {/* Profile */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-medium">
              {profile?.full_name?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-body text-white/80 truncate">{profile?.full_name}</div>
              <div className="text-xs font-body text-brand-400">Administrator</div>
            </div>
          </div>
          <button onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm
                             font-body text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
