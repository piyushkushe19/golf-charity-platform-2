// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser]                 = useState(null)
  const [profile, setProfile]           = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading]           = useState(true)
  const initialised = useRef(false)
  const fetchingRef = useRef(false)

  const fetchUserData = useCallback(async (userId) => {
    // Prevent duplicate concurrent fetches
    if (fetchingRef.current) return
    fetchingRef.current = true

    try {
      const [profileRes, subRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('subscriptions')
          .select('*, charities(*)')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle(),
      ])

      // Auto-create profile if missing
      if (!profileRes.data && !profileRes.error) {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id:        userId,
            email:     authUser?.email || '',
            full_name: authUser?.user_metadata?.full_name || '',
            role:      'subscriber',
          })
          .select()
          .single()
        setProfile(newProfile ?? null)
      } else {
        setProfile(profileRes.data ?? null)
      }

      setSubscription(subRes.data ?? null)
    } catch (err) {
      console.error('fetchUserData error:', err)
      setProfile(null)
      setSubscription(null)
    } finally {
      fetchingRef.current = false
    }
  }, [])

  const initialiseFromSession = useCallback(async (session) => {
    const currentUser = session?.user ?? null
    setUser(currentUser)
    if (currentUser) {
      await fetchUserData(currentUser.id)
    } else {
      setProfile(null)
      setSubscription(null)
    }
    setLoading(false)
  }, [fetchUserData])

  useEffect(() => {
    // SIGN_OUT event: immediately clear state without re-fetching
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setSubscription(null)
          setLoading(false)
          initialised.current = false
          return
        }

        if (!initialised.current) {
          initialised.current = true
          await initialiseFromSession(session)
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          await initialiseFromSession(session)
        }
      }
    )

    // Fallback if listener doesn't fire within 2s
    const fallback = setTimeout(async () => {
      if (!initialised.current) {
        initialised.current = true
        const { data: { session } } = await supabase.auth.getSession()
        await initialiseFromSession(session)
      }
    }, 2000)

    return () => {
      clearTimeout(fallback)
      authListener.unsubscribe()
    }
  }, [initialiseFromSession])

  const isAdmin      = profile?.role === 'admin'
  const isSubscribed = subscription?.status === 'active'

  const refreshSubscription = useCallback(async () => {
    if (user) await fetchUserData(user.id)
  }, [user, fetchUserData])

  return (
    <AuthContext.Provider value={{
      user, profile, subscription, loading,
      isAdmin, isSubscribed, refreshSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
