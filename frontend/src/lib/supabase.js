// src/lib/supabase.js
// Supabase client — reads from environment variables
// Set these in your .env file or Vercel dashboard

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Guard: if env vars are missing, show a clear error in the console
// but DO NOT crash — use placeholder strings so createClient doesn't throw
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️  MISSING ENV VARS: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your .env file.\n' +
    'Copy .env.example → .env and fill in your Supabase project credentials.'
  )
}

export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

// ── Auth helpers ──────────────────────────────────────────────
export const signUp = (email, password, fullName) =>
  supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getSession = () => supabase.auth.getSession()

// ── Profile helpers ───────────────────────────────────────────
export const getProfile = (userId) =>
  supabase.from('profiles').select('*').eq('id', userId).single()

export const updateProfile = (userId, updates) =>
  supabase.from('profiles').update(updates).eq('id', userId)

// ── Subscription helpers ──────────────────────────────────────
export const getSubscription = (userId) =>
  supabase.from('subscriptions').select('*, charities(*)').eq('user_id', userId).single()

export const updateSubscriptionCharity = (subId, charityId, percentage) =>
  supabase
    .from('subscriptions')
    .update({ charity_id: charityId, charity_percentage: percentage })
    .eq('id', subId)

// ── Score helpers ─────────────────────────────────────────────
export const getScores = (userId) =>
  supabase
    .from('golf_scores')
    .select('*')
    .eq('user_id', userId)
    .order('score_date', { ascending: false })
    .limit(5)

export const addScore = (userId, score, scoreDate, notes = '') =>
  supabase.from('golf_scores').insert({ user_id: userId, score, score_date: scoreDate, notes })

export const deleteScore = (scoreId, userId) =>
  supabase.from('golf_scores').delete().eq('id', scoreId).eq('user_id', userId)

// ── Charity helpers ───────────────────────────────────────────
export const getCharities = () =>
  supabase
    .from('charities')
    .select('*, charity_events(*)')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })

export const getCharity = (slug) =>
  supabase
    .from('charities')
    .select('*, charity_events(*)')
    .eq('slug', slug)
    .single()

// ── Draw helpers ──────────────────────────────────────────────
export const getPublishedDraws = () =>
  supabase
    .from('draw_periods')
    .select('*')
    .eq('status', 'published')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })

export const getAllDraws = () =>
  supabase
    .from('draw_periods')
    .select('*')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })

export const getUserDrawEntries = (userId) =>
  supabase
    .from('draw_entries')
    .select('*, draw_periods(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

// ── Winner verification helpers ───────────────────────────────
export const getMyVerifications = (userId) =>
  supabase
    .from('winner_verifications')
    .select('*, draw_periods(period_label), draw_entries(prize_amount)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

export const uploadProof = async (userId, file) => {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`
  const { data, error } = await supabase.storage.from('winner-proofs').upload(path, file)
  if (error) throw error
  return data.path
}

export const submitVerification = (payload) =>
  supabase.from('winner_verifications').insert(payload)

// ── Admin helpers ─────────────────────────────────────────────
export const adminGetAllUsers = () =>
  supabase
    .from('profiles')
    .select('*, subscriptions(plan_type, status, plan_amount, charity_percentage, charities(name))')
    .order('created_at', { ascending: false })

export const adminGetPendingVerifications = () =>
  supabase
    .from('winner_verifications')
    .select('*, profiles(full_name, email), draw_periods(period_label), draw_entries(prize_amount, match_type)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

export const adminUpdateVerification = (id, updates) =>
  supabase.from('winner_verifications').update(updates).eq('id', id)

export const adminCreateDraw = (drawData) =>
  supabase.from('draw_periods').insert(drawData).select().single()

export const adminUpdateDraw = (id, updates) =>
  supabase.from('draw_periods').update(updates).eq('id', id)

export const adminGetAnalytics = () =>
  supabase.from('admin_analytics').select('*').single()

export const adminManageCharity = {
  create: (data) => supabase.from('charities').insert(data).select().single(),
  update: (id, data) => supabase.from('charities').update(data).eq('id', id),
  delete: (id) => supabase.from('charities').update({ is_active: false }).eq('id', id),
}
