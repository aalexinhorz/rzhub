import { supabase } from '../hooks/useAuth'
import { DURACION_PARTIDO_MS } from './reglasPartido'

// Qué partido "toca" en cada momento, compartido por los banners de la home
// (HomeBanners), el Vestuario Blanquillo y /proximo-partido, para que nunca
// se contradigan. Las reglas puras viven en reglasPartido.js.
export { DURACION_PARTIDO_MS, HORAS_ANTES_SIGUIENTE, enVisperaOPartido, elegirPartidoActual } from './reglasPartido'

// `proximo`: primer partido que aún no ha terminado (puede estar en juego).
// `ultimo`: último partido cuyo saque inicial ya pasó.
export async function cargarProximoYUltimo(campos = '*') {
  const ahora = Date.now()
  const [{ data: prox }, { data: ult }] = await Promise.all([
    supabase.from('porra_partidos').select(campos)
      .gt('kickoff', new Date(ahora - DURACION_PARTIDO_MS).toISOString())
      .order('kickoff', { ascending: true }).limit(1),
    supabase.from('porra_partidos').select(campos)
      .lte('kickoff', new Date(ahora).toISOString())
      .order('kickoff', { ascending: false }).limit(1),
  ])
  return { proximo: prox?.[0] || null, ultimo: ult?.[0] || null }
}
