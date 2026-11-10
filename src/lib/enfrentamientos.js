import { supabase } from '../hooks/useAuth'

// "Villarreal CF B" en `rivales.nombre` vs `Villarreal CF "B"` en
// liga_calendario (así la deja la función fetch-liga-calendario, que
// copia el nombre tal cual de la plantilla de Wikipedia) — se quitan
// las comillas para poder comparar nombres sin que ese caso particular
// rompa el emparejamiento.
export const sinComillas = n => (n || '').replace(/[""]/g, '').trim()

// rivales_enfrentamientos es una tabla histórica que se rellena A MANO
// partido a partido — esta temporada se nos olvidó meter el Teruel y
// el Ibiza (sí se metieron Antequera, Cartagena, Gimnàstic y
// Torremolinos). liga_calendario, en cambio, se actualiza sola (cron
// fetch-liga-calendario tira de Wikipedia cada vez que hay
// resultados), así que los enfrentamientos de la temporada en curso se
// derivan de ahí automáticamente en vez de depender de que alguien se
// acuerde de añadirlos a mano — solo se usa el dato manual cuando ya
// existe para esa fecha (tiene goleadores de los dos equipos, que
// liga_calendario no guarda). De propina, se intenta rellenar el
// goleador zaragocista desde porra_partidos cuando esa jornada ya se
// cerró en la Porra.
export async function cargarEnfrentamientosTemporada(nombreRival, historicos) {
  const [{ data: liga }, { data: porra }] = await Promise.all([
    supabase.from('liga_calendario')
      .select('id, jornada, fecha, equipo_local, equipo_visitante, goles_local, goles_visitante')
      .or('equipo_local.eq.Real Zaragoza,equipo_visitante.eq.Real Zaragoza')
      .not('goles_local', 'is', null),
    supabase.from('porra_partidos').select('fecha, goleadores').eq('rival', nombreRival).not('goleadores', 'is', null),
  ])

  const delRival = (liga || []).filter(f =>
    sinComillas(f.equipo_local) === sinComillas(nombreRival) || sinComillas(f.equipo_visitante) === sinComillas(nombreRival)
  )
  const fechasConDatoManual = new Set(historicos.map(h => h.fecha))
  const goleadoresPorFecha = new Map((porra || []).map(p => [p.fecha, p.goleadores]))

  const derivados = delRival
    .filter(f => !fechasConDatoManual.has(f.fecha))
    .map(f => {
      const local = f.equipo_local === 'Real Zaragoza'
      const golesZaragoza = goleadoresPorFecha.get(f.fecha)
      return {
        id: `liga_${f.id}`,
        fecha: f.fecha,
        competicion: 'Primera Federación',
        jornada: `Jornada ${f.jornada}`,
        sede: local ? 'local' : 'visitante',
        goles_zaragoza: local ? f.goles_local : f.goles_visitante,
        goles_rival: local ? f.goles_visitante : f.goles_local,
        goleadores_zaragoza: golesZaragoza ? golesZaragoza.join(', ') : null,
        goleadores_rival: null,
      }
    })

  return [...historicos, ...derivados].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
}

// Todos los enfrentamientos con un rival (de rivales.id), del más reciente
// al más antiguo: los históricos y los de la temporada en curso.
export async function cargarEnfrentamientos(rivalId, nombreRival) {
  const { data } = await supabase.from('rivales_enfrentamientos').select('*').eq('rival_id', rivalId).order('fecha', { ascending: false })
  return cargarEnfrentamientosTemporada(nombreRival, data || [])
}
