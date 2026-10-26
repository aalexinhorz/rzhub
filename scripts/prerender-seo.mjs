// Se ejecuta después de `vite build` (ver "build" en package.json).
//
// La web es una SPA: sin esto, todas las URLs sirven el mismo index.html y
// quien no ejecuta JavaScript (WhatsApp, X, Telegram, Facebook, Discord…)
// ve el título y la imagen de la home en cualquier enlace. Aquí se escribe
// dist/<ruta>/index.html con el título, descripción, canonical e imagen de
// cada página, y el sitemap completo. Vercel sirve antes un fichero real que
// el rewrite a "/", así que no hace falta tocar vercel.json.
//
// Los textos de las páginas fijas se leen del propio <SEO .../> de cada
// página (src/pages/*.jsx) para no duplicarlos; los de las dinámicas
// replican lo que pone cada página al cargar sus datos.

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { seoPorra, PORRA_OG_IMAGE } from '../src/lib/seoPorra.js'
import { slugPartido, seoPartido, seoProximoPartido } from '../src/lib/partidoSeo.js'
import { proximoDeLista } from '../src/lib/reglasPartido.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const SITE_URL = 'https://www.rzhub.es'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`
// Clave IndexNow: el fichero public/<clave>.txt demuestra a Bing & cía que el
// sitio es nuestro. Si se cambia, renombrar también ese fichero.
const INDEXNOW_KEY = 'e3e666e445dfefca211f8014c25ae106'
const HOY = new Date().toISOString().slice(0, 10)

const env = loadEnv('production', ROOT, '')
const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_KEY = env.VITE_SUPABASE_KEY

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// ---------- páginas fijas: props literales de <SEO> ----------

function propLiteral(bloque, nombre) {
  const m = bloque.match(new RegExp(`\\b${nombre}=(?:"([^"]*)"|\\{\`([^\`$]*)\`\\})`))
  return m ? (m[1] ?? m[2]) : null
}

function rutasFijas() {
  // Solo rutas que existen de verdad en App.jsx (hay páginas con <SEO> sin ruta).
  const app = readFileSync(join(ROOT, 'src/App.jsx'), 'utf8')
  const rutasApp = new Set([...app.matchAll(/<Route path="([^"]+)"/g)].map(m => m[1]))
  const dir = join(ROOT, 'src/pages')
  const rutas = []
  for (const f of readdirSync(dir).filter(f => f.endsWith('.jsx'))) {
    const src = readFileSync(join(dir, f), 'utf8')
    const ini = src.indexOf('<SEO')
    if (ini < 0) continue
    const bloque = src.slice(ini, src.indexOf('/>', ini))
    if (/\bnoindex\b/.test(bloque)) continue
    const path = propLiteral(bloque, 'path')
    const title = propLiteral(bloque, 'title')
    if (path == null || !title || path.includes(':') || !rutasApp.has(path)) continue
    rutas.push({
      path,
      title,
      description: propLiteral(bloque, 'description'),
      keywords: propLiteral(bloque, 'keywords'),
    })
  }
  return rutas
}

// ---------- páginas dinámicas: Supabase ----------

async function consulta(tabla, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}?${query}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
  if (!res.ok) throw new Error(`${tabla}: HTTP ${res.status}`)
  return res.json()
}

