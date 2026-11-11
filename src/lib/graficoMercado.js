// "Fichaje / salida" para redes (1080×1350, 4:5), con el mismo esquema que
// la plantilla de estadísticas: foto a la izquierda con el nombre encima y,
// a la derecha, el panel azul con el logo, la operación en grande (FICHAJE,
// CESIÓN…), un detalle opcional y los escudos de los dos clubes con una
// flecha (de dónde viene a dónde va). Sin Archivo Black: Humane para lo
// grande y Archivo Bold/SemiBold para el resto.

import { encajeEn } from './graficosComun'

export const ANCHO = 1080
export const ALTO = 1350
export const PANEL_X = 702
export const ZONA_FOTO = { x: 0, y: 0, w: PANEL_X, h: ALTO }
const MARGEN = 42
const X = 768 // columna del panel, como en estadísticas
const ANCHO_PANEL = 1026 - X
const AMARILLO = '#ffd500'
const TITULOS = "Humane, 'Arial Narrow', sans-serif"
const TEXTO = 'Archivo, sans-serif'


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

function ajustar(g, t, fuente, max, ancho, min = 20) {
  let tam = max
  g.font = fuente(tam)
  while (tam > min && g.measureText(t).width > ancho) { tam -= 2; g.font = fuente(tam) }
  return tam
}

function partir(g, t, ancho) {
  const lineas = []
  let actual = ''
  for (const p of String(t || '').split(/\s+/).filter(Boolean)) {
    const prueba = actual ? `${actual} ${p}` : p
    if (g.measureText(prueba).width > ancho && actual) { lineas.push(actual); actual = p } else actual = prueba
  }
  if (actual) lineas.push(actual)
  return lineas
}

// Escudo con el nombre del club a la derecha y, encima, "DE" / "A".
function club(g, escudo, nombre, rotulo, yCentro) {
  const caja = 116
  imagen(g, escudo, X + caja / 2, yCentro, caja)
  const xTexto = X + caja + 20
  const anchoTexto = 1026 - xTexto
  texto(g, rotulo, xTexto, yCentro - 22, `700 14px ${TEXTO}`, AMARILLO, 'left', '1.5px')
  g.font = `700 21px ${TEXTO}`
  const lineas = partir(g, (nombre || '').toUpperCase(), anchoTexto).slice(0, 3)
  lineas.forEach((l, i) => texto(g, l, xTexto, yCentro + 8 + i * 25, `700 21px ${TEXTO}`, '#ffffff'))
}

/**
 * datos: { de, a, operacion, detalle, nombre, apellido, credito, ajusteFoto }
 * recursos: { foto, logo, escudoDe, escudoA }
 */
