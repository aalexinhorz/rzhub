import { useEffect, useState } from 'react'
import { supabase } from './useAuth'

const DIAS_VOTACION = 7

// Abierta desde que se juega el partido hasta lo que ocurra antes:
// DIAS_VOTACION días después, o el día del siguiente partido.
// "futuro" y "cerrada" son estados distintos aunque en ambos abierta=false:
// uno es "todavía no ha pasado" y el otro "ya pasó y venció el plazo".
// votacion_cerrada permite cerrarla a mano antes de que llegue ese plazo
// (p. ej. si se quiere dar por zanjada la votación de un partido).
function calcularVentana(partido, siguiente) {
  const inicio = new Date(`${partido.fecha}T00:00:00`)

  if (partido.votacion_cerrada) {
    const abierta = false
    const estado = new Date() < inicio ? 'futuro' : 'cerrada'
    return { abierta, cierre: inicio, estado }
  }

  const limitePorDias = new Date(inicio)
  limitePorDias.setDate(limitePorDias.getDate() + DIAS_VOTACION)

  const limitePorSiguiente = siguiente ? new Date(`${siguiente.fecha}T00:00:00`) : null
  const cierre = limitePorSiguiente && limitePorSiguiente < limitePorDias ? limitePorSiguiente : limitePorDias

  const ahora = new Date()
  const abierta = ahora >= inicio && ahora < cierre
  const estado = ahora < inicio ? 'futuro' : abierta ? 'abierta' : 'cerrada'

  return { abierta, cierre, estado }
}

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
