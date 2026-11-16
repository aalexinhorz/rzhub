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

// Migas de pan (BreadcrumbList) para los datos estructurados: Inicio y luego
// cada [nombre, ruta].
export function migas(pasos) {
  const base = 'https://www.rzhub.es'
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [['Inicio', '/'], ...pasos].map(([name, ruta], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${base}${ruta}` })),
  }
}

// ---------- Predicción (prediccion_liga) ----------

// Probabilidades de un equipo de la predicción: 1º, 2º-5º y 16º-20º.
export function probabilidadesEquipo(e) {
  const p = e.puestos
  const suma = (a, b) => p.slice(a, b).reduce((s, x) => s + x, 0)
  return { directo: p[0], playoff: suma(1, 5), descenso: suma(15, 20) }
}

export function porcentaje(x, decimales = 1) {
  if (x == null) return '–'
  if (x <= 0) return '0 %'
  if (x >= 1) return '100 %'
  if (x < 0.001) return '<0,1 %'
  if (x > 0.999) return '>99,9 %'
  return `${(x * 100).toLocaleString('es-ES', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} %`
}

export const ordenPrediccion = fila => [...fila.equipos].sort((a, b) => b.pts_esperados - a.pts_esperados || b.puestos[0] - a.puestos[0])

// Título corto (Google corta hacia los 60 caracteres) con la búsqueda que
// queremos ganar: "probabilidad de ascenso del Real Zaragoza".
export function seoPrediccion(fila) {
  const rz = fila?.equipos.find(e => sinComillas(e.equipo) === 'Real Zaragoza')
  if (!rz) {
    return {
      title: 'Probabilidad de ascenso del Real Zaragoza | Predicción | RZ Hub',
      description: 'Probabilidades de ascenso directo, play-off y descenso de los 20 equipos del Grupo 2 de Primera Federación, con 50.000 simulaciones del resto de la liga.',
    }
  }
  const { directo, playoff } = probabilidadesEquipo(rz)
  return {
    title: `Probabilidad de ascenso del Real Zaragoza: ${porcentaje(directo, 0)} | RZ Hub`,
    description: `Tras la jornada ${fila.jornada}, el Real Zaragoza tiene un ${porcentaje(directo)} de subir directo y un ${porcentaje(playoff)} de jugar el play-off. Predicción de Primera Federación con ${fila.simulaciones.toLocaleString('es-ES')} simulaciones.`,
  }
}

// Preguntas frecuentes de /prediccion (se enseñan en la página y van en el
// FAQPage de los datos estructurados: tienen que coincidir).
export function preguntasPrediccion(fila) {
  const equipos = ordenPrediccion(fila)
  const rz = equipos.find(e => sinComillas(e.equipo) === 'Real Zaragoza')
  const favorito = [...equipos].sort((a, b) => b.puestos[0] - a.puestos[0])[0]
  const preguntas = []
  if (rz) {
    const { directo, playoff, descenso } = probabilidadesEquipo(rz)
    preguntas.push({
      pregunta: '¿Qué probabilidad tiene el Real Zaragoza de ascender a Segunda División?',
      respuesta: `Tras la jornada ${fila.jornada}, el Real Zaragoza tiene un ${porcentaje(directo)} de ascender directo como 1.º y un ${porcentaje(playoff)} de acabar entre el 2.º y el 5.º y jugar el play-off de ascenso. Su probabilidad de descender es del ${porcentaje(descenso)}.`,
    })
    preguntas.push({
      pregunta: '¿Cuántos puntos hará el Real Zaragoza esta temporada?',
      respuesta: `De media, en las ${fila.simulaciones.toLocaleString('es-ES')} simulaciones el Real Zaragoza acaba la liga con ${rz.pts_esperados.toLocaleString('es-ES')} puntos. Ahora mismo tiene ${rz.pts_actuales}.`,
    })
  }
  if (favorito) {
    preguntas.push({
      pregunta: '¿Quién es el favorito para ganar el Grupo 2 de Primera Federación?',
      respuesta: `${sinComillas(favorito.equipo)}, con un ${porcentaje(favorito.puestos[0])} de acabar 1.º según la predicción de RZ Hub tras la jornada ${fila.jornada}.`,
    })
  }
  preguntas.push({
    pregunta: '¿Cómo se calcula la predicción?',
    respuesta: `A cada equipo se le calcula una fuerza en ataque y otra en defensa con todos los partidos jugados, más la ventaja de jugar en casa. Con eso se simula el resto de la liga ${fila.simulaciones.toLocaleString('es-ES')} veces, partido a partido, y se cuenta en qué puesto acaba cada equipo. Los empates a puntos se deshacen como en la RFEF, primero por los enfrentamientos directos. Se actualiza sola tras cada jornada.`,
  })
  return preguntas
}

export function faqPrediccion(fila) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: preguntasPrediccion(fila).map(q => ({ '@type': 'Question', name: q.pregunta, acceptedAnswer: { '@type': 'Answer', text: q.respuesta } })),
  }
}

export function htmlPrediccion(fila) {
  const filas = ordenPrediccion(fila).map((e, i) => {
    const { directo, playoff, descenso } = probabilidadesEquipo(e)
    return `<tr><td>${i + 1}</td><td>${esc(sinComillas(e.equipo))}</td><td>${e.pts_actuales}</td><td>${e.pts_esperados.toLocaleString('es-ES')}</td><td>${esc(porcentaje(directo))}</td><td>${esc(porcentaje(playoff))}</td><td>${esc(porcentaje(descenso))}</td></tr>`
  })
  const faq = preguntasPrediccion(fila).map(q => `<h3>${esc(q.pregunta)}</h3><p>${esc(q.respuesta)}</p>`).join('')
  return `<main><h1>Probabilidad de ascenso del Real Zaragoza: predicción de Primera Federación ${fila.temporada.replace('-', '/')}</h1><p>Probabilidades tras la jornada ${fila.jornada}, según ${fila.simulaciones.toLocaleString('es-ES')} simulaciones del resto de la liga con un modelo de goles por equipo (ataque, defensa y ventaja de jugar en casa).</p><table><thead><tr><th>#</th><th>Equipo</th><th>Pts</th><th>Pts esperados</th><th>1.º</th><th>Play-off</th><th>Descenso</th></tr></thead><tbody>${filas.join('')}</tbody></table><h2>Preguntas frecuentes</h2>${faq}<p><a href="/clasificacion">Clasificación</a> · <a href="/simulador">Simulador de la liga</a> · <a href="/proximo-partido">Próximo partido</a></p></main>`
}
