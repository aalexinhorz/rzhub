// Saca de Flashscore las estadísticas individuales de cada jugador del Real
// Zaragoza en cada partido oficial (la ficha que se abre al pulsar un jugador
// en las alineaciones) y las guarda en la tabla stats_jugador_partido. La
// plantilla "Estadísticas" de Gráficos las lee de ahí.
//
// Flashscore es una web que se pinta en el navegador: no hay datos en el
// HTML, así que se usa un navegador real (Playwright), a ritmo normal y sin
// tocar cabeceras.
//
// Uso:
//   PLAYWRIGHT_DIR=<carpeta con node_modules/playwright> [CHROME_PATH=<chromium>] \
//   node --env-file=.env.local scripts/flashscore-stats.mjs [--ultimos N] [--forzar] [--mid <id>]
//
//   sin opciones   los partidos oficiales cerrados (desde DESDE) que aún no estén guardados
//   --ultimos N    solo los N últimos partidos
//   --forzar       vuelve a sacarlos aunque ya estén
//   --mid <id>     solo ese partido (el ?mid= de su enlace de Flashscore)

import { createRequire } from 'node:module'
import { createClient } from '@supabase/supabase-js'

const CALENDARIO = 'https://aupazaragoza.com/assets/data/calendario_rz_2026_27.json'
// Primer partido con estadísticas guardadas (no se sacan los anteriores).
const DESDE = '2026-11-21'
const args = process.argv.slice(2)
const opcion = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null }
const ultimos = Number(opcion('--ultimos') || 0)
const soloMid = opcion('--mid')
const forzar = args.includes('--forzar')

if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Faltan VITE_SUPABASE_URL / SUPABASE_SERVICE_KEY: ejecuta con --env-file=.env.local')
  process.exit(1)
}
let playwright
try {
  playwright = createRequire(`${(process.env.PLAYWRIGHT_DIR || process.cwd()).replace(/\/$/, '')}/package.json`)('playwright')
} catch {
  console.error('No encuentro Playwright: pon PLAYWRIGHT_DIR=<carpeta que tenga node_modules/playwright>')
  process.exit(1)
}
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

const sinTildes = t => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

// "Sangalli M." → Marco Sangalli; "Pena A." → Anartz Peña; "Tachi" → Tachi.
function jugadorDe(nombreFs, jugadores) {
  const m = nombreFs.match(/^(.+?)(?:\s+([A-ZÁÉÍÓÚÑ])\.(?:\s*[A-ZÁÉÍÓÚÑ]\.)*)?$/)
  const apellido = sinTildes(m?.[1] || nombreFs)
  const inicial = sinTildes(m?.[2] || '')
  const candidatos = jugadores.filter(j => {
    const partes = sinTildes(j.name).split(/\s+/)
    const corto = sinTildes(j.short_name)
    return partes.includes(apellido) || corto === apellido || sinTildes(j.name) === apellido
  })
  if (candidatos.length <= 1) return candidatos[0] || null
  return candidatos.find(j => sinTildes(j.name).startsWith(inicial)) || null
}

const navegador = await playwright.chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
const pagina = await navegador.newPage({ viewport: { width: 1300, height: 1000 }, locale: 'es-ES' })
const pasarAvisos = async () => {
  const aviso = pagina.getByText('SOY MAYOR DE 18', { exact: false }).first()
  if (await aviso.count()) { await aviso.click().catch(() => {}); await pagina.waitForTimeout(600) }
}

// 1. Partidos oficiales ya cerrados en la porra, desde DESDE (no se sacan los
//    de antes: el usuario lo quiere de aquí en adelante). El id de Flashscore
//    lo publica aupazaragoza en su calendario (campo flashscore_id).
// Con --mid no hace falta que la porra esté cerrada (el marcador sale entonces del calendario de aupazaragoza).
let consulta = supabase.from('porra_partidos').select('id, fecha, rival, sede, goles_zaragoza, goles_rival').gte('fecha', DESDE).order('fecha', { ascending: false })
if (!soloMid) consulta = consulta.eq('finalizado', true)
const { data: oficiales } = await consulta
const { data: jugadores } = await supabase.from('players').select('id, name, short_name').or('is_zaragoza.eq.true,is_cantera.eq.true')
const { data: filasAlias } = await supabase.from('jugadores_alias').select('alias, player_id')
const alias = Object.fromEntries((filasAlias || []).map(f => [sinTildes(f.alias), Number(f.player_id)]))
const { data: guardados } = await supabase.from('stats_jugador_partido').select('porra_partido_id')
const yaGuardados = new Set((guardados || []).map(g => g.porra_partido_id))
const calendario = await fetch(CALENDARIO).then(r => r.json()).catch(() => [])

