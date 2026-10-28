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
import { calcularVentana, seoNotasPartido, nombresNotas, rankingTemporada, formatoNota, SEO_NOTAS_INDEX } from '../src/lib/notasSeo.js'

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

async function rpc(funcion) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${funcion}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!res.ok) throw new Error(`rpc ${funcion}: HTTP ${res.status}`)
  return res.json()
}

// ---------- Las Notas: contenido estático ----------
// Además de las etiquetas del <head>, las páginas de notas llevan dentro de
// <div id="root"> el mismo texto que pinta React (H1, introducción, el uno
// a uno o la convocatoria y enlaces), para que Google lo lea sin ejecutar
// JavaScript. React lo sustituye al arrancar (createRoot vacía el root).
// Las medias solo aparecen con la votación cerrada (public.notas_cerradas).

const ESTILO_ESTATICO = 'max-width:860px;margin:0 auto;padding:96px 16px 48px;line-height:1.55'

function htmlNotasPartido(p, seo, filas, slugVestuario) {
  const lista = filas.map(f => `<li><a href="/jugador/${f.id}">${esc(f.nombre)}</a>${f.media != null ? ` — ${formatoNota(f.media)} (${f.votos} votos)` : ''}</li>`).join('')
  const conNotas = filas.some(f => f.media != null)
  return `<main data-seo-static-body style="${ESTILO_ESTATICO}">
<p>Las Notas · Real Zaragoza · Temporada 26/27</p>
<h1>${esc(seo.h1)}</h1>
<p>${esc(seo.intro)}</p>
<h2>${conNotas ? 'El uno a uno de la afición' : 'Jugadores del Real Zaragoza para puntuar'}</h2>
<ol>${lista}</ol>
<p><a href="/partido/${esc(slugVestuario)}">Vestuario Blanquillo: ${esc(nombresNotas(p).partido)}</a> · <a href="/notas">Todas las notas del Real Zaragoza</a> · <a href="/porra">La Porra</a></p>
</main>`
}

function htmlNotasIndex(partidos, ranking) {
  const rank = ranking.map(j => `<li><a href="/jugador/${j.player_id}">${esc(j.nombre)}</a> — ${formatoNota(j.media)} de media en ${j.partidos} partidos</li>`).join('')
  const lista = partidos.map(p => `<li><a href="/notas/${esc(p.partido_id)}">Notas: ${esc(nombresNotas(p).partido)}</a> (${esc(p.competicion || '')}, ${esc(fechaLarga(p.fecha))})</li>`).join('')
  return `<main data-seo-static-body style="${ESTILO_ESTATICO}">
<p>Las Notas · Real Zaragoza · Temporada 26/27</p>
<h1>${esc(SEO_NOTAS_INDEX.h1)}</h1>
<p>${esc(SEO_NOTAS_INDEX.intro)}</p>
${rank ? `<h2>Los mejor valorados de la temporada</h2><ol>${rank}</ol>` : ''}
<h2>Notas por partido</h2>
<ul>${lista}</ul>
</main>`
}

