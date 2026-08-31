import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
)

export { supabase }

export default function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(authUser) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, name, es_redactor, es_fotografo')
      .eq('id', authUser.id)
      .single()
    if (data) {
      setProfile(data)
    } else {
      const nuevoPerfil = {
        id: authUser.id,
        name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
        username: authUser.email ? authUser.email.split('@')[0] : null,
      }
      await supabase.from('profiles').insert(nuevoPerfil)
      setProfile(nuevoPerfil)
    }
    setLoading(false)
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user)
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href }
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  return { user, profile, loading, signInWithGoogle, signOut, refreshProfile }
}