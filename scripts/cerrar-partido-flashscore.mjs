// Cierra un partido de la Porra con los datos de Flashscore (sustituye a
// aupazaragoza): marcador, goleadores del Real Zaragoza, once y cambios para
// el Vestuario Blanquillo, árbitro, notas de la afición y apertura de la
// siguiente porra. Lo lanza GitHub Actions cuando Supabase (función
// final-partido, que mira BeSoccer) ve el partido terminado.
//
// Si algo no cuadra (Flashscore no da el partido por terminado, el marcador
// no coincide con el de BeSoccer, un goleador que no está en la plantilla…)
// NO cierra: deja porra_auto en "revisar" con el motivo, que los admins ven
// en la web, y sale con error para que se vuelva a intentar.
//
// Uso:
//   PLAYWRIGHT_DIR=<carpeta con node_modules/playwright> [CHROME_PATH=…] \
//   node [--env-file=.env.local] scripts/cerrar-partido-flashscore.mjs --porra <porra_partidos.id> [--gz N --gr N] [--simular]
//
//   --gz/--gr   marcador según BeSoccer (para comprobar que coincide)
//   --simular   lo saca todo y lo enseña, sin escribir nada
// Escribe en $GITHUB_OUTPUT (si existe) mid=<id de Flashscore> para el paso siguiente.

import { appendFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createClient } from '@supabase/supabase-js'

const args = process.argv.slice(2)
const opcion = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null }
const porraId = opcion('--porra')
const simular = args.includes('--simular')
const golesBeSoccer = opcion('--gz') != null && opcion('--gr') != null ? { gz: Number(opcion('--gz')), gr: Number(opcion('--gr')) } : null
const EQUIPO = 'https://www.flashscore.es/equipo/real-zaragoza/za7D2lO5/'
const CALENDARIO_AUPA = 'https://aupazaragoza.com/assets/data/calendario_rz_2026_27.json'
// Huecos de src/lib/formations.js por formación (líneas de atrás adelante).
const FORMACIONES = { '4-3-3': [4, 3, 3], '4-4-2': [4, 4, 2], '4-2-3-1': [4, 2, 3, 1], '3-4-2-1': [3, 4, 2, 1], '5-3-2': [5, 3, 2] }
const PREFIJOS_SLUG = new Set(['cd', 'ce', 'cf', 'ud', 'sd', 'ad', 'fc', 'rc', 'club'])
const PREFIJOS_CLUB = new Set([...PREFIJOS_SLUG, 'de', 'del', 'la', 'el', 'b', 'at', 'atletico', 'real', 'deportivo', 'union', 'sociedad'])

if (!porraId) { console.error('Falta --porra <id>'); process.exit(1) }
if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) { console.error('Faltan VITE_SUPABASE_URL / SUPABASE_SERVICE_KEY'); process.exit(1) }
let playwright
try {
  playwright = createRequire(`${(process.env.PLAYWRIGHT_DIR || process.cwd()).replace(/\/$/, '')}/package.json`)('playwright')
} catch { console.error('No encuentro Playwright (PLAYWRIGHT_DIR)'); process.exit(1) }
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