// Datos de Las Notas para el prerender: rutas por partido y el extra de /notas.
async function datosNotas(partidos) {
  const cerradas = await rpc('notas_cerradas')
  const ids = [...new Set(partidos.flatMap(p => p.convocatoria || []))]
  const jugadores = ids.length ? await consulta('players', `select=id,name&id=in.(${ids.join(',')})`) : []
  const nombre = new Map(jugadores.map(j => [Number(j.id), j.name]))
  const porFecha = [...partidos].sort((a, b) => (a.fecha < b.fecha ? -1 : 1))

  const rutas = []
  for (const p of partidos) {
    const siguiente = porFecha[porFecha.findIndex(x => x.partido_id === p.partido_id) + 1] || null
    const { abierta, cierre, estado } = calcularVentana(p, siguiente)
    if (estado === 'futuro') continue
    const medias = cerradas.filter(f => f.partido_id === p.partido_id)
      .sort((a, b) => b.media - a.media || b.votos - a.votos)
    const cerrada = !abierta && medias.length > 0
    const seo = seoNotasPartido(p, {
      ranking: cerrada ? medias.map(f => ({ nombre: f.nombre, media: Number(f.media) })) : [],
      votantes: medias[0]?.votantes || 0,
      abierta, cierre,
      convocados: (p.convocatoria || []).length,
    })
    const filas = cerrada
      ? medias.map(f => ({ id: f.player_id, nombre: f.nombre, media: Number(f.media), votos: f.votos }))
      : (p.convocatoria || []).filter(id => nombre.has(Number(id))).map(id => ({ id, nombre: nombre.get(Number(id)) }))
    const slugVestuario = slugPartido({ rival: p.rival, fecha: p.fecha, sede: p.local ? 'local' : 'visitante', competicion: /copa/i.test(p.competicion || '') ? p.competicion : null })
    const url = `${SITE_URL}/notas/${p.partido_id}`
    rutas.push({
      path: `/notas/${p.partido_id}`,
      title: seo.title,
      description: seo.description,
      keywords: `notas Real Zaragoza ${p.rival}, uno a uno Real Zaragoza ${p.rival}, puntuaciones jugadores Real Zaragoza, notas jugadores Real Zaragoza hoy`,
      lastmod: abierta ? HOY : p.fecha,
      changefreq: abierta ? 'daily' : 'monthly',
      priority: abierta ? '0.8' : '0.6',
      contenido: htmlNotasPartido(p, seo, filas, slugVestuario),
      jsonLd: [
        {
          '@context': 'https://schema.org', '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Las Notas', item: `${SITE_URL}/notas` },
            { '@type': 'ListItem', position: 3, name: seo.h1, item: url },
          ],
        },
        {
          '@context': 'https://schema.org', '@type': 'ItemList',
          name: `Jugadores del Real Zaragoza puntuados en el ${nombresNotas(p).partido}`,
          numberOfItems: filas.length,
          itemListElement: filas.map((f, i) => ({ '@type': 'ListItem', position: i + 1, name: f.nombre, url: `${SITE_URL}/jugador/${f.id}` })),
        },
      ],
    })
  }

  const ranking = rankingTemporada(cerradas).slice(0, 10)
  const visibles = partidos.filter(p => rutas.some(r => r.path === `/notas/${p.partido_id}`))
  const indice = {
    contenido: htmlNotasIndex(visibles, ranking),
    jsonLd: [{
      '@context': 'https://schema.org', '@type': 'ItemList',
      name: 'Notas de los jugadores del Real Zaragoza por partido',
      itemListElement: visibles.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: `Notas: ${nombresNotas(p).partido}`, url: `${SITE_URL}/notas/${p.partido_id}` })),
    }],
    lastmod: HOY,
  }
  return { rutas, indice }
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
    consulta('partidos', 'select=partido_id,rival,fecha,local,goles_local,goles_visitante,competicion,convocatoria,created_at,votacion_cerrada&order=fecha.desc'),
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
  const notas = await datosNotas(partidos)
  rutas.push(...notas.rutas)
  return { rutas, extrasFijas: { '/notas': notas.indice } }
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
    ...(r.jsonLd || []).map(d => `<script data-seo-static type="application/ld+json">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>`),
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
      const { rutas: rd, extrasFijas } = await rutasDinamicas()
      dinamicas = rd
      for (const r of fijas) if (extrasFijas[r.path]) Object.assign(r, extrasFijas[r.path])
    } catch (e) {
      console.warn(`[prerender-seo] Supabase no disponible, solo páginas fijas: ${e.message}`)
    }
  } else {
    console.warn('[prerender-seo] Faltan VITE_SUPABASE_URL / VITE_SUPABASE_KEY: solo páginas fijas')
  }

  const rutas = [...fijas, ...dinamicas]
  for (const r of rutas) {
    let html = plantilla.replace(/<!--seo:start-->[\s\S]*<!--seo:end-->/, bloqueSeo(r))
    if (r.contenido) html = html.replace('<div id="root"></div>', `<div id="root">${r.contenido}</div>`)
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
