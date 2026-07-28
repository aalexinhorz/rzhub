import { useState, useEffect } from 'react'
import { supabase } from './useAuth'

export default function useNextAwayPartido() {
  const [partido, setPartido] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('porra_partidos')
      .select('*')
      .neq('sede', 'local')
      .gt('kickoff', new Date().toISOString())
      .order('kickoff', { ascending: true })
      .limit(1)
      .then(({ data, error }) => {
        if (error) console.error('Error cargando próximo partido fuera:', error)
        setPartido(data?.[0] || null)
        setLoading(false)
      })
  }, [])

  return { partido, loading }
}