const sinTildes = t => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const tokens = n => sinTildes(n).replace(/["'’“”]/g, '').split(/[\s\-.]+/).filter(t => t.length > 1)

const { data: partido } = await sb.from('porra_partidos').select('*').eq('id', porraId).single()
if (!partido) { console.error('No existe ese partido de la porra'); process.exit(1) }
const local = partido.sede === 'local'
const guardarAuto = async cambios => {
  if (simular) return
  await sb.from('porra_auto').upsert({ partido_id: partido.id, ...cambios, actualizado_at: new Date().toISOString() })
}
const revisar = async motivo => {
  console.error(`REVISAR: ${motivo}`)
  await guardarAuto({ estado: 'revisar', motivo: `Flashscore: ${motivo}` })
  process.exit(2)
}
const yaCerrado = partido.finalizado && !simular

const [{ data: jugadores }, { data: filasAlias }] = await Promise.all([
  sb.from('players').select('id, name, short_name').or('is_zaragoza.eq.true,is_cantera.eq.true'),
  sb.from('jugadores_alias').select('alias, player_id'),
])
const alias = Object.fromEntries((filasAlias || []).map(f => [sinTildes(f.alias), Number(f.player_id)]))
// "Sangalli M." → Marco Sangalli; "Jamelli" → alias; "Espiau E. D." → Edu Espiau.
function jugadorDe(nombreFs) {
  if (alias[sinTildes(nombreFs)]) return jugadores.find(j => j.id === alias[sinTildes(nombreFs)]) || { id: alias[sinTildes(nombreFs)] }
  const m = nombreFs.match(/^(.+?)(?:\s+([A-ZÁÉÍÓÚÑ])\.(?:\s*[A-ZÁÉÍÓÚÑ]\.)*)?$/)
  const apellido = sinTildes(m?.[1] || nombreFs)
  const inicial = sinTildes(m?.[2] || '')
  const c = (jugadores || []).filter(j => sinTildes(j.name).split(/\s+/).includes(apellido) || sinTildes(j.short_name) === apellido || sinTildes(j.name) === apellido)
  if (c.length <= 1) return c[0] || null
  return c.find(j => sinTildes(j.name).startsWith(inicial)) || null
}

const navegador = await playwright.chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
const pagina = await navegador.newPage({ viewport: { width: 1300, height: 1000 }, locale: 'es-ES' })
const pasarAvisos = async () => {
  const aviso = pagina.getByText('SOY MAYOR DE 18', { exact: false }).first()
  if (await aviso.count()) { await aviso.click().catch(() => {}); await pagina.waitForTimeout(600) }
}
const cerrarYSalir = async code => { await navegador.close(); process.exit(code) }

// 1. El partido en Flashscore: en la página del equipo, la fila con el rival
//    (si no, el id que publica aupazaragoza en su calendario).
await pagina.goto(EQUIPO, { waitUntil: 'networkidle' })
await pasarAvisos()
await pagina.locator('.event__match').first().waitFor({ timeout: 30000 }).catch(() => {})
const tRival = tokens(partido.rival).filter(t => !PREFIJOS_CLUB.has(t))
const filas = await pagina.evaluate(() => [...document.querySelectorAll('.event__match')].map(el => ({
  href: el.querySelector('a')?.href || '', texto: el.innerText.replace(/\n/g, ' '),
})))
const [, mes, dia] = partido.fecha.split('-')
let fila = filas.find(f => tRival.some(t => sinTildes(f.texto).includes(t)) && (f.texto.includes(`${dia}.${mes}.`) || /finalizado|descanso|minuto|'/i.test(f.texto)))
let mid = fila ? new URL(fila.href).searchParams.get('mid') : null
if (!mid) {
  const cal = await fetch(CALENDARIO_AUPA).then(r => r.json()).catch(() => [])
  mid = (Array.isArray(cal) ? cal : []).find(e => e.fecha === partido.fecha && /zaragoza/i.test(`${e.local} ${e.visitante}`))?.flashscore_id || null
}
if (!mid) { await navegador.close(); await revisar('no encuentro el partido en Flashscore') }
console.log(`Flashscore mid=${mid}`)
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `mid=${mid}\n`)
// Ya cerrado (a mano o antes): solo hacía falta el id para las estadísticas.
if (yaCerrado) { console.log('La porra ya estaba cerrada: solo estadísticas'); await cerrarYSalir(0) }

// 2. ¿Terminado? Marcador.
await pagina.goto(`https://www.flashscore.es/partido/${mid}/`, { waitUntil: 'domcontentloaded' })
const base = pagina.url()
await pasarAvisos()
await pagina.locator('[class*="detailScore__wrapper"]').first().waitFor({ timeout: 20000 }).catch(() => {})
const cabecera = await pagina.evaluate(() => ({
  estado: document.querySelector('[class*="detailScore__status"], [class*="fixedHeaderDuel__detailStatus"]')?.innerText || '',
  marcador: (document.querySelector('[class*="detailScore__wrapper"]')?.innerText || '').replace(/\s/g, ''),
}))
if (!/FINALIZADO|DESPU[ÉE]S DE PR[ÓO]RROGA|DESPU[ÉE]S DE PENALTIS|PENALTIS/i.test(cabecera.estado)) {
  console.log(`Aún no ha terminado en Flashscore (${cabecera.estado || 'sin estado'})`)
  await cerrarYSalir(3)
}
const mm = cabecera.marcador.match(/^(\d+)-(\d+)/)
if (!mm) { await navegador.close(); await revisar(`no entiendo el marcador "${cabecera.marcador}"`) }
// En Copa cuenta el resultado tras la prórroga, sin penaltis: el marcador grande ya es ese.
const [gl, gv] = [Number(mm[1]), Number(mm[2])]
const gz = local ? gl : gv
const gr = local ? gv : gl
if (golesBeSoccer && (golesBeSoccer.gz !== gz || golesBeSoccer.gr !== gr)) {
  await navegador.close()
  await revisar(`marcador distinto: Flashscore ${gz}-${gr}, BeSoccer ${golesBeSoccer.gz}-${golesBeSoccer.gr} (Real Zaragoza primero)`)
}

// 3. Goles del Real Zaragoza (resumen) y árbitro.
await pagina.goto(base.replace(/\/\?mid=/, '/resumen/?mid='), { waitUntil: 'networkidle' })
await pasarAvisos()
await pagina.locator('.smv__participantRow').first().waitFor({ timeout: 15000 }).catch(() => {})
const resumen = await pagina.evaluate(lado => {
  const goles = []
  document.querySelectorAll(`.smv__participantRow.smv__${lado}Participant`).forEach(f => {
    if (!f.querySelector('[class*="incidentHomeScore"], [class*="incidentAwayScore"]')) return
    goles.push({ autor: f.querySelector('.smv__playerName')?.innerText.trim() || '', enPropia: !!f.querySelector('[data-testid*="own"]') })
  })
  const t = document.body.innerText
  const arbitro = (t.match(/ÁRBITRO:\s*\n?\s*([^\n(]+)/) || [])[1]?.trim() || null
  return { goles, arbitro }
}, local ? 'home' : 'away')
const golesPropios = resumen.goles.filter(g => !g.enPropia)
if (resumen.goles.length !== gz) { await navegador.close(); await revisar(`el resumen trae ${resumen.goles.length} goles del Real Zaragoza y el marcador ${gz}`) }
const goleadores = []
for (const g of golesPropios) {
  const j = jugadorDe(g.autor)
  if (!j?.name) { await navegador.close(); await revisar(`goleador "${g.autor}" no identificado (añade un alias en jugadores_alias)`) }
  goleadores.push(j.name)
}
// "Tárraga Lajara J." → "Tárraga Lajara"
const arbitro = resumen.arbitro ? resumen.arbitro.replace(/\s+[A-ZÁÉÍÓÚÑ]\.(\s*[A-ZÁÉÍÓÚÑ]\.)*$/, '').trim() : null

// 4. Once, formación y cambios (alineaciones).
await pagina.goto(base.replace(/\/\?mid=/, '/resumen/alineaciones/?mid='), { waitUntil: 'networkidle' })
await pasarAvisos()
const lado = local ? 'left' : 'right'
await pagina.locator(`[data-testid="wcl-lineupsParticipantGeneral-${lado}"]`).first().waitFor({ timeout: 20000 }).catch(() => {})
const al = await pagina.evaluate(lado => {
  const lista = [...document.querySelectorAll(`[data-testid="wcl-lineupsParticipantGeneral-${lado}"]`)]
    .map(x => x.innerText.split('\n').map(s => s.trim()).filter(Boolean))
    .map(([dorsal, nombre]) => ({ dorsal: Number(dorsal) || null, nombre }))
  const cambios = [...document.querySelectorAll(`[data-testid="wcl-lineupsParticipantsSubstitution-${lado}"]`)]
    .map(x => x.innerText.split('\n').map(s => s.trim()).filter(Boolean))
  // Líneas del campo (dorsales de cada fila) del bloque de nuestro equipo:
  // el campo tiene un bloque por equipo, primero el local.
  const bloques = [...document.querySelectorAll('[data-testid="wcl-lineupsField"] [class*="fp-formation"]')]
  const bloque = bloques[lado === 'left' ? 0 : 1]
  const filasCampo = bloque ? [...bloque.querySelectorAll('[class*="fp-row"]')]
    .map(r => [...r.querySelectorAll('[class*="lineupsParticipantName"]')].map(n => Number(n.innerText.trim().split(/\s+/)[0]))) : []
  return { lista, cambios, filasCampo }
}, lado)
await navegador.close()

const titularesFs = al.lista.slice(0, 11)
const dorsalesOnce = new Set(titularesFs.map(t => t.dorsal))
const lineas = al.filasCampo.filter(r => r.length)
if (lineas.flat().some(d => !dorsalesOnce.has(d))) lineas.length = 0 // el dibujo no casa con el once
const porLineas = lineas.map(r => r.length)
const formacion = Object.entries(FORMACIONES).find(([, l]) => porLineas.length === l.length + 1 && porLineas[0] === 1 && l.every((n, i) => n === porLineas[i + 1]))?.[0]
const avisos = []
let alineacion = null
const idDe = nombre => jugadorDe(nombre)?.id ?? null
if (titularesFs.length === 11 && formacion) {
  // Cada línea de Flashscore va de derecha a izquierda (como la ficha de la
  // prensa); los huecos de formations.js van de izquierda a derecha.
  const ids = []
  let i = 0
  for (const n of [1, ...FORMACIONES[formacion]]) {
    ids.push(...titularesFs.slice(i, i + n).reverse().map(t => idDe(t.nombre)))
    i += n
  }
  // "Entra | nota | Sale | 62'" (la nota puede faltar).
  const cambios = al.cambios.map(c => {
    const minuto = Number((c.at(-1) || '').replace(/'.*/, '').split('+')[0])
    const sinNota = c.filter(x => !/^\d+(\.\d+)?$/.test(x) && !/'$/.test(x))
    return { minuto, entra: idDe(sinNota[0]), sale: idDe(sinNota[1]) }
  })
  if (ids.some(x => !x) || cambios.some(c => !c.entra || !c.sale || !c.minuto)) avisos.push('Once: hay jugadores sin identificar, no se ha guardado')
  else alineacion = { formacion, titulares: ids, cambios }
} else avisos.push(`Once: no reconozco la formación (${porLineas.join('-') || 'sin campo'})`)

const convocatoria = alineacion ? [...alineacion.titulares, ...alineacion.cambios.map(c => c.entra)] : []
const slug = tokens(partido.rival).filter(t => !PREFIJOS_SLUG.has(t)).join('-')
const notas = {
  partido_id: `${partido.fecha}-${slug}`, rival: partido.rival, fecha: partido.fecha,
  competicion: partido.competicion || `Primera Federación · Jornada ${partido.jornada}`,
  goles_local: local ? gz : gr, goles_visitante: local ? gr : gz,
  convocatoria, local, votacion_cerrada: false,
}
const { data: siguiente } = await sb.from('porra_partidos').select('id, rival, abierto')
  .eq('finalizado', false).gt('kickoff', partido.kickoff).order('kickoff', { ascending: true }).limit(1).maybeSingle()

const plan = { marcador: `${gz}-${gr}`, goleadores, arbitro, alineacion, abrir_siguiente: siguiente?.rival || null, notas: notas.partido_id, avisos }
console.log(JSON.stringify(plan, null, 2))
if (simular) process.exit(0)

// 5. Hacerlo.
const { data: cierre, error: errCierre } = await sb.rpc('porra_cerrar_partido', { p_partido: partido.id, p_gz: gz, p_gr: gr, p_goleadores: goleadores })
if (errCierre) await revisar(`error al cerrar: ${errCierre.message}`)
const extra = { ...(arbitro ? { arbitro } : {}), ...(alineacion && !partido.alineacion ? { alineacion } : {}) }
if (Object.keys(extra).length) await sb.from('porra_partidos').update(extra).eq('id', partido.id)
if (siguiente && !siguiente.abierto) {
  const { error } = await sb.from('porra_partidos').update({ abierto: true }).eq('id', siguiente.id)
  if (error) avisos.push(`No se pudo abrir la porra de ${siguiente.rival}: ${error.message}`)
}
const { data: notasYa } = await sb.from('partidos').select('partido_id').eq('fecha', partido.fecha)
if (!notasYa?.length && convocatoria.length >= 11) {
  const { error } = await sb.from('partidos').insert(notas)
  if (error) avisos.push(`No se pudieron abrir las notas: ${error.message}`)
} else if (!notasYa?.length) avisos.push('Notas sin abrir: falta el once')
await guardarAuto({
  estado: 'cerrado', cerrado_at: new Date().toISOString(), motivo: avisos.length ? avisos.join(' · ') : null,
  alineacion_estado: alineacion ? 'hecho' : 'revisar', datos: { fuente: 'flashscore', mid, plan, cierre },
})
console.log(`Cerrado: ${JSON.stringify(cierre)}${avisos.length ? ` · avisos: ${avisos.join(' · ')}` : ''}`)