const fechaLarga = d => new Date(`${d}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

function posicionJugador(pos) {
  const p = (pos || '').toUpperCase()
  if (p.startsWith('POR')) return 'portero'
  if (p === 'LD' || p === 'LI' || p.startsWith('DEF')) return 'defensa'
  if (p === 'MC' || p.startsWith('MED')) return 'centrocampista'
  if (p === 'ED' || p === 'EI' || p.startsWith('DEL')) return 'delantero'
  return 'sin definir'
}

async function rutasDinamicas() {
  const [porraAbierta, noticias, jugadores, rivales, partidos, calendario] = await Promise.all([
    consulta('porra_partidos', 'select=rival,sede,kickoff,jornada,competicion&abierto=eq.true&finalizado=eq.false&order=kickoff.asc&limit=1'),
    consulta('noticias', 'select=slug,titulo,meta_titulo,meta_descripcion,excerpt,imagen_url,og_imagen,created_at,updated_at&publicada=eq.true&order=created_at.desc'),
    consulta('players', 'select=id,name,position&is_zaragoza=eq.true'),
    consulta('rivales', 'select=id,nombre'),
    consulta('partidos', 'select=partido_id,rival,fecha,local,goles_local,goles_visitante&order=fecha.desc'),
    consulta('porra_partidos', 'select=rival,sede,kickoff,fecha,jornada,competicion,goles_zaragoza,goles_rival,goleadores,finalizado,tv&kickoff=not.is.null&order=kickoff.asc'),
  ])

  const porra = seoPorra(porraAbierta[0])
  const rutas = [{ path: '/porra', ...porra, image: PORRA_OG_IMAGE, lastmod: HOY, changefreq: 'daily', priority: '1.0' }]

  const proximo = proximoDeLista(calendario)
  if (proximo) {
    rutas.push({ path: '/proximo-partido', ...seoProximoPartido(proximo), image: PORRA_OG_IMAGE, lastmod: HOY, changefreq: 'daily', priority: '1.0' })
  }
  for (const p of calendario) {
    rutas.push({
      path: `/partido/${slugPartido(p)}`,
      ...seoPartido(p),
      image: p.finalizado ? DEFAULT_OG_IMAGE : PORRA_OG_IMAGE,
      lastmod: p.finalizado ? p.fecha : p === proximo ? HOY : undefined,
      changefreq: p.finalizado ? 'monthly' : 'daily',
      priority: p === proximo ? '0.9' : p.finalizado ? '0.6' : '0.5',
    })
  }

  for (const n of noticias) {
    if (!n.slug) continue
    // Los tweets importados (Mundo Blanquillo) son contenido de terceros de
    // ~150 caracteres: indexarlos a cientos es "contenido copiado a escala"
    // para Google y puede hundir al dominio entero. Se quedan para los
    // usuarios y para compartir, pero noindex y fuera del sitemap.
    const esTweet = n.slug.startsWith('tweet-')
    rutas.push({
      noindex: esTweet,
      path: `/noticias/${n.slug}`,
      title: `${n.meta_titulo || n.titulo} | RZ Hub`,
      description: n.meta_descripcion || n.excerpt || n.titulo,
      image: n.og_imagen || n.imagen_url || DEFAULT_OG_IMAGE,
      sitemapImage: n.og_imagen || n.imagen_url || null,
      type: 'article',
      publishedTime: n.created_at,
      lastmod: n.updated_at || n.created_at,
      priority: '0.6',
    })
  }
  for (const j of jugadores) {
    rutas.push({
      path: `/jugador/${j.id}`,
      title: `${j.name} | Estadísticas del Real Zaragoza | RZ Hub`,
      description: `Partidos jugados, minutos, goles y nota media de la afición de ${j.name}, ${posicionJugador(j.position)} del Real Zaragoza, en la temporada 26/27.`,
      changefreq: 'weekly',
      priority: '0.6',
    })
  }
  for (const r of rivales) {
    rutas.push({
      path: `/rival/${r.id}`,
      title: `${r.nombre} | Ficha del rival | RZ Hub`,
      description: `Historia, plantilla completa y enfrentamientos del Real Zaragoza contra el ${r.nombre}.`,
      changefreq: 'weekly',
      priority: '0.6',
    })
  }
  for (const p of partidos) {
    const local = p.local ? 'Real Zaragoza' : p.rival
    const visitante = p.local ? p.rival : 'Real Zaragoza'
    rutas.push({
      path: `/notas/${p.partido_id}`,
      title: `Notas: ${local} ${p.goles_local ?? ''}-${p.goles_visitante ?? ''} ${visitante} | RZ Hub`,
      description: `Puntúa a los jugadores del Real Zaragoza en el partido frente al ${p.rival} (${fechaLarga(p.fecha)}) y consulta la nota media de la afición.`,
      lastmod: p.fecha,
      priority: '0.5',
    })
  }
  return rutas
}

// ---------- escritura ----------

function bloqueSeo(r) {
  const url = `${SITE_URL}${r.path}`
  const image = r.image || DEFAULT_OG_IMAGE
  const description = r.description || ''
  const tags = [
    `<title data-seo-static>${esc(r.title)}</title>`,
    `<meta data-seo-static name="description" content="${esc(description)}" />`,
    r.keywords && `<meta data-seo-static name="keywords" content="${esc(r.keywords)}" />`,
    `<meta data-seo-static name="robots" content="${r.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />`,
    `<link data-seo-static rel="canonical" href="${esc(url)}" />`,
    `<meta data-seo-static property="og:title" content="${esc(r.title)}" />`,
    `<meta data-seo-static property="og:description" content="${esc(description)}" />`,
    `<meta data-seo-static property="og:url" content="${esc(url)}" />`,
    `<meta data-seo-static property="og:image" content="${esc(image)}" />`,
    `<meta data-seo-static property="og:type" content="${r.type || 'website'}" />`,
    `<meta data-seo-static property="og:site_name" content="RZ Hub" />`,
    `<meta data-seo-static property="og:locale" content="es_ES" />`,
    r.publishedTime && `<meta data-seo-static property="article:published_time" content="${esc(r.publishedTime)}" />`,
    `<meta data-seo-static name="twitter:card" content="summary_large_image" />`,
    `<meta data-seo-static name="twitter:site" content="@rzhub_" />`,
    `<meta data-seo-static name="twitter:title" content="${esc(r.title)}" />`,
    `<meta data-seo-static name="twitter:description" content="${esc(description)}" />`,
    `<meta data-seo-static name="twitter:image" content="${esc(image)}" />`,
  ]
  return `<!--seo:start-->\n    ${tags.filter(Boolean).join('\n    ')}\n    <!--seo:end-->`
}

