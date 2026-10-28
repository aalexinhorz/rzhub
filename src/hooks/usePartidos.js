import { useEffect, useState } from 'react'
import { supabase } from './useAuth'
import { calcularVentana } from '../lib/notasSeo'

// La regla de la ventana de votación vive en lib/notasSeo.js (la usa
// también el prerender SEO); se reexporta para no tocar los imports.
export { calcularVentana }

export default function usePartidos() {
  const [partidos, setPartidos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('partidos')
      .select('*')
      .order('fecha', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error(error); setLoading(false); return }

        const porFechaAsc = [...(data || [])].sort((a, b) => a.fecha < b.fecha ? -1 : 1)
        const conVentana = (data || []).map(p => {
          const idx = porFechaAsc.findIndex(x => x.partido_id === p.partido_id)
          const siguiente = porFechaAsc[idx + 1] || null
          return { ...p, ...calcularVentana(p, siguiente) }
        })

        setPartidos(conVentana)
        setLoading(false)
      })
  }, [])

  return { partidos, loading }
}

export function usePartido(partidoId) {
  const [partido, setPartido] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!partidoId) { setLoading(false); return }
    setLoading(true)

    supabase
      .from('partidos')
      .select('*')
      .eq('partido_id', partidoId)
      .single()
      .then(async ({ data, error }) => {
        if (error || !data) { setPartido(null); setLoading(false); return }

        const { data: siguientes } = await supabase
          .from('partidos')
          .select('fecha')
          .gt('fecha', data.fecha)
          .order('fecha', { ascending: true })
          .limit(1)

        setPartido({ ...data, ...calcularVentana(data, siguientes?.[0] || null) })
        setLoading(false)
      })
  }, [partidoId])

  return { partido, loading }
}
