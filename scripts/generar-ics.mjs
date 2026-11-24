// Rehace public/calendario.ics a partir de los partidos de la porra
// (porra_partidos): liga y Copa, con hora si está confirmada o como evento de
// todo el día si no. Los demás eventos del archivo (amistosos de pretemporada…)
// se conservan tal cual, y de los oficiales se respeta el estadio que ya
// tuvieran. Lo lanza GitHub Actions (workflow actualizar-calendario) cuando se
// guarda un partido desde la página de Partidos de la redacción; también se
// puede ejecutar a mano:
//
//   node --env-file=.env.local scripts/generar-ics.mjs [--comprobar]
//
//   --comprobar   no escribe: dice qué eventos cambiarían

import { readFileSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const ARCHIVO = 'public/calendario.ics'
const ESTADIO_CASA = 'Ibercaja Estadio'
const comprobar = process.argv.includes('--comprobar')

if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Faltan VITE_SUPABASE_URL / SUPABASE_SERVICE_KEY')
  process.exit(1)
}
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

// Quita las tildes (á, à, ü…) pero deja la ñ, como en el archivo de siempre.
const sinTildes = t => (t || '').normalize('NFD').replace(/[\u0300-\u0302\u0304-\u036f]/g, '').normalize('NFC')
const pad = n => String(n).padStart(2, '0')

