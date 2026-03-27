// src/components/layout/Layout.jsx
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Menu, X, Trophy, Heart, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Layout() {
  const { user, profile, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
    setDropdownOpen(false)
  }, [location.pathname])

  const handleSignOut = async () => {
    setDropdownOpen(false)
    setMobileOpen(false)
    try {
      await supabase.auth.signOut()
      toast.success('Signed out successfully')
    } catch (err) {
      console.error('Sign out error:', err)
      toast.error('Sign out failed')
    }
    // Navigate after signout — AuthContext SIGNED_OUT event clears state
    navigate('/', { replace: true })
  }

  const navLinks = [
    { to: '/how-it-works', label: 'How It Works' },
    { to: '/charities',    label: 'Charities' },
    { to: '/draws',        label: 'Draws' },
  ]

  const userName  = profile?.full_name || user?.email || ''
  const userInitial = userName[0]?.toUpperCase() || '?'

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl"
              style={{ background: 'rgba(6,10,15,0.88)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white tracking-tight">
              Par<span className="text-brand-400">Score</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                    className={`px-4 py-2 rounded-lg text-sm font-body transition-colors ${
                      location.pathname === to
                        ? 'text-brand-400 bg-brand-500/10'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-body"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-medium text-white">
                    {userInitial}
                  </div>
                  <span className="text-white/80 max-w-[120px] truncate">{userName}</span>
                  <ChevronDown size={14} className={`text-white/40 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-dark-700 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    <Link to="/dashboard"
                          className="flex items-center gap-2 px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors">
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    {isAdmin && (
                      <Link to="/admin"
                            className="flex items-center gap-2 px-4 py-3 text-sm text-brand-400 hover:bg-white/5 transition-colors">
                        <Trophy size={15} /> Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-white/5" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login"  className="btn-secondary text-sm px-4 py-2">Sign In</Link>
                <Link to="/signup" className="btn-primary  text-sm px-4 py-2">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-white/60" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 bg-dark-800">
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map(({ to, label }) => (
                <Link key={to} to={to}
                      className="px-4 py-3 rounded-lg text-sm font-body text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                  {label}
                </Link>
              ))}
              <div className="border-t border-white/5 mt-2 pt-2 flex flex-col gap-2">
                {user ? (
                  <>
                    <div className="px-4 py-2 text-xs font-body text-white/30">{user.email}</div>
                    <Link to="/dashboard" className="btn-secondary justify-center">Dashboard</Link>
                    {isAdmin && (
                      <Link to="/admin" className="btn-secondary justify-center text-brand-400">Admin Panel</Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                                 text-sm font-body text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login"  className="btn-secondary justify-center">Sign In</Link>
                    <Link to="/signup" className="btn-primary  justify-center">Get Started</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-dark-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                  <Trophy size={16} className="text-white" />
                </div>
                <span className="font-display font-bold text-xl text-white">Par<span className="text-brand-400">Score</span></span>
              </div>
              <p className="text-white/40 text-sm font-body leading-relaxed max-w-sm">
                The subscription platform where every golf score creates impact. Play. Give. Win.
              </p>
            </div>
            <div>
              <h4 className="text-white/80 font-body font-medium text-sm mb-3">Platform</h4>
              <ul className="space-y-2 text-sm font-body">
                <li><Link to="/how-it-works" className="text-white/40 hover:text-brand-400 transition-colors">How It Works</Link></li>
                <li><Link to="/draws"        className="text-white/40 hover:text-brand-400 transition-colors">Monthly Draws</Link></li>
                <li><Link to="/subscribe"    className="text-white/40 hover:text-brand-400 transition-colors">Subscribe</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white/80 font-body font-medium text-sm mb-3">Giving</h4>
              <ul className="space-y-2 text-sm font-body">
                <li><Link to="/charities" className="text-white/40 hover:text-brand-400 transition-colors">Our Charities</Link></li>
                <li>
                  <Link to="/charities" className="text-white/40 hover:text-brand-400 transition-colors flex items-center gap-1">
                    <Heart size={12} /> Donate Directly
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/30 text-xs font-body">© 2026 ParScore. All rights reserved.</p>
            <p className="text-white/20 text-xs font-body">Built with ♥ for golf & good causes</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
