// "Cara a cara" para redes (1080×1350, 4:5): los últimos resultados entre
// el Real Zaragoza y un rival (marcador con el local primero, en verde si
// ganó el Real Zaragoza, amarillo si empató y rojo si perdió), el título con
// los dos escudos, el balance y una foto abajo (sin degradado).

import { encajeEn } from './graficosComun'

export const ANCHO = 1080
export const ALTO = 1350
// Casillas de resultados: 1 fila (6 partidos o menos) o 2. La foto empieza
// justo debajo del balance, así que con una sola fila sube.
const Y_CASILLAS = 140
const HUECO = 16
const filasDe = n => Math.max(1, Math.ceil(Math.min(n, 12) / 6))
const altoCasilla = filas => (filas > 1 ? 276 : 298)
const finCasillas = filas => Y_CASILLAS + filas * (altoCasilla(filas) + HUECO)
export function zonaFoto(numPartidos) {
  const y = finCasillas(filasDe(numPartidos)) + 286
  return { x: 0, y, w: ANCHO, h: ALTO - y }
}
const M = 48
const AMARILLO = '#ffd500'
const AZUL_OSCURO = '#011947'
const TITULOS = "Humane, 'Arial Narrow', sans-serif"
const TEXTO = 'Archivo, sans-serif'
const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
const COLOR = { g: '#1fbf6a', e: AMARILLO, p: '#e5383b' }

function texto(g, t, x, y, fuente, color, alinear = 'left', espaciado = '0px') {
  g.font = fuente
  g.fillStyle = color
  g.textAlign = alinear
  if ('letterSpacing' in g) g.letterSpacing = espaciado
  g.fillText(t, x, y)
  if ('letterSpacing' in g) g.letterSpacing = '0px'
}

function imagen(g, img, cx, cy, caja) {
  if (!img?.complete || !img.naturalWidth) return
  const s = Math.min(caja / img.naturalWidth, caja / img.naturalHeight)
  g.drawImage(img, cx - img.naturalWidth * s / 2, cy - img.naturalHeight * s / 2, img.naturalWidth * s, img.naturalHeight * s)
}

// Logos de competición en SVG (Wikimedia Commons, dominio público): al ser
// vectoriales salen nítidos al tamaño que sea. Se pintan en blanco. LaLiga y
// LaLiga 2 llevan el logo actual (EA Sports / Hypermotion) para cualquier
// temporada. Si un partido es de otra competición, la casilla va sin logo.
export const LOGOS_COMPETICION = {
  'Primera Federación': '/escudos/competiciones/primera-federacion.svg',
  'Copa del Rey': '/escudos/competiciones/copa-del-rey.svg',
  LaLiga: '/escudos/competiciones/laliga.svg',
  'LaLiga 2': '/escudos/competiciones/laliga-2.svg',
}

// Silueta en blanco de un logo (son a color y sobre el azul no se ven),
// rasterizada directamente al tamaño final en píxeles para que no haya que
// reducirla después (eso es lo que dejaba los bordes en diente de sierra).
const siluetas = new WeakMap()
function enBlanco(img, w, h) {
  const clave = `${w}x${h}`
  const porTamaño = siluetas.get(img) || new Map()
  siluetas.set(img, porTamaño)
  if (!porTamaño.has(clave)) {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const x = c.getContext('2d')
    x.imageSmoothingQuality = 'high'
    x.drawImage(img, 0, 0, w, h)
    x.globalCompositeOperation = 'source-in'
    x.fillStyle = '#ffffff'
    x.fillRect(0, 0, w, h)
    porTamaño.set(clave, c)
  }
  return porTamaño.get(clave)
}

export const resultadoDe = p => (p.goles_zaragoza > p.goles_rival ? 'g' : p.goles_zaragoza < p.goles_rival ? 'p' : 'e')