function sitemap(rutas) {
  const urls = rutas.filter(r => !r.noindex).map(r => {
    const partes = [`<loc>${esc(`${SITE_URL}${r.path}`)}</loc>`]
    if (r.lastmod) partes.push(`<lastmod>${r.lastmod.slice(0, 10)}</lastmod>`)
    if (r.changefreq) partes.push(`<changefreq>${r.changefreq}</changefreq>`)
    if (r.priority) partes.push(`<priority>${r.priority}</priority>`)
    if (r.sitemapImage) partes.push(`<image:image><image:loc>${esc(r.sitemapImage)}</image:loc></image:image>`)
    return `  <url>${partes.join('')}</url>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`
}

const PRIORIDAD_FIJAS = { '/': '1.0', '/noticias': '0.9', '/lineup': '0.9', '/mercado': '0.9', '/notas': '0.8', '/calendario': '0.8', '/estadisticas': '0.8', '/rivales': '0.8' }

// Avisa a Bing/Yandex/Seznam (IndexNow) de las URLs que han cambiado hace
// poco. Solo en el despliegue de producción de Vercel; nunca falla el build.
async function avisarIndexNow(rutas) {
  if (process.env.VERCEL_ENV !== 'production') return
  const limite = new Date(Date.now() - 3 * 86400_000).toISOString().slice(0, 10)
  const urls = rutas
    .filter(r => !r.noindex && (r.path === '/' || (r.lastmod && r.lastmod.slice(0, 10) >= limite)))
    .map(r => `${SITE_URL}${r.path}`)
  if (!urls.length) return
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: 'www.rzhub.es', key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`, urlList: urls }),
      signal: AbortSignal.timeout(10_000),
    })
    console.log(`[prerender-seo] IndexNow: ${urls.length} URLs → HTTP ${res.status}`)
  } catch (e) {
    console.warn(`[prerender-seo] IndexNow no disponible: ${e.message}`)
  }
}

async function main() {
  const plantilla = readFileSync(join(DIST, 'index.html'), 'utf8')
  if (!/<!--seo:start-->[\s\S]*<!--seo:end-->/.test(plantilla)) throw new Error('dist/index.html no tiene el bloque <!--seo:start--> … <!--seo:end-->')

  const fijas = rutasFijas()
    .filter(r => r.path !== '/porra' && r.path !== '/proximo-partido')
    .map(r => ({ ...r, changefreq: 'daily', priority: PRIORIDAD_FIJAS[r.path] || '0.7' }))

  let dinamicas = []
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      dinamicas = await rutasDinamicas()
    } catch (e) {
      console.warn(`[prerender-seo] Supabase no disponible, solo páginas fijas: ${e.message}`)
    }
  } else {
    console.warn('[prerender-seo] Faltan VITE_SUPABASE_URL / VITE_SUPABASE_KEY: solo páginas fijas')
  }

  const rutas = [...fijas, ...dinamicas]
  for (const r of rutas) {
    const html = plantilla.replace(/<!--seo:start-->[\s\S]*<!--seo:end-->/, bloqueSeo(r))
    const destino = r.path === '' ? DIST : join(DIST, r.path)
    mkdirSync(destino, { recursive: true })
    writeFileSync(join(destino, 'index.html'), html)
  }
  writeFileSync(join(DIST, 'sitemap.xml'), sitemap(rutas))
  const indexables = rutas.filter(r => !r.noindex).length
  console.log(`[prerender-seo] ${rutas.length} páginas (${fijas.length} fijas, ${dinamicas.length} dinámicas); ${indexables} en sitemap.xml`)
  await avisarIndexNow(rutas)
}

main().catch(e => {
  // Nunca tumbar el despliegue por esto: la web funciona igual sin estas páginas.
  console.error('[prerender-seo] Error:', e)
})
