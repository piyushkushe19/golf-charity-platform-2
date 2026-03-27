// src/App.jsx
import { Component, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import AdminLayout from './components/layout/AdminLayout'

import HomePage       from './pages/HomePage'
import CharitiesPage  from './pages/CharitiesPage'
import CharityDetail  from './pages/CharityDetail'
import DrawsPage      from './pages/DrawsPage'
import HowItWorksPage from './pages/HowItWorksPage'
import LoginPage      from './pages/LoginPage'
import SignupPage     from './pages/SignupPage'
import SubscribePage  from './pages/SubscribePage'

import DashboardPage  from './pages/dashboard/DashboardPage'
import ScoresPage     from './pages/dashboard/ScoresPage'
import MyDrawsPage    from './pages/dashboard/MyDrawsPage'
import MyCharityPage  from './pages/dashboard/MyCharityPage'
import WinningsPage   from './pages/dashboard/WinningsPage'

import AdminDashboard  from './pages/admin/AdminDashboard'
import AdminUsers      from './pages/admin/AdminUsers'
import AdminDraws      from './pages/admin/AdminDraws'
import AdminCharities  from './pages/admin/AdminCharities'
import AdminWinners    from './pages/admin/AdminWinners'

// ── Shared loading screen ─────────────────────────────────────
const LoadingScreen = () => (
  <div className="min-h-screen bg-dark-900 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      <p className="text-white/40 font-body text-sm">Loading…</p>
    </div>
  </div>
)

// ── Error boundary ────────────────────────────────────────────
class ErrorBoundary extends Component {
  state = { hasError: false, error: null }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(error, info) { console.error('Render error:', error, info) }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="max-w-lg text-center card-glow p-8">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="font-display text-2xl text-white mb-3">Something went wrong</h1>
          <p className="font-mono text-sm text-red-400 bg-red-500/10 p-3 rounded-lg mb-6 text-left">
            {this.state.error?.message}
          </p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.href = '/' }}
                  className="btn-primary mx-auto">
            Go to Home
          </button>
        </div>
      </div>
    )
    return this.props.children
  }
}

// ── Route guards ──────────────────────────────────────────────

// Must be logged in
const RequireAuth = () => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

// Must be logged in + active subscription
// Renders Layout (with nav/footer) as the shell
const RequireSubscription = () => {
  const { user, isSubscribed, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!isSubscribed) return <Navigate to="/subscribe" replace />
  return <Layout />
}

// Must be admin
const RequireAdmin = () => {
  const { user, profile, isAdmin, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  // Profile still loading (shouldn't happen but guard anyway)
  if (user && profile === null && !loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="w-full max-w-xl card-glow p-8">
          <div className="text-3xl mb-3">🔍 Profile not found</div>
          <p className="font-body text-sm text-white/60 mb-4">
            Logged in as <span className="text-brand-400 font-mono">{user.email}</span>
          </p>
          <p className="font-body text-sm text-white/50 mb-4">Run this in Supabase SQL Editor:</p>
          <pre className="bg-dark-700 text-brand-400 text-xs p-4 rounded-xl overflow-x-auto mb-4 whitespace-pre-wrap">{`-- Disable RLS (for development)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;

-- Create your profile
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('${user.id}', '${user.email}', 'Admin', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';`}
          </pre>
          <button onClick={() => window.location.reload()} className="btn-primary">Reload</button>
        </div>
      </div>
    )
  }

  if (!isAdmin) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="max-w-md card-glow p-8 text-center">
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="font-display text-xl text-white mb-2">Not an admin</h2>
        <p className="font-body text-sm text-white/50 mb-4">
          Role: <span className="font-mono text-gold-400">"{profile?.role}"</span>
        </p>
        <pre className="bg-dark-700 text-brand-400 text-xs p-4 rounded-xl text-left mb-4">{`UPDATE public.profiles SET role = 'admin'
WHERE id = '${user.id}';`}</pre>
        <p className="text-xs text-white/30 mb-4">Then sign out and back in.</p>
        <a href="/" className="btn-secondary text-sm">← Home</a>
      </div>
    </div>
  )

  return <AdminLayout />
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public — always wrapped in Layout */}
        <Route element={<Layout />}>
          <Route path="/"                element={<HomePage />} />
          <Route path="/charities"       element={<CharitiesPage />} />
          <Route path="/charities/:slug" element={<CharityDetail />} />
          <Route path="/draws"           element={<DrawsPage />} />
          <Route path="/how-it-works"    element={<HowItWorksPage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/signup"          element={<SignupPage />} />
        </Route>

        {/* Subscribe — needs login, not subscription */}
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/subscribe" element={<SubscribePage />} />
          </Route>
        </Route>

        {/* Subscriber dashboard — needs login + subscription */}
        <Route path="/dashboard" element={<RequireSubscription />}>
          <Route index           element={<DashboardPage />} />
          <Route path="scores"   element={<ScoresPage />} />
          <Route path="draws"    element={<MyDrawsPage />} />
          <Route path="charity"  element={<MyCharityPage />} />
          <Route path="winnings" element={<WinningsPage />} />
        </Route>

        {/* Admin panel — needs admin role */}
        <Route path="/admin" element={<RequireAdmin />}>
          <Route index            element={<AdminDashboard />} />
          <Route path="users"     element={<AdminUsers />} />
          <Route path="draws"     element={<AdminDraws />} />
          <Route path="charities" element={<AdminCharities />} />
          <Route path="winners"   element={<AdminWinners />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}
