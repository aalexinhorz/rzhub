// Textos SEO de Las Notas, compartidos entre las páginas (React) y el
// prerender (scripts/prerender-seo.mjs), para que el HTML estático que lee
// Google y lo que ve el usuario digan exactamente lo mismo. Sin imports de
// Supabase: tiene que poder ejecutarse en Node.

export const DIAS_VOTACION = 4

// Abierta desde que se abren las notas (created_at de la fila) hasta lo
// que ocurra antes: DIAS_VOTACION días después, o el día del siguiente
// partido con notas.
// "futuro" y "cerrada" son estados distintos aunque en ambos abierta=false:
// uno es "todavía no ha pasado" y el otro "ya pasó y venció el plazo".
// votacion_cerrada permite cerrarla a mano antes de que llegue ese plazo
// (p. ej. si se quiere dar por zanjada la votación de un partido).
// El mismo criterio está en SQL en public.notas_cerradas().
export function calcularVentana(partido, siguiente) {
  const inicio = new Date(`${partido.fecha}T00:00:00`)

  if (partido.votacion_cerrada) {
    const abierta = false
    const estado = new Date() < inicio ? 'futuro' : 'cerrada'
    return { abierta, cierre: inicio, estado }
  }

  const apertura = partido.created_at ? new Date(partido.created_at) : inicio
  const limitePorDias = new Date(apertura.getTime() + DIAS_VOTACION * 86400_000)

  const limitePorSiguiente = siguiente ? new Date(`${siguiente.fecha}T00:00:00`) : null
  const cierre = limitePorSiguiente && limitePorSiguiente < limitePorDias ? limitePorSiguiente : limitePorDias

  const ahora = new Date()
  const abierta = ahora >= inicio && ahora < cierre
  const estado = ahora < inicio ? 'futuro' : abierta ? 'abierta' : 'cerrada'

  return { abierta, cierre, estado }
}

export const formatoNota = n => Number(n).toFixed(1).replace('.', ',')

const fechaLarga = d => new Date(`${d}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' })
const diaSemana = d => new Date(d).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' }).replace(',', '')

export function nombresNotas(p) {
  const local = p.local ? 'Real Zaragoza' : p.rival
  const visitante = p.local ? p.rival : 'Real Zaragoza'
  const marcador = p.goles_local != null && p.goles_visitante != null ? `${p.goles_local}-${p.goles_visitante}` : null
  const partido = marcador ? `${local} ${marcador} ${visitante}` : `${local} - ${visitante}`
  return { local, visitante, marcador, partido }
}

const conMarca = t => (`${t} | RZ Hub`.length <= 70 ? `${t} | RZ Hub` : t)

// ranking: [{ nombre, media, votos }] ordenado de mayor a menor (solo con la
// votación cerrada; abierta no se publica ninguna media).
export function seoNotasPartido(p, { ranking = [], votantes = 0, abierta = false, cierre = null, convocados = 0 } = {}) {
  const { marcador, partido } = nombresNotas(p)
  const resultado = marcador ? ` (${marcador})` : ''
  const h1 = `Notas del Real Zaragoza ante el ${p.rival}`
  const contexto = `${partido}${p.competicion ? `, ${p.competicion}` : ''}, ${fechaLarga(p.fecha)}`

  if (!abierta && ranking.length > 0) {
    const mejor = ranking[0]
    const podio = ranking.slice(0, 3).map(r => `${r.nombre} (${formatoNota(r.media)})`)
    return {
      h1,
      title: conMarca(`Notas Real Zaragoza vs ${p.rival}${resultado}: ${mejor.nombre}, el mejor`),
      description: `El uno a uno del ${contexto} según la afición: ${podio.join(', ')}. Notas medias de ${ranking.length} jugadores con ${votantes} votantes.`,
      intro: `El uno a uno del ${contexto} según la afición zaragocista. ${mejor.nombre} fue el mejor con un ${formatoNota(mejor.media)} de media; ${votantes} aficionados pusieron nota a ${ranking.length} jugadores.`,
    }
  }
  // El cierre suele ser las 00:00 de un día: el último día para votar es el anterior.
  const plazo = abierta && cierre ? ` Puedes votar hasta el ${diaSemana(new Date(cierre).getTime() - 1)}.` : ''
  return {
    h1,
    title: conMarca(`Notas Real Zaragoza vs ${p.rival}${resultado}: puntúa a los jugadores`),
    description: `Pon nota a ${convocados ? `los ${convocados} jugadores` : 'los jugadores'} del Real Zaragoza en el ${contexto}. El uno a uno de la afición: vota del 1 al 10 y descubre la media.${plazo}`,
    intro: `Puntúa del 1 al 10 a cada jugador del Real Zaragoza en el ${contexto}.${plazo} Al votar verás la nota media de la afición.`,
  }
}

// Ranking de la temporada a partir de las medias de cada partido cerrado
// (public.notas_cerradas): cada partido pesa lo mismo, y solo entra quien
// tiene nota en al menos `minPartidos` partidos.
export function rankingTemporada(filas, minPartidos = 3) {
  const porJugador = new Map()
  for (const f of filas) {
    const j = porJugador.get(f.player_id) || { player_id: f.player_id, nombre: f.nombre, suma: 0, partidos: 0 }
    j.suma += Number(f.media)
    j.partidos += 1
    porJugador.set(f.player_id, j)
  }
  return [...porJugador.values()]
    .filter(j => j.partidos >= minPartidos)
    .map(j => ({ ...j, media: j.suma / j.partidos }))
    .sort((a, b) => b.media - a.media || b.partidos - a.partidos)
}

export const SEO_NOTAS_INDEX = {
  h1: 'Notas de los jugadores del Real Zaragoza',
  intro: 'Después de cada partido, la afición pone nota del 1 al 10 a cada jugador del Real Zaragoza. Aquí tienes el uno a uno de todos los partidos de la temporada 2026/27 y el ranking de los mejor valorados.',
}
