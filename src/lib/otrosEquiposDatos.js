// Filial, juvenil y femenino del Real Zaragoza: datos fijos de cada equipo y
// textos SEO / HTML plano de sus páginas (/cantera/<slug>). JS puro, sin
// React ni Vite: lo usan la página y scripts/prerender-seo.mjs.
//
// `zonas`: las marcas de la clasificación de BeSoccer (clase de la posición)
// con lo que significan en cada competición.

export const EQUIPOS_OTROS = [
  {
    id: 'filial', slug: 'deportivo-aragon', pestaña: 'Filial', nombre: 'Deportivo Aragón', propio: 'Deportivo Aragón',
    competicion: 'Tercera Federación', grupo: 'Grupo 17', quien: 'el filial del Real Zaragoza',
    zonas: { asc: 'Ascenso directo', play: 'Play-off de ascenso', desc: 'Descenso' },
  },
  {
    id: 'juvenil', slug: 'juvenil', pestaña: 'Juvenil A', nombre: 'Real Zaragoza Juvenil A', propio: 'Real Zaragoza U19',
    competicion: 'División de Honor Juvenil', grupo: 'Grupo 3', quien: 'el primer equipo juvenil del Real Zaragoza',
    zonas: { cprjuv: 'Copa del Rey Juvenil', possnext: 'Posible Copa del Rey', desc: 'Descenso' },
  },
  {
    id: 'femenino', slug: 'femenino', pestaña: 'Femenino', nombre: 'Real Zaragoza Femenino', propio: 'Real Zaragoza W',
    competicion: 'Tercera Federación Femenina', grupo: 'Grupo 17', quien: 'el equipo femenino del Real Zaragoza',
    zonas: { asc: 'Ascenso', desc: 'Descenso' },
  },
]
export const equipoOtro = id => EQUIPOS_OTROS.find(e => e.id === id) || EQUIPOS_OTROS[0]
export const equipoPorSlug = slug => EQUIPOS_OTROS.find(e => e.slug === slug) || null
export const rutaCantera = equipo => `/cantera/${equipo.slug}`

// BeSoccer pone " U19" a los juveniles y " W" a los femeninos: dentro de
// cada competición sobra, así que se quita al enseñarlo.
export const nombreVisible = n => (n || '').replace(/\s+(U19|W)$/, '')
export const esPropio = (equipo, nombre) => nombre === equipo.propio

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const fechaTexto = iso => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'fecha por fijar')

/** Partidos del equipo propio (jugados y por jugar), en orden. */
export const partidosPropiosDe = (equipo, partidos) =>
  (partidos || []).filter(p => esPropio(equipo, p.local) || esPropio(equipo, p.visitante))

// Títulos de menos de 60 caracteres con la búsqueda que queremos ganar
// ("<equipo> clasificación / resultados") y la descripción con datos reales.
export function seoCantera(equipo, clasificacion) {
  const fila = (clasificacion || []).find(f => f.nombre === equipo.propio)
  const title = `${equipo.nombre}: resultados y clasificación | RZ Hub`
  const comp = `${equipo.competicion} (${equipo.grupo})`
  const description = fila
    ? `${equipo.nombre}: ${fila.pos}.º en ${equipo.competicion} con ${fila.pts} puntos tras ${fila.pj} jornadas. Resultados, próximo partido y clasificación del ${equipo.grupo}.`
    : `Resultados, próximo partido y clasificación de ${equipo.nombre}, ${equipo.quien}, en ${comp}.`
  return { title, description, h1: equipo.nombre }
}

/** HTML plano para quien no ejecuta JavaScript (Google, redes). */
export function htmlCantera(equipo, partidos, clasificacion) {
  const propios = partidosPropiosDe(equipo, partidos)
  const jugados = propios.filter(p => p.goles_local != null)
  const proximo = propios.find(p => p.goles_local == null)
  const fila = (clasificacion || []).find(f => f.nombre === equipo.propio)
  const plural = (n, una, varias) => `${n} ${n === 1 ? una : varias}`
  const resumen = fila
    ? `${equipo.nombre}, ${equipo.quien}, es ${fila.pos}.º en ${equipo.competicion} (${equipo.grupo}) con ${fila.pts} puntos: ${plural(fila.g, 'victoria', 'victorias')}, ${plural(fila.e, 'empate', 'empates')} y ${plural(fila.p, 'derrota', 'derrotas')}.`
    : `${equipo.nombre} juega en ${equipo.competicion} (${equipo.grupo}).`
  const prox = proximo
    ? `<p>Próximo partido: ${esc(nombreVisible(proximo.local))} - ${esc(nombreVisible(proximo.visitante))}, jornada ${proximo.jornada}, ${esc(fechaTexto(proximo.fecha))}${proximo.hora ? ` a las ${esc(proximo.hora)}` : ''}.</p>`
    : ''
  const resultados = jugados.slice(-8).reverse()
    .map(p => `<li>Jornada ${p.jornada}: ${esc(nombreVisible(p.local))} ${p.goles_local}-${p.goles_visitante} ${esc(nombreVisible(p.visitante))}</li>`).join('')
  const tabla = (clasificacion || [])
    .map(f => `<tr><td>${f.pos}</td><td>${esc(nombreVisible(f.nombre))}</td><td>${f.pj}</td><td>${f.g}</td><td>${f.e}</td><td>${f.p}</td><td>${f.gf}</td><td>${f.gc}</td><td>${f.pts}</td></tr>`).join('')
  const otros = EQUIPOS_OTROS.filter(e => e.id !== equipo.id).map(e => `<a href="${rutaCantera(e)}">${esc(e.nombre)}</a>`).join(' · ')
  return `<main><h1>${esc(equipo.nombre)}: resultados y clasificación</h1><p>${esc(resumen)}</p>${prox}${resultados ? `<h2>Últimos resultados</h2><ul>${resultados}</ul>` : ''}${tabla ? `<h2>Clasificación de ${esc(equipo.competicion)} ${esc(equipo.grupo)}</h2><table><thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>Pts</th></tr></thead><tbody>${tabla}</tbody></table>` : ''}<p>Más cantera del Real Zaragoza: ${otros}</p></main>`
}
