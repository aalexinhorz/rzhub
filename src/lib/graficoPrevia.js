// "Previa del rival" para redes (1080×1350, 4:5), con el corte recto de las
// demás plantillas: el jugador a seguir a toda altura en un lado (por
// defecto a la izquierda) con su nombre encima, y en el panel el rival en
// cifras (posición, puntos, goles y racha), sus goleadores y sus bajas.

import { encajeEn, siluetaBlanca } from './graficosComun'
import { tarjeta } from './graficoListas'
import { AMARILLO, AZUL_OSCURO, TEXTO, TITULOS, ajustar, creditoVertical, hayImagen, imagen, logoRz, texto } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
const PANEL = 600
const ANCHO_FOTO = ANCHO - PANEL
const M = 48
const ANCHO_UTIL = PANEL - 2 * M
export const zonaFoto = fotoDerecha => ({ x: fotoDerecha ? PANEL : 0, y: 0, w: ANCHO_FOTO, h: ALTO })
const COLOR_FORMA = { V: ['#1fbf6a', '#ffffff'], E: [AMARILLO, AZUL_OSCURO], D: ['#e5383b', '#ffffff'] }

function seccion(g, t, y) {
  g.fillStyle = AMARILLO
  g.fillRect(M, y - 17, 6, 20)
  texto(g, t, M + 18, y, `700 19px ${TEXTO}`, '#ffffff', 'left', '2.5px')
}

// Foto redonda (jugador) recortada a un círculo.
function fotoRedonda(g, img, cx, cy, r) {
  g.save()
  g.beginPath()
  g.arc(cx, cy, r, 0, Math.PI * 2)
  g.fillStyle = '#c5d8f0'
  g.fill()
  g.clip()
  if (hayImagen(img)) {
    const s = Math.max((2 * r) / img.naturalWidth, (2 * r) / img.naturalHeight)
    g.drawImage(img, cx - img.naturalWidth * s / 2, cy - r, img.naturalWidth * s, img.naturalHeight * s)
  }
  g.restore()
}

function recortar(g, t, ancho) {
  let s = t
  while (g.measureText(s).width > ancho && s.length > 3) s = s.slice(0, -1)
  return s === t ? t : `${s.trimEnd()}…`
}

/**
 * datos: { rival, antetitulo, info, fotoDerecha, equipo: { pos, pts, gf, gc, forma: ['V','E','D'] } | null,
 *          goleadores: [{ nombre, goles }], bajas: [{ nombre }], aSeguir, credito, ajusteFoto }
 * recursos: { logo, escudoRival, fotosGoleadores: [img], bajas: [{ foto, escudo }], fotoSeguir (subida), fotoSeguirBd (la de la base de datos) }
 */
