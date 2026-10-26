import { supabase } from '../hooks/useAuth'

// Opinión agregada de la afición sobre un partido de la porra: reparto
// victoria/empate/derrota del Real Zaragoza, marcadores y goleadores más
// votados. Solo agrega (las predicciones ya son públicas por RLS).
export async function cargarOpinionAficion(partidoId) {
  const { data } = await supabase
    .from('porra_predicciones')
    .select('goles_zaragoza, goles_rival, goleadores')
    .eq('partido_id', partidoId)

  const preds = data || []
  const total = preds.length
  if (total === 0) return { total: 0 }

  let gana = 0, empata = 0, pierde = 0
  const marcadores = new Map()
  const goleadores = new Map()
  for (const p of preds) {
    if (p.goles_zaragoza > p.goles_rival) gana++
    else if (p.goles_zaragoza === p.goles_rival) empata++
    else pierde++
    const clave = `${p.goles_zaragoza}-${p.goles_rival}`
    marcadores.set(clave, (marcadores.get(clave) || 0) + 1)
    for (const g of p.goleadores || []) goleadores.set(g, (goleadores.get(g) || 0) + 1)
  }

  const pct = n => Math.round((n / total) * 100)
  const ranking = m => [...m.entries()].sort((a, b) => b[1] - a[1])

  return {
    total,
    gana: pct(gana),
    empata: pct(empata),
    pierde: pct(pierde),
    // "goles del Real Zaragoza - goles del rival"
    marcadores: ranking(marcadores).slice(0, 3).map(([marcador, n]) => ({ marcador, pct: pct(n) })),
    goleadores: ranking(goleadores).slice(0, 3).map(([nombre, n]) => ({ nombre, pct: pct(n) })),
  }
}

// Marcador "Z-R" (Real Zaragoza primero) escrito en el orden local-visitante.
export function marcadorEnOrden(marcador, zaragozaLocal) {
  const [z, r] = marcador.split('-')
  return zaragozaLocal ? `${z}-${r}` : `${r}-${z}`
}