export function dibujarGraficoMercado(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high' // logos y fotos reducidos sin dientes de sierra
  g.save()
  g.clearRect(0, 0, ANCHO, ALTO)
  g.textBaseline = 'alphabetic'

  // ── Foto ──
  g.fillStyle = '#002261'
  g.fillRect(0, 0, PANEL_X, ALTO)
  const { foto } = recursos
  if (foto?.complete && foto.naturalWidth) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeEn(foto, ZONA_FOTO, zoom, dx, dy)
    g.save()
    g.beginPath()
    g.rect(0, 0, PANEL_X, ALTO)
    g.clip()
    g.drawImage(foto, e.x, e.y, e.w, e.h)
    g.restore()
  }
  const sombra = g.createLinearGradient(0, ALTO * 0.5, 0, ALTO)
  sombra.addColorStop(0, 'rgba(0,34,97,0)')
  sombra.addColorStop(0.55, 'rgba(0,34,97,0.55)')
  sombra.addColorStop(1, 'rgba(0,34,97,0.95)')
  g.fillStyle = sombra
  g.fillRect(0, 0, PANEL_X, ALTO)

  // ── Nombre (como en estadísticas: nombre en amarillo, apellido grande) ──
  const anchoNombre = PANEL_X - MARGEN * 2
  const apellido = (datos.apellido || '').toUpperCase()
  const nombre = (datos.nombre || '').toUpperCase()
  const fuenteTitulo = t => `700 ${t}px ${TITULOS}`
  const baseApellido = 1230
  let altoApellido = 0
  if (apellido) {
    const t = ajustar(g, apellido, fuenteTitulo, 250, anchoNombre, 60)
    g.font = fuenteTitulo(t)
    altoApellido = g.measureText(apellido).actualBoundingBoxAscent
    texto(g, apellido, MARGEN, baseApellido, fuenteTitulo(t), '#ffffff')
  }
  if (nombre) {
    const t = ajustar(g, nombre, fuenteTitulo, 78, anchoNombre, 30)
    texto(g, nombre, MARGEN, baseApellido - altoApellido - 14, fuenteTitulo(t), AMARILLO)
  }
  if (datos.credito) texto(g, datos.credito.toUpperCase(), MARGEN, 1274, `600 13px ${TEXTO}`, 'rgba(255,255,255,0.85)', 'left', '1px')

  // ── Panel ──
  const panel = g.createLinearGradient(0, 0, 0, ALTO)
  panel.addColorStop(0, '#011947')
  panel.addColorStop(0.5, '#002261')
  panel.addColorStop(1, '#002978')
  g.fillStyle = panel
  g.fillRect(PANEL_X, 0, ANCHO - PANEL_X, ALTO)

  const logo = recursos.logo
  if (logo?.complete && logo.naturalWidth) {
    const w = 108
    g.drawImage(logo, (PANEL_X + ANCHO) / 2 - w / 2, 62, w, w * logo.naturalHeight / logo.naturalWidth)
  }

  // Operación en grande.
  const operacion = (datos.operacion || '').toUpperCase()
  let yDespues = 230
  if (operacion) {
    const t = ajustar(g, operacion, fuenteTitulo, 212, ANCHO_PANEL, 70)
    g.font = fuenteTitulo(t)
    const cap = g.measureText(operacion).actualBoundingBoxAscent
    texto(g, operacion, X - 4, 228 + cap, fuenteTitulo(t), AMARILLO)
    yDespues = 228 + cap
  }
  if (datos.detalle) {
    g.font = `600 25px ${TEXTO}`
    const lineas = partir(g, datos.detalle, ANCHO_PANEL).slice(0, 3)
    lineas.forEach((l, i) => texto(g, l, X, yDespues + 48 + i * 31, `600 25px ${TEXTO}`, '#ffffff'))
    yDespues += 48 + (lineas.length - 1) * 31
  }

  // Escudos: de dónde viene → a dónde va.
  const origen = [recursos.escudoDe, datos.de]
  const destino = [recursos.escudoA, datos.a]
  const ySep = Math.max(560, yDespues + 56)
  g.fillStyle = 'rgba(255,213,0,0.85)'
  g.fillRect(X, ySep, ANCHO_PANEL, 1.5)
  const y1 = ySep + 140
  const y2 = y1 + 290
  club(g, origen[0], origen[1], 'DE', y1)
  // Flecha hacia abajo entre los dos escudos.
  const cx = X + 58
  const yf = (y1 + y2) / 2
  g.strokeStyle = AMARILLO
  g.lineWidth = 5
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.beginPath()
  g.moveTo(cx, yf - 52); g.lineTo(cx, yf + 44)
  g.moveTo(cx - 22, yf + 22); g.lineTo(cx, yf + 46); g.lineTo(cx + 22, yf + 22)
  g.stroke()
  club(g, destino[0], destino[1], 'A', y2)

  // Web, abajo a la derecha, a la altura del crédito.
  texto(g, 'rzhub.es', 1026, 1274, `700 15px ${TEXTO}`, 'rgba(255,255,255,0.85)', 'right', '1px')
  g.restore()
}