/**
 * datos: { titulo, subtitulo, credito, ajusteFoto, zaragozaDerecha, partidos: [{ fecha, sede, competicion, goles_zaragoza, goles_rival }] }
 * recursos: { foto, logo, escudoZaragoza, escudoRival, logosCompeticion: { [competicion]: img } }
 */
export function dibujarCaraACara(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high' // logos y fotos reducidos sin dientes de sierra
  g.save()
  g.textBaseline = 'alphabetic'
  const fondo = g.createLinearGradient(0, 0, 0, ALTO)
  fondo.addColorStop(0, AZUL_OSCURO)
  fondo.addColorStop(0.6, '#002261')
  fondo.addColorStop(1, '#002978')
  g.fillStyle = fondo
  g.fillRect(0, 0, ANCHO, ALTO)

  // Foto abajo, con corte limpio.
  const { foto } = recursos
  const ZONA_FOTO = zonaFoto((datos.partidos || []).length)
  if (foto?.complete && foto.naturalWidth) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeEn(foto, ZONA_FOTO, zoom, dx, dy)
    g.save()
    g.beginPath()
    g.rect(ZONA_FOTO.x, ZONA_FOTO.y, ZONA_FOTO.w, ZONA_FOTO.h)
    g.clip()
    g.drawImage(foto, e.x, e.y, e.w, e.h)
    g.restore()
  }
  if (datos.credito) {
    g.save()
    g.translate(ANCHO - 24, ALTO - 40)
    g.rotate(-Math.PI / 2)
    texto(g, datos.credito.toUpperCase(), 0, 0, `600 14px ${TEXTO}`, 'rgba(255,255,255,0.8)', 'left', '1px')
    g.restore()
  }

  // Cabecera.
  const logo = recursos.logo
  if (logo?.complete && logo.naturalWidth) g.drawImage(logo, M, 44, 112, 112 * logo.naturalHeight / logo.naturalWidth)
  if (datos.subtitulo) {
    // Todo en mayúsculas; si no cabe junto al logo, se reduce la letra.
    const sub = datos.subtitulo.toUpperCase()
    let t = 21
    g.font = `700 ${t}px ${TEXTO}`
    while (t > 14 && g.measureText(sub).width > ANCHO - M * 2 - 150) { t -= 1; g.font = `700 ${t}px ${TEXTO}` }
    texto(g, sub, ANCHO - M, 82, `700 ${t}px ${TEXTO}`, 'rgba(255,255,255,0.88)', 'right')
  }

  // Resultados (el más reciente primero), en filas de 6.
  const partidos = (datos.partidos || []).slice(0, 12)
  const cols = 6
  const hueco = HUECO
  const w = (ANCHO - M * 2 - hueco * (cols - 1)) / cols
  const filas = filasDe(partidos.length)
  const h = altoCasilla(filas)
  const y0 = Y_CASILLAS
  partidos.forEach((p, i) => {
    const x = M + (i % cols) * (w + hueco)
    const y = y0 + Math.floor(i / cols) * (h + hueco)
    const r = resultadoDe(p)
    const color = COLOR[r]
    const local = p.sede !== 'visitante'
    const marcador = local ? `${p.goles_zaragoza}-${p.goles_rival}` : `${p.goles_rival}-${p.goles_zaragoza}`
    g.save()
    g.beginPath()
    g.roundRect(x, y, w, h, 14)
    g.fillStyle = 'rgba(255,255,255,0.07)'
    g.fill()
    g.lineWidth = 3
    g.strokeStyle = color
    g.stroke()
    g.clip()
    const alturaFecha = 54
    g.fillStyle = color
    g.fillRect(x, y + h - alturaFecha, w, alturaFecha)
    g.restore()
    // Arriba casa / fuera y, debajo, centrado, el logo de la competición.
    texto(g, local ? 'EN CASA' : 'FUERA', x + w / 2, y + 30, `700 14px ${TEXTO}`, 'rgba(255,255,255,0.6)', 'center', '1px')
    const logoComp = recursos.logosCompeticion?.[p.competicion]
    if (logoComp?.complete && logoComp.naturalWidth) {
      const s = Math.min(60 / logoComp.naturalWidth, 44 / logoComp.naturalHeight)
      const lw = Math.round(logoComp.naturalWidth * s)
      const lh = Math.round(logoComp.naturalHeight * s)
      g.globalAlpha = 0.92
      // La silueta se hace a los píxeles reales del canvas (que va escalado).
      const k = g.getTransform().a
      g.drawImage(enBlanco(logoComp, Math.round(lw * k), Math.round(lh * k)), Math.round(x + w / 2 - lw / 2), Math.round(y + 66 - lh / 2), lw, lh)
      g.globalAlpha = 1
    }
    texto(g, marcador, x + w / 2, y + h - 54 - 34, `700 ${Math.min(126, w * 0.86)}px ${TITULOS}`, color, 'center')
    const d = String(p.fecha || '')
    const fecha = d ? `${MESES[Number(d.slice(5, 7)) - 1]}-${d.slice(0, 4)}` : ''
    texto(g, fecha, x + w / 2, y + h - 18, `800 22px ${TEXTO}`, r === 'e' ? AZUL_OSCURO : '#ffffff', 'center', '0.5px')
  })

  // Título con los dos escudos y balance.
  const yTitulo = y0 + filas * (h + hueco) + 40
  // Por defecto el Real Zaragoza a la izquierda (como local); se puede cambiar.
  const [izq, der] = datos.zaragozaDerecha ? [recursos.escudoRival, recursos.escudoZaragoza] : [recursos.escudoZaragoza, recursos.escudoRival]
  imagen(g, izq, M + 66, yTitulo + 62, 124)
  imagen(g, der, ANCHO - M - 66, yTitulo + 62, 124)
  const titulo = (datos.titulo || 'Cara a cara').toUpperCase()
  let tam = 170
  g.font = `700 ${tam}px ${TITULOS}`
  while (tam > 60 && g.measureText(titulo).width > ANCHO - M * 2 - 300) { tam -= 4; g.font = `700 ${tam}px ${TITULOS}` }
  const cap = g.measureText(titulo).actualBoundingBoxAscent
  texto(g, titulo, ANCHO / 2, yTitulo + 62 + cap / 2, `700 ${tam}px ${TITULOS}`, '#ffffff', 'center')
  const n = { g: 0, e: 0, p: 0 }
  partidos.forEach(p => { n[resultadoDe(p)]++ })
  const piezas = [[`${n.g} ${n.g === 1 ? 'VICTORIA' : 'VICTORIAS'}`, COLOR.g], [`${n.e} ${n.e === 1 ? 'EMPATE' : 'EMPATES'}`, AMARILLO], [`${n.p} ${n.p === 1 ? 'DERROTA' : 'DERROTAS'}`, COLOR.p]]
  g.font = `800 24px ${TEXTO}`
  const sep = '   ·   '
  const anchoTotal = piezas.reduce((a, [t]) => a + g.measureText(t).width, 0) + g.measureText(sep).width * 2
  let x = ANCHO / 2 - anchoTotal / 2
  const yBal = yTitulo + 62 + cap / 2 + 56
  piezas.forEach(([t, c], i) => {
    texto(g, t, x, yBal, `800 24px ${TEXTO}`, c)
    x += g.measureText(t).width
    if (i < 2) { texto(g, sep, x, yBal, `800 24px ${TEXTO}`, 'rgba(255,255,255,0.5)'); x += g.measureText(sep).width }
  })
  texto(g, 'DEL REAL ZARAGOZA', ANCHO / 2, yBal + 30, `600 16px ${TEXTO}`, 'rgba(255,255,255,0.6)', 'center', '1.5px')

  texto(g, 'rzhub.es', M, ALTO - 34, `800 19px ${TEXTO}`, AMARILLO, 'left', '1px')
  g.restore()
}
