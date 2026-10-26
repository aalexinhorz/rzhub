import { useEffect, useState } from 'react'
import { supabase } from '../hooks/useAuth'
import PreviaBanner from './PreviaBanner'
import PostPartidoBanner from './PostPartidoBanner'

const DURACION_PARTIDO_MS = 2.5 * 3600_000
const REFRESCO_MS = 60_000
const CAMPOS = 'kickoff, fecha, rival, sede, goles_zaragoza, goles_rival'

const fechaMadrid = d => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })

function diaAnterior(ymd) {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

async function cargarPartidos() {
  const ahora = Date.now()
  const [{ data: prox }, { data: ult }] = await Promise.all([
    supabase.from('porra_partidos').select(CAMPOS)
      .gt('kickoff', new Date(ahora - DURACION_PARTIDO_MS).toISOString())
      .order('kickoff', { ascending: true }).limit(1),
    supabase.from('porra_partidos').select(CAMPOS)
      .lte('kickoff', new Date(ahora).toISOString())
      .order('kickoff', { ascending: false }).limit(1),
  ])
  const proximo = prox?.[0] || null
  let slugRival = null
  if (proximo) {
    const { data } = await supabase.from('rivales').select('id').eq('nombre', proximo.rival).maybeSingle()
    slugRival = data?.id || null
  }
  return { proximo, ultimo: ult?.[0] || null, slugRival }
}

const mismoPartido = (a, b) => (a?.kickoff ?? null) === (b?.kickoff ?? null)

// Banners de la home, sin tocar código partido a partido:
// - Desde el día anterior a cada partido (hora de Madrid) hasta que acaba:
//   previa de El Rincón Zaragocista + "Conoce al rival".
// - El resto del tiempo: post partido de Alexinho y aviso de notas del
//   último partido jugado (4 días cada uno; ver PostPartidoBanner).
export default function HomeBanners() {
  const [datos, setDatos] = useState(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    let activo = true
    function refrescar() {
      cargarPartidos().then(d => {
        if (!activo) return
        // Conserva la referencia si no ha cambiado de partido, para que los
        // banners hijos no vuelvan a pedir sus datos cada minuto.
        setDatos(prev => (prev && mismoPartido(prev.proximo, d.proximo) && mismoPartido(prev.ultimo, d.ultimo) && prev.slugRival === d.slugRival) ? prev : d)
        setTick(t => t + 1)
      })
    }
    refrescar()
    const id = setInterval(refrescar, REFRESCO_MS)
    return () => { activo = false; clearInterval(id) }
  }, [])

  if (!datos) return null
  const { proximo, ultimo, slugRival } = datos

  const enPrevia = proximo && fechaMadrid(Date.now()) >= diaAnterior(fechaMadrid(proximo.kickoff))
  if (enPrevia) {
    const desde = ultimo && !mismoPartido(ultimo, proximo) ? ultimo.kickoff : null
    return <PreviaBanner proximo={proximo} desde={desde} slugRival={slugRival} />
  }
  if (ultimo) return <PostPartidoBanner ultimo={ultimo} />
  return null
}