// Hora de Madrid de un instante → "20261203T210000".
function horaMadrid(iso) {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(iso))
  const v = t => p.find(x => x.type === t).value
  return `${v('year')}${v('month')}${v('day')}T${v('hour') === '24' ? '00' : v('hour')}${v('minute')}00`
}
const masDosHoras = t => {
  const d = new Date(Date.UTC(+t.slice(0, 4), +t.slice(4, 6) - 1, +t.slice(6, 8), +t.slice(9, 11) + 2, +t.slice(11, 13)))
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00`
}
const diaSiguiente = f => {
  const d = new Date(`${f}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`
}

// Temporada "2026/2027" de una fecha (de julio a junio).
const temporada = f => { const [a, m] = f.split('-').map(Number); return m >= 7 ? `${a}/${a + 1}` : `${a - 1}/${a}` }

// ── Archivo actual: cabecera, eventos y su orden ──
const actual = readFileSync(ARCHIVO, 'utf8').replace(/\r\n/g, '\n')
const cabecera = actual.slice(0, actual.indexOf('BEGIN:VEVENT')).trimEnd()
const eventos = [...actual.matchAll(/BEGIN:VEVENT\n([\s\S]*?)END:VEVENT/g)].map(m => {
  const cuerpo = m[1]
  const campo = c => (cuerpo.match(new RegExp(`^${c}[^:\\n]*:(.*)$`, 'm')) || [])[1]
  return { uid: campo('UID'), inicio: campo('DTSTART'), location: campo('LOCATION'), texto: `BEGIN:VEVENT\n${cuerpo}END:VEVENT` }
})
const oficial = uid => /^rz-(j\d+|copa\d+)-/.test(uid || '')
// Estadio que ya tenía cada partido oficial en el archivo (aunque no tuviera ninguno).
const previos = Object.fromEntries(eventos.filter(e => oficial(e.uid)).map(e => [e.uid, e]))

// ── Partidos de la porra ──
const [{ data: partidos, error }, { data: rivales }] = await Promise.all([
  sb.from('porra_partidos').select('rival, sede, fecha, kickoff, jornada, competicion, hora_confirmada').order('kickoff'),
  sb.from('rivales').select('nombre, estadio'),
])
if (error) { console.error(error.message); process.exit(1) }
const estadioDe = Object.fromEntries((rivales || []).map(r => [r.nombre, r.estadio]))

const nuevos = partidos.map(p => {
  const copa = !!p.competicion && /copa/i.test(p.competicion)
  // "Copa del Rey · 2.ª Eliminatoria" → ronda "2ª Eliminatoria", id "copa2";
  // las rondas sin número ("Octavos de final") → id "copa-octavos-de-final".
  const rondaTexto = copa ? (p.competicion.split('·')[1] || '').trim().replace(/\.ª/, 'ª') : ''
  const numRonda = (rondaTexto.match(/^(\d+)ª/) || [])[1]
  const ronda = copa ? (numRonda || `-${sinTildes(rondaTexto).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`) : null
  const anio = p.fecha.slice(0, 4)
  const uid = copa ? `rz-copa${ronda}-${anio}@rzhub.es` : `rz-j${pad(p.jornada)}-${anio}@rzhub.es`
  const rival = sinTildes(p.rival)
  const titulo = p.sede === 'local' ? `Real Zaragoza vs ${rival}` : `${rival} vs Real Zaragoza`
  const etiqueta = copa ? 'Copa del Rey' : `J${p.jornada}`
  const descripcion = copa
    ? `${rondaTexto} - Copa del Rey ${temporada(p.fecha)}`
    : `Jornada ${p.jornada} - 1a RFEF Grupo 2 ${temporada(p.fecha)}`
  // Como en el archivo de siempre: el estadio solo cuando el horario está confirmado.
  const estadioNuevo = (estadioDe[p.rival] || '').replace(/\s*\(.*?\)\s*/g, ' ').split(',')[0].trim() || null
  const lugar = !p.hora_confirmada ? null
    : p.sede === 'local' ? ESTADIO_CASA
      : previos[uid]?.inicio?.includes('T') ? (previos[uid].location || null) : estadioNuevo
  const lineas = ['BEGIN:VEVENT', `UID:${uid}`, `SUMMARY:${titulo} (${etiqueta})`]
  if (p.hora_confirmada) {
    const ini = horaMadrid(p.kickoff)
    lineas.push(`DTSTART;TZID=Europe/Madrid:${ini}`, `DTEND;TZID=Europe/Madrid:${masDosHoras(ini)}`)
  } else {
    lineas.push(`DTSTART;VALUE=DATE:${p.fecha.replaceAll('-', '')}`, `DTEND;VALUE=DATE:${diaSiguiente(p.fecha)}`)
  }
  lineas.push(`DESCRIPTION:${descripcion}`)
  if (lugar) lineas.push(`LOCATION:${lugar}`)
  lineas.push('END:VEVENT')
  return { uid, inicio: lineas[3].split(':')[1], texto: lineas.join('\n') }
})

// Amistosos y demás eventos no oficiales, tal cual; todo ordenado por fecha.
const resto = eventos.filter(e => !oficial(e.uid))
const todos = [...resto, ...nuevos].sort((a, b) => (a.inicio || '').slice(0, 8).localeCompare((b.inicio || '').slice(0, 8)))
const salida = `${cabecera}\n\n${todos.map(e => e.texto).join('\n\n')}\n\n${actual.slice(actual.lastIndexOf('END:VCALENDAR'))}`

if (comprobar) {
  const antes = Object.fromEntries(eventos.map(e => [e.uid, e.texto]))
  const cambios = nuevos.filter(e => antes[e.uid] !== e.texto).map(e => e.uid)
  const quitados = eventos.filter(e => oficial(e.uid) && !nuevos.some(n => n.uid === e.uid)).map(e => e.uid)
  console.log(`Cambiarían ${cambios.length}: ${cambios.join(', ') || '—'}`)
  console.log(`Desaparecerían ${quitados.length}: ${quitados.join(', ') || '—'}`)
  for (const uid of cambios.slice(0, 6)) console.log(`\n--- antes\n${antes[uid] || '(nuevo)'}\n+++ después\n${nuevos.find(n => n.uid === uid).texto}`)
  process.exit(0)
}
if (salida === actual) { console.log('calendario.ics ya estaba al día'); process.exit(0) }
writeFileSync(ARCHIVO, salida)
console.log(`calendario.ics actualizado (${nuevos.length} partidos oficiales, ${resto.length} otros eventos)`)
