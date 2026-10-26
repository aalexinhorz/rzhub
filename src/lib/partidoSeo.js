// URL, nombres y textos SEO de las páginas de partido (/partido/:slug).
// Lo usan Partido.jsx y scripts/prerender-seo.mjs: JS puro, sin JSX ni Vite.
// `p` es una fila de porra_partidos.

export const ESTADIO_ZARAGOZA = 'Ibercaja Estadio'

const slugify = s => (s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

// Temporada de fútbol: de julio a junio.
export function temporadaDe(p) {
  const d = new Date(p.kickoff || `${p.fecha}T12:00:00Z`)
  const y = d.getUTCFullYear()
  const inicio = d.getUTCMonth() >= 6 ? y : y - 1
  return `${inicio}-${String(inicio + 1).slice(2)}`
}

export function nombresPartido(p) {
  const local = p.sede === 'local'
  return { local: local ? 'Real Zaragoza' : p.rival, visitante: local ? p.rival : 'Real Zaragoza', zaragozaLocal: local }
}

// Sin fecha a propósito: un aplazamiento no debe cambiar la URL.
// Local y visitante ya distinguen ida y vuelta de liga en una temporada.
export function slugPartido(p) {
  const { local, visitante } = nombresPartido(p)
  return [slugify(local), slugify(visitante), p.competicion ? 'copa' : null, temporadaDe(p)].filter(Boolean).join('-')
}

export function competicionCorta(p) {
  return p.competicion ? p.competicion.split(' · ')[0] : `Primera Federación, jornada ${p.jornada}`
}

export function marcadorPartido(p) {
  if (p.goles_zaragoza == null || p.goles_rival == null) return null
  const { zaragozaLocal } = nombresPartido(p)
  return zaragozaLocal ? `${p.goles_zaragoza}-${p.goles_rival}` : `${p.goles_rival}-${p.goles_zaragoza}`
}

const fechaLarga = iso => new Date(iso).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' })
const fechaCorta = iso => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' })
const horaMadrid = iso => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })

export function seoPartido(p) {
  const { local, visitante } = nombresPartido(p)
  const marcador = p.finalizado ? marcadorPartido(p) : null
  const competicion = competicionCorta(p)
  if (marcador) {
    return {
      title: `${local} ${marcador} ${visitante}: resultado, goles y notas | RZ Hub`,
      description: `${local} ${marcador} ${visitante} (${competicion}, ${fechaLarga(p.kickoff)}): resultado, goleadores del Real Zaragoza, qué pronosticó la afición y las notas de los jugadores.`,
    }
  }
  return {
    title: `Pronóstico ${local} - ${visitante} | ${competicion} | RZ Hub`,
    description: `${local} - ${visitante} (${competicion}, ${fechaCorta(p.kickoff)}, ${horaMadrid(p.kickoff)}): haz tu pronóstico gratis y gana una camiseta oficial del Real Zaragoza. Previa y cara a cara.`,
  }
}

// Párrafo descriptivo generado con los datos del partido (contenido
// legible para buscadores y personas, en futuro o pasado según toque).
export function resumenPartido(p, { estadio, opinion } = {}) {
  const { local, visitante, zaragozaLocal } = nombresPartido(p)
  const rival = p.rival
  const cuando = `el ${fechaLarga(p.kickoff)} a las ${horaMadrid(p.kickoff)}`
  const donde = estadio ? ` en el ${estadio}` : ''
  const comp = p.competicion
    ? `en la ${p.competicion.replace(' · ', ', ')}`
    : `en la jornada ${p.jornada} de Primera Federación`
  const marcador = p.finalizado ? marcadorPartido(p) : null

  if (marcador) {
    const signo = Math.sign(p.goles_zaragoza - p.goles_rival)
    const desenlace = signo > 0 ? `ganó el Real Zaragoza` : signo < 0 ? `ganó el ${rival}` : 'terminó en empate'
    let texto = `El ${local} - ${visitante} se jugó ${cuando}${donde}, ${comp}, y ${desenlace} (${local} ${marcador} ${visitante}).`
    if (p.goleadores?.length) texto += ` Por parte del Real Zaragoza marcaron ${listaNatural(p.goleadores)}.`
    if (opinion?.total) {
      const acierto = signo > 0 ? opinion.gana : signo < 0 ? opinion.pierde : opinion.empata
      texto += ` En la Porra de RZ Hub participaron ${opinion.total} aficionados y el ${acierto}% acertó el desenlace.`
    }
    return texto
  }
  let texto = `El Real Zaragoza ${zaragozaLocal ? `recibe al ${rival}` : `visita al ${rival}`} ${cuando}${donde}, ${comp}.`
  if (opinion?.total) {
    const fav = opinion.gana >= opinion.pierde && opinion.gana >= opinion.empata ? `que gane el Real Zaragoza (${opinion.gana}%)`
      : opinion.pierde >= opinion.empata ? `que gane el ${rival} (${opinion.pierde}%)` : `un empate (${opinion.empata}%)`
    texto += ` De momento, ${opinion.total} aficionados han hecho su pronóstico en la Porra de RZ Hub y la mayoría apuesta por ${fav}.`
  }
  return texto
}

function listaNatural(arr) {
  return arr.length <= 1 ? arr.join('') : `${arr.slice(0, -1).join(', ')} y ${arr[arr.length - 1]}`
}

// /proximo-partido: siempre el siguiente partido (o el que se está jugando).
// Compite por "próximo partido del Real Zaragoza", "cuándo juega el Real
// Zaragoza" y "dónde ver el Real Zaragoza".
export function seoProximoPartido(p) {
  const { local, visitante } = nombresPartido(p)
  const donde = p.tv ? ` Dónde verlo: ${p.tv}.` : ''
  return {
    title: `Próximo partido del Real Zaragoza: vs ${p.rival} (${fechaCorta(p.kickoff)})`,
    description: `Cuándo juega el Real Zaragoza: ${local} - ${visitante}, ${fechaCorta(p.kickoff)} a las ${horaMadrid(p.kickoff)} (${competicionCorta(p)}).${donde} Previa, pronóstico y porra con camiseta de premio.`,
    h1: `Próximo partido del Real Zaragoza: ${local} vs ${visitante}`,
  }
}
