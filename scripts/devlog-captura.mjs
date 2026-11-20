// Hace una captura real de la web para una mejora de "Mejoras en la web"
// (tabla devlog), la sube al bucket público "devlog" y la deja enlazada en
// devlog.capturas[indice] = { ruta, url }. La plantilla "Novedad web" de
// Gráficos la carga sola al elegir esa mejora.
//
// Uso:
//   PLAYWRIGHT_DIR=<carpeta con node_modules/playwright> \
//   node --env-file=.env.local scripts/devlog-captura.mjs <devlog_id> <indice> <ruta> [opciones]
//
// Opciones:
//   --clic "<selector>"   pulsa algo antes de capturar (p. ej. abrir una alineación)
//   --scroll <px>         baja la página antes de capturar
//   --hasta "<selector>"  baja hasta esa sección (queda justo debajo del menú)
//   --espera <ms>         espera extra antes de capturar (por defecto 1500)
//   --local               captura el servidor de desarrollo (localhost:5173) en vez de rzhub.es
//   --sesion-falsa        con --local: simula una sesión iniciada sin datos (solo para Mi perfil)
//
// Ejemplo:
//   node --env-file=.env.local scripts/devlog-captura.mjs 3becbfb5-... 0 /comunidad --clic '[title="Ver la alineación"] >> nth=0'

import { createRequire } from 'node:module'
import { createClient } from '@supabase/supabase-js'

const [, , devlogId, indiceTxt, ruta, ...resto] = process.argv
if (!devlogId || indiceTxt == null || !ruta?.startsWith('/')) {
  console.error('Uso: node --env-file=.env.local scripts/devlog-captura.mjs <devlog_id> <indice> </ruta> [--clic sel] [--scroll px] [--espera ms] [--local] [--sesion-falsa]')
  process.exit(1)
}
if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Faltan VITE_SUPABASE_URL / SUPABASE_SERVICE_KEY: ejecuta con --env-file=.env.local')
  process.exit(1)
}
const opcion = nombre => { const i = resto.indexOf(nombre); return i >= 0 ? (resto[i + 1] ?? true) : null }
const indice = Number(indiceTxt)
const local = resto.includes('--local')
const base = local ? 'http://localhost:5173' : 'https://rzhub.es'

// Playwright no es dependencia del proyecto: se carga de PLAYWRIGHT_DIR.
let playwright
try {
  const dir = process.env.PLAYWRIGHT_DIR || process.cwd()
  playwright = createRequire(`${dir.replace(/\/$/, '')}/package.json`)('playwright')
} catch {
  console.error('No encuentro Playwright: pon PLAYWRIGHT_DIR=<carpeta que tenga node_modules/playwright>')
  process.exit(1)
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const { data: fila, error: errFila } = await supabase.from('devlog').select('id, cambios, capturas').eq('id', devlogId).single()
if (errFila || !fila) { console.error('No existe esa entrada del devlog:', errFila?.message); process.exit(1) }
if (!(indice >= 0 && indice < fila.cambios.length)) { console.error(`Índice fuera de rango (0-${fila.cambios.length - 1})`); process.exit(1) }

const navegador = await playwright.chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
const pagina = await navegador.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
if (resto.includes('--sesion-falsa')) {
  if (!local) { console.error('--sesion-falsa solo funciona con --local'); process.exit(1) }
  await pagina.route(/\/src\/hooks\/useAuth\.js/, r => r.fulfill({
    contentType: 'application/javascript',
    body: `
      export const supabase = { from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [] }), order: () => Promise.resolve({ data: [] }) }) }), storage: { from: () => ({}) } }
      const user = { id: 'demo', email: 'aficionado@rzhub.es', user_metadata: { name: 'Aficionado' } }
      const profile = { username: 'Aficionado', avatar_url: '' }
      export default function useAuth() { return { user, profile, loading: false, refreshProfile: async () => {} } }
    `,
  }))
}
await pagina.goto(base + ruta, { waitUntil: 'networkidle' })
const clic = opcion('--clic')
if (clic) { await pagina.locator(clic).first().click(); await pagina.waitForLoadState('networkidle') }
const hasta = opcion('--hasta')
if (hasta) {
  const el = pagina.locator(hasta).first()
  await el.waitFor({ timeout: 15000 })
  await el.evaluate(n => window.scrollTo(0, n.getBoundingClientRect().top + window.scrollY - 96))
}
const scroll = Number(opcion('--scroll') || 0)
if (scroll) await pagina.evaluate(y => window.scrollTo(0, y), scroll)
await pagina.waitForTimeout(Number(opcion('--espera') || 1500))
const imagen = await pagina.screenshot({ type: 'jpeg', quality: 84 })
await navegador.close()

const archivo = `${devlogId}-${indice}.jpg`
const { error: errSubida } = await supabase.storage.from('devlog').upload(archivo, imagen, { contentType: 'image/jpeg', upsert: true, cacheControl: '3600' })
if (errSubida) { console.error('Error al subir:', errSubida.message); process.exit(1) }
const { data: { publicUrl } } = supabase.storage.from('devlog').getPublicUrl(archivo)
const url = `${publicUrl}?v=${Date.now()}`

const capturas = Array.from({ length: fila.cambios.length }, (_, i) => fila.capturas?.[i] ?? null)
capturas[indice] = { ruta, url }
const { error: errGuardar } = await supabase.from('devlog').update({ capturas }).eq('id', devlogId)
if (errGuardar) { console.error('Error al guardar en devlog:', errGuardar.message); process.exit(1) }
console.log(`OK ${ruta} → ${url}`)