export function dibujarGraficoPrevia(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  const fondo = g.createLinearGradient(0, 0, 0, ALTO)
  fondo.addColorStop(0, AZUL_OSCURO)
  fondo.addColorStop(0.5, '#002261')
  fondo.addColorStop(1, '#002978')
  g.fillStyle = fondo
  g.fillRect(0, 0, ANCHO, ALTO)

  // ── Foto del jugador a seguir, con su nombre ──
  const zona = zonaFoto(datos.fotoDerecha)
  g.save()
  g.beginPath()
  g.rect(zona.x, zona.y, zona.w, zona.h)
  g.fillStyle = '#0b2a6b'
  g.fill()
  g.clip()
  if (!hayImagen(recursos.fotoSeguir) && hayImagen(recursos.fotoSeguirBd)) {
    // Sin foto subida: la de la base de datos es solo la cara, así que va a
    // lo ancho de la columna, encima del nombre, en vez de ampliarla entera.
    const f = recursos.fotoSeguirBd
    const w = zona.w
    const h = w * f.naturalHeight / f.naturalWidth
    // Se funde por abajo para que no se vea el corte del cuello.
    const k = g.getTransform().a
    const c = document.createElement('canvas')
    c.width = Math.round(w * k)
    c.height = Math.round(h * k)
    const x = c.getContext('2d')
    x.imageSmoothingQuality = 'high'
    x.drawImage(f, 0, 0, c.width, c.height)
    const fundido = x.createLinearGradient(0, c.height * 0.62, 0, c.height)
    fundido.addColorStop(0, 'rgba(0,0,0,1)')
    fundido.addColorStop(1, 'rgba(0,0,0,0)')
    x.globalCompositeOperation = 'destination-in'
    x.fillStyle = fundido
    x.fillRect(0, 0, c.width, c.height)
    g.drawImage(c, zona.x, ALTO - 230 - h, w, h)
  } else if (hayImagen(recursos.fotoSeguir)) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeEn(recursos.fotoSeguir, zona, zoom, dx, dy)
    g.drawImage(recursos.fotoSeguir, e.x, e.y, e.w, e.h)
  }
  const sombra = g.createLinearGradient(0, ALTO * 0.58, 0, ALTO)
  sombra.addColorStop(0, 'rgba(1,25,71,0)')
  sombra.addColorStop(0.6, 'rgba(1,25,71,0.75)')
  sombra.addColorStop(1, 'rgba(1,25,71,0.95)')
  g.fillStyle = sombra
  g.fillRect(zona.x, 0, zona.w, ALTO)
  g.restore()
  creditoVertical(g, datos.credito, zona.x + zona.w - 24, 1080)
  const aSeguir = (datos.aSeguir || '').toUpperCase()
  if (aSeguir) {
    const t = ajustar(g, aSeguir, x => `700 ${x}px ${TITULOS}`, 150, zona.w - 2 * M + 8, 60)
    texto(g, aSeguir, zona.x + M - 4, ALTO - 62, `700 ${t}px ${TITULOS}`, '#ffffff')
    g.font = `700 ${t}px ${TITULOS}`
    const alto = g.measureText(aSeguir).actualBoundingBoxAscent
    const yEtiqueta = ALTO - 62 - alto - 22
    g.font = `700 20px ${TEXTO}`
    if ('letterSpacing' in g) g.letterSpacing = '2.5px'
    const w = g.measureText('A SEGUIR').width + 32
    if ('letterSpacing' in g) g.letterSpacing = '0px'
    g.fillStyle = AMARILLO
    g.beginPath()
    g.roundRect(zona.x + M, yEtiqueta - 30, w, 42, 21)
    g.fill()
    texto(g, 'A SEGUIR', zona.x + M + w / 2 + 1, yEtiqueta - 1, `700 20px ${TEXTO}`, AZUL_OSCURO, 'center', '2.5px')
  }

  // ── Panel ──
  g.translate(datos.fotoDerecha ? 0 : ANCHO_FOTO, 0)
  // Escudo del rival en blanco, muy tenue, de fondo.
  if (hayImagen(recursos.escudoRival)) {
    const e = recursos.escudoRival
    const lado = 520
    const s = Math.min(lado / e.naturalWidth, lado / e.naturalHeight)
    const w = e.naturalWidth * s
    const h = e.naturalHeight * s
    const k = g.getTransform().a
    g.save()
    g.globalAlpha = 0.05
    g.drawImage(siluetaBlanca(e, Math.round(w * k), Math.round(h * k)), PANEL - w * 0.62, 640 - h / 2, w, h)
    g.restore()
  }

  // Cabecera: escudo con antetítulo y datos al lado; debajo, el nombre.
  imagen(g, recursos.escudoRival, M + 52, 124, 104)
  const xLado = M + 130
  texto(g, (datos.antetitulo || 'Previa').toUpperCase(), xLado, 116, `700 19px ${TEXTO}`, AMARILLO, 'left', '2.5px')
  if (datos.info) {
    g.font = `500 19px ${TEXTO}`
    texto(g, recortar(g, datos.info, PANEL - M - xLado), xLado, 148, `500 19px ${TEXTO}`, 'rgba(255,255,255,0.8)')
  }
  const nombre = (datos.rival || '').toUpperCase()
  if (nombre) {
    const t = ajustar(g, nombre, x => `700 ${x}px ${TITULOS}`, 150, ANCHO_UTIL + 8, 60)
    texto(g, nombre, M - 4, 330, `700 ${t}px ${TITULOS}`, '#ffffff')
  }

  // ── El rival en cifras ──
  const eq = datos.equipo
  const yCifras = 378
  g.fillStyle = 'rgba(255,255,255,0.15)'
  g.fillRect(M, yCifras, ANCHO_UTIL, 1.5)
  const cifras = [
    ['POSICIÓN', eq ? `${eq.pos}.º` : '—'],
    ['PUNTOS', eq ? String(eq.pts) : '—'],
    ['GOLES', eq ? `${eq.gf}-${eq.gc}` : '—'],
  ]
  const anchoCifra = ANCHO_UTIL / 3
  cifras.forEach(([etiqueta, valor], i) => {
    const x = M + i * anchoCifra
    if (i) { g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(x, yCifras + 24, 1.5, 104) }
    const cx = x + anchoCifra / 2
    texto(g, etiqueta, cx, yCifras + 50, `600 15px ${TEXTO}`, 'rgba(255,255,255,0.7)', 'center', '2px')
    const t = ajustar(g, valor, x => `700 ${x}px ${TITULOS}`, 104, anchoCifra - 24, 50)
    texto(g, valor, cx, yCifras + 140, `700 ${t}px ${TITULOS}`, i === 0 ? AMARILLO : '#ffffff', 'center')
  })
  g.fillStyle = 'rgba(255,255,255,0.15)'
  g.fillRect(M, yCifras + 162, ANCHO_UTIL, 1.5)

  // Racha: últimos cinco partidos.
  const forma = eq?.forma || []
  const yRacha = yCifras + 192
  texto(g, 'ÚLTIMOS 5', M, yRacha + 30, `600 15px ${TEXTO}`, 'rgba(255,255,255,0.7)', 'left', '2px')
  const lado = 44
  const huecoRacha = 10
  for (let i = 0; i < 5; i++) {
    const r = forma[i]
    const x = PANEL - M - (5 - i) * lado - (4 - i) * huecoRacha
    const [fondoR, tinta] = COLOR_FORMA[r] || ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.5)']
    g.fillStyle = fondoR
    g.beginPath()
    g.roundRect(x, yRacha, lado, lado, 8)
    g.fill()
    texto(g, r || '·', x + lado / 2, yRacha + 31, `700 21px ${TEXTO}`, tinta, 'center')
  }

  // ── Goleadores ──
  const goleadores = (datos.goleadores || []).filter(x => x.nombre).slice(0, 3)
  let y = yRacha + 124
  if (goleadores.length) {
    seccion(g, 'SUS GOLEADORES', y)
    y += 22
    goleadores.forEach((x, i) => {
      const yf = y + i * 92
      texto(g, String(i + 1), M + 14, yf + 60, `700 58px ${TITULOS}`, AMARILLO, 'center')
      fotoRedonda(g, recursos.fotosGoleadores?.[i], M + 74, yf + 42, 30)
      const goles = x.goles === '' || x.goles == null ? '' : String(x.goles)
      g.font = `700 24px ${TEXTO}`
      texto(g, recortar(g, x.nombre, ANCHO_UTIL - 118 - (goles ? 90 : 0)), M + 118, yf + 50, `700 24px ${TEXTO}`, '#ffffff')
      if (goles) {
        texto(g, goles, PANEL - M, yf + 60, `700 66px ${TITULOS}`, '#ffffff', 'right')
        g.font = `700 66px ${TITULOS}`
        const anchoGoles = g.measureText(goles).width
        texto(g, Number(goles) === 1 ? 'GOL' : 'GOLES', PANEL - M - anchoGoles - 10, yf + 52, `600 13px ${TEXTO}`, 'rgba(255,255,255,0.6)', 'right', '1.5px')
      }
      if (i < goleadores.length - 1) { g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(M + 118, yf + 88, ANCHO_UTIL - 118, 1) }
    })
    y += goleadores.length * 92 + 48
  }

  // ── Bajas ──
  seccion(g, 'BAJAS', y)
  const bajas = (datos.bajas || []).filter(x => x.nombre).slice(0, 4)
  if (bajas.length) {
    // Tarjetas del Lineup en fila; con las cuatro, ocupan todo el ancho.
    const hueco = 14
    const w = (ANCHO_UTIL - hueco * 3) / 4
    bajas.forEach((b, i) => {
      tarjeta(g, M + i * (w + hueco), y + 26, w, { ...recursos.bajas?.[i], nombre: b.nombre, esZaragoza: false })
    })
  } else {
    texto(g, 'Sin bajas confirmadas', M, y + 48, `500 21px ${TEXTO}`, 'rgba(255,255,255,0.7)')
  }

  // ── Pie ──
  logoRz(g, recursos.logo, M, 1252, 112)
  texto(g, 'rzhub.es', PANEL - M, 1296, `700 19px ${TEXTO}`, AMARILLO, 'right', '1px')
  g.restore()
}