let partidos = (oficiales || []).map(o => {
  const entrada = (Array.isArray(calendario) ? calendario : []).find(e => e.fecha === o.fecha && /zaragoza/i.test(`${e.local} ${e.visitante}`))
  const local = o.sede === 'local'
  const oficial = o.goles_zaragoza == null && entrada?.goles_local != null
    ? { ...o, goles_zaragoza: local ? entrada.goles_local : entrada.goles_visitante, goles_rival: local ? entrada.goles_visitante : entrada.goles_local }
    : o
  return { oficial, fecha: o.fecha, mid: entrada?.flashscore_id || null, zaragozaFuera: !local }
})
const sinId = partidos.filter(p => !p.mid)
if (sinId.length) console.log(`Sin id de Flashscore en aupazaragoza: ${sinId.map(p => `${p.fecha} ${p.oficial.rival}`).join(', ')}`)
partidos = partidos.filter(p => p.mid)
if (soloMid) partidos = partidos.filter(p => p.mid === soloMid)
if (!forzar) partidos = partidos.filter(p => !yaGuardados.has(p.oficial.id))
if (ultimos) partidos = partidos.slice(0, ultimos)
console.log(`${partidos.length} partido(s) por sacar`)

const sinCasar = new Set()
for (const p of partidos) {
  // /partido/<mid>/ redirige a la ficha del partido con su enlace completo.
  await pagina.goto(`https://www.flashscore.es/partido/${p.mid}/`, { waitUntil: 'domcontentloaded' })
  const base = pagina.url()
  // Goles y asistencias del Real Zaragoza: no están en la ficha del jugador,
  // salen del resumen (cada gol cambia el marcador y lleva la asistencia
  // entre paréntesis; los de penalti, "(Penalti)" sin enlace).
  await pagina.goto(base.replace(/\/\?mid=/, '/resumen/?mid='), { waitUntil: 'networkidle' })
  await pasarAvisos()
  await pagina.locator('.smv__participantRow').first().waitFor({ timeout: 15000 }).catch(() => {})
  const goles = await pagina.evaluate(lado => {
    const out = []
    document.querySelectorAll(`.smv__participantRow.smv__${lado}Participant`).forEach(fila => {
      if (!fila.querySelector('[class*="incidentHomeScore"], [class*="incidentAwayScore"]')) return
      if (fila.querySelector('[data-testid*="own"]')) return // en propia: no cuenta para nadie del equipo
      const autor = fila.querySelector('.smv__playerName')?.innerText.trim()
      const asistente = fila.querySelector('.smv__assist a')?.innerText.trim() || null
      if (autor) out.push({ autor, asistente })
    })
    return out
  }, p.zaragozaFuera ? 'away' : 'home')
  const contar = campo => goles.reduce((m, g) => (g[campo] ? { ...m, [g[campo]]: (m[g[campo]] || 0) + 1 } : m), {})
  const golesDe = contar('autor')
  const asistDe = contar('asistente')

  const url = base.replace(/\/\?mid=/, '/resumen/alineaciones/?mid=')
  await pagina.goto(url, { waitUntil: 'networkidle' })
  await pasarAvisos()
  const lado = p.zaragozaFuera ? 'right' : 'left'
  const lista = pagina.locator(`[data-testid="wcl-lineupsParticipantGeneral-${lado}"]`)
  await lista.first().waitFor({ timeout: 20000 }).catch(() => {})
  const n = await lista.count()
  const filasGuardar = []
  for (let i = 0; i < n; i++) {
    // Si un clic ha sacado de la página (jugador sin ficha que enlaza a su perfil), se vuelve.
    if (!pagina.url().includes('/alineaciones/')) {
      await pagina.goto(url, { waitUntil: 'networkidle' })
      await pasarAvisos()
      await lista.first().waitFor({ timeout: 20000 }).catch(() => {})
    }
    const fila = lista.nth(i)
    const textoFila = await fila.innerText({ timeout: 8000 }).then(t => t.split('\n').map(x => x.trim()).filter(Boolean)).catch(() => null)
    if (!textoFila) continue
    await fila.scrollIntoViewIfNeeded().catch(() => {})
    await fila.click({ timeout: 8000 }).catch(() => {})
    const ficha = await pagina.waitForFunction(() => {
      const d = [...document.querySelectorAll('[data-testid="wcl-dialog"]')].find(x => x.querySelector('[data-testid="wcl-scores-heading-02"]'))
      if (!d) return null
      const nombre = d.querySelector('[data-testid="wcl-scores-heading-02"]')?.innerText.trim()
      const posicion = d.querySelector('[data-testid="wcl-scores-heading-02"]')?.parentElement?.querySelector('[data-testid="wcl-simple-text-01"]')?.innerText.trim() || null
      const minutos = Number(d.querySelector('[class*="fp-minutesPlayed"]')?.innerText.trim()) || 0
      const rating = Number(d.querySelector('[data-testid="wcl-badgeRating"] span')?.innerText.trim()) || null
      // Secciones (h5) y, debajo, pares etiqueta / valor.
      const stats = []
      let seccion = null
      const nodos = d.querySelectorAll('[data-testid="wcl-scores-heading-05"], [data-testid="wcl-simple-text-01"]')
      let etiqueta = null
      for (const el of nodos) {
        if (el.matches('[data-testid="wcl-scores-heading-05"]')) { seccion = el.innerText.trim(); etiqueta = null; continue }
        if (!seccion) continue
        const negrita = /wcl-bold/.test(el.className)
        if (!negrita) etiqueta = el.innerText.trim()
        else if (etiqueta) { stats.push({ seccion, etiqueta, valor: el.innerText.trim() }); etiqueta = null }
      }
      // Las de la portería (porteros) van antes de los h5 en algunas fichas: ya caen en su sección.
      const cerrar = d.querySelector('[data-testid="wcl-dialogCloseButton"]')
      return { nombre, posicion, minutos, rating, stats, hayCerrar: !!cerrar }
    }, null, { timeout: 8000 }).then(h => h.jsonValue()).catch(() => null)
    if (ficha) {
      await pagina.locator('[data-testid="wcl-dialogCloseButton"]').first().click().catch(() => {})
      await pagina.waitForTimeout(400)
    }
    if (!ficha?.nombre || !ficha.minutos) continue
    const porAlias = alias[sinTildes(ficha.nombre)]
    const jugador = porAlias ? { id: porAlias } : jugadorDe(ficha.nombre, jugadores || [])
    if (!jugador) sinCasar.add(ficha.nombre)
    filasGuardar.push({
      flashscore_mid: p.mid, porra_partido_id: p.oficial.id, fecha: p.fecha, rival: p.oficial.rival, sede: p.oficial.sede,
      goles_zaragoza: p.oficial.goles_zaragoza, goles_rival: p.oficial.goles_rival,
      player_id: jugador?.id ?? null, nombre_flashscore: ficha.nombre,
      dorsal: Number(textoFila[0]) || null, posicion: ficha.posicion, minutos: ficha.minutos, rating: ficha.rating,
      stats: [
        ...(golesDe[ficha.nombre] ? [{ seccion: 'Partido', etiqueta: golesDe[ficha.nombre] === 1 ? 'Gol' : 'Goles', valor: String(golesDe[ficha.nombre]) }] : []),
        ...(asistDe[ficha.nombre] ? [{ seccion: 'Partido', etiqueta: asistDe[ficha.nombre] === 1 ? 'Asistencia' : 'Asistencias', valor: String(asistDe[ficha.nombre]) }] : []),
        ...ficha.stats.filter(s => s.valor && s.valor !== '–'),
      ],
      actualizado: new Date().toISOString(),
    })
  }
  if (filasGuardar.length) {
    const { error } = await supabase.from('stats_jugador_partido').upsert(filasGuardar, { onConflict: 'flashscore_mid,nombre_flashscore' })
    if (error) { console.error(`Error guardando ${p.fecha} ${p.oficial.rival}:`, error.message); continue }
  }
  console.log(`OK ${p.fecha} ${p.oficial.rival}: ${filasGuardar.length} jugadores`)
  await pagina.waitForTimeout(1500)
}
await navegador.close()
if (sinCasar.size) console.log(`Sin casar con la plantilla (se guardan con su nombre de Flashscore): ${[...sinCasar].join(', ')}`)
