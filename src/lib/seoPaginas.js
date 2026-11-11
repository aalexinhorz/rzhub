// Textos SEO y contenido en HTML plano del calendario, el próximo partido y
// la clasificación. Lo usan las páginas (React) y scripts/prerender-seo.mjs,
// que mete el HTML dentro de <div id="root"> para que Google y compañía lo
// lean aunque no ejecuten JavaScript. JS puro, sin JSX ni Vite.

import { CIUDAD_RIVAL, ESTADIO_ZARAGOZA, competicionCorta, fechaCorta, fechaLarga, horaMadrid, limpiarEstadio, marcadorPartido, nombresPartido, slugPartido } from './partidoSeo.js'
import { zonaDe } from './clasificacion.js'

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const sinComillas = n => (n || '').replace(/["“”]/g, '').trim()
const horaConocida = iso => { const d = new Date(iso); return !(d.getUTCHours() === 0 && d.getUTCMinutes() === 0) }

// ── Calendario ──
// Se busca tanto "2026/27" y "26 27" como "2026": van los dos formatos.
export function seoCalendario(proximo) {
  const title = 'Calendario Real Zaragoza 2026/27: partidos, horarios y TV'
  let description = 'Todos los partidos del Real Zaragoza en la temporada 2026/27 (26/27): fechas, horarios, resultados y dónde verlos.'
  if (proximo) {
    const { local, visitante } = nombresPartido(proximo)
    const hora = horaConocida(proximo.kickoff) ? ` a las ${horaMadrid(proximo.kickoff)}` : ''
    description += ` Próximo: ${local} - ${visitante}, ${fechaCorta(proximo.kickoff)}${hora}.`
  }
  description += ' Añádelo gratis al calendario de tu móvil.'
  return { title, description }
}

export function htmlCalendario(partidos) {
  const filas = partidos.map(p => {
    const { local, visitante } = nombresPartido(p)
    const marcador = p.finalizado ? marcadorPartido(p) : null
    const cuando = p.kickoff ? `${fechaLarga(p.kickoff)}${horaConocida(p.kickoff) ? `, ${horaMadrid(p.kickoff)}` : ''}` : 'fecha por confirmar'
    const tv = p.tv ? ` · TV: ${esc(p.tv)}` : ''
    return `<li><a href="/partido/${slugPartido(p)}">${esc(competicionCorta(p))}: ${esc(local)} ${marcador ? esc(marcador) : '-'} ${esc(visitante)}</a> · ${esc(cuando)}${tv}</li>`
  })
  return `<main><h1>Calendario del Real Zaragoza 2026/27</h1><p>Todos los partidos del Real Zaragoza en Primera Federación y Copa del Rey, con fecha, hora, resultado y televisión. Puedes añadir el calendario a tu móvil (Apple Calendar, Google Calendar o .ics) y se actualiza solo con los cambios de horario.</p><ul>${filas.join('')}</ul><p><a href="/proximo-partido">Próximo partido del Real Zaragoza</a> · <a href="/clasificacion">Clasificación de Primera Federación Grupo 2</a></p></main>`
}

// ── Próximo partido: las preguntas que se hace la gente ──
export function preguntasProximoPartido(p, estadioRival) {
  const { local, visitante, zaragozaLocal } = nombresPartido(p)
  const hora = horaConocida(p.kickoff) ? horaMadrid(p.kickoff) : null
  const estadio = zaragozaLocal ? ESTADIO_ZARAGOZA : limpiarEstadio(estadioRival)
  const ciudad = zaragozaLocal ? 'Zaragoza' : CIUDAD_RIVAL[p.rival]
  return [
    { pregunta: '¿Cuándo juega el Real Zaragoza?', respuesta: `El próximo partido del Real Zaragoza es el ${local} - ${visitante}, el ${fechaLarga(p.kickoff)} (${competicionCorta(p)}).` },
    { pregunta: '¿A qué hora juega el Real Zaragoza?', respuesta: hora ? `El partido empieza a las ${hora} (hora peninsular).` : 'La hora del partido aún no está confirmada: la publicamos en cuanto la anuncie la competición.' },
    { pregunta: `¿Dónde ver el ${local} - ${visitante}?`, respuesta: p.tv ? `Se podrá ver en ${p.tv}.` : 'La televisión aún no está confirmada: la publicamos en cuanto se anuncie.' },
    { pregunta: '¿Dónde se juega?', respuesta: estadio ? `En ${estadio}${ciudad ? ` (${ciudad})` : ''}.` : (ciudad ? `En ${ciudad}.` : `En el campo del ${p.rival}.`) },
  ]
}

export function htmlProximoPartido(p, estadioRival, h1) {
  const preguntas = preguntasProximoPartido(p, estadioRival)
  return `<main><h1>${esc(h1)}</h1>${preguntas.map(x => `<h2>${esc(x.pregunta)}</h2><p>${esc(x.respuesta)}</p>`).join('')}<p><a href="/partido/${slugPartido(p)}">Previa, pronóstico y porra del partido</a> · <a href="/calendario">Calendario completo</a> · <a href="/clasificacion">Clasificación</a></p></main>`
}

// ── Clasificación ──
export function jornadaJugada(fixtures) {
  const jugadas = fixtures.filter(f => f.goles_local !== null && f.goles_local !== undefined).map(f => f.jornada)
  return jugadas.length ? Math.max(...jugadas) : null
}

export function seoClasificacion(tabla, jornada) {
  const title = 'Clasificación Primera Federación Grupo 2 2026/27 | RZ Hub'
  let description = 'Clasificación del Grupo 2 de Primera Federación 2026/27 actualizada tras cada partido: puntos, goles, racha y zonas de ascenso, play-off y descenso.'
  if (tabla?.length) {
    const lider = tabla[0]
    const pos = tabla.findIndex(f => sinComillas(f.equipo) === 'Real Zaragoza') + 1
    const rz = tabla[pos - 1]
    const tras = jornada ? `Tras la jornada ${jornada}, ` : ''
    const frase = sinComillas(lider.equipo) === 'Real Zaragoza'
      ? `el Real Zaragoza es líder con ${lider.pts} puntos.`
      : `${sinComillas(lider.equipo)} lidera con ${lider.pts} puntos y el Real Zaragoza es ${pos}.º con ${rz?.pts ?? 0}.`
    description = `${tras}${frase} Clasificación del Grupo 2 de Primera Federación con puntos, goles, racha y zonas de ascenso, play-off y descenso.`
  }
  return { title, description }
}

const ZONA_TEXTO = { ascenso: 'Ascenso directo', playoff: 'Play-off', descenso: 'Descenso' }

export function htmlClasificacion(tabla, jornada) {
  const filas = tabla.map((f, i) => {
    const zona = ZONA_TEXTO[zonaDe(i + 1)] || ''
    return `<tr><td>${i + 1}</td><td>${esc(sinComillas(f.equipo))}</td><td>${f.pj}</td><td>${f.g}</td><td>${f.e}</td><td>${f.p}</td><td>${f.gf}</td><td>${f.gc}</td><td>${f.dg > 0 ? `+${f.dg}` : f.dg}</td><td>${f.pts}</td><td>${zona}</td></tr>`
  })
  const tras = jornada ? ` tras la jornada ${jornada}` : ''
  return `<main><h1>Clasificación de Primera Federación Grupo 2 2026/27</h1><p>Clasificación del Grupo 2 de Primera Federación${tras}. El primero asciende directo a Segunda División, del 2.º al 5.º juegan el play-off y los cinco últimos descienden.</p><table><thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>Pts</th><th>Zona</th></tr></thead><tbody>${filas.join('')}</tbody></table><p><a href="/calendario">Calendario del Real Zaragoza</a> · <a href="/proximo-partido">Próximo partido</a> · <a href="/simulador">Simulador de la liga</a></p></main>`
}
