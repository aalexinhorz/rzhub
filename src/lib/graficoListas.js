// Plantillas de redes con foto lateral (1080×1350, 4:5): ránking de
// jugadores, versus entre dos jugadores y ránking de equipos. Comparten la
// base, como la plantilla de estadísticas: panel liso con los datos y la
// foto entera al otro lado con corte recto (a la derecha o a la izquierda),
// y pie con etiqueta de sección y explicación.

import { encajeEn } from './graficosComun'

export const ANCHO = 1080
export const ALTO = 1350
const M = 48
const AMARILLO = '#ffd500'
const AZUL = '#0045bf'
const AZUL_OSCURO = '#011947'
const TITULOS = "Humane, 'Arial Narrow', sans-serif"
const TEXTO = 'Archivo, sans-serif'
const LIMITE_IZQ = 548 // ancho útil del contenido de la izquierda
const FIN_LISTA = 1032 // la lista acaba aquí; debajo van el logo y el pie
// Panel de datos de 600 px; la foto ocupa el resto.
const PANEL = 600
export const zonaFotoRecta = fotoIzquierda => ({ x: fotoIzquierda ? 0 : PANEL, y: 0, w: ANCHO - PANEL, h: ALTO })

function texto(g, t, x, y, fuente, color, alinear = 'left', espaciado = '0px') {
  g.font = fuente
  g.fillStyle = color
  g.textAlign = alinear
  if ('letterSpacing' in g) g.letterSpacing = espaciado
  g.fillText(t, x, y)
  if ('letterSpacing' in g) g.letterSpacing = '0px'
}

export function imagen(g, img, cx, cy, caja) {
  if (!img?.complete || !img.naturalWidth) return false
  const s = Math.min(caja / img.naturalWidth, caja / img.naturalHeight)
  g.drawImage(img, cx - img.naturalWidth * s / 2, cy - img.naturalHeight * s / 2, img.naturalWidth * s, img.naturalHeight * s)
  return true
}

// Tamaño (de mayor a menor) con el que el texto cabe en el ancho dado.
function ajustar(g, t, fuente, max, ancho, min = 20) {
  let tam = max
  g.font = fuente(tam)
  while (tam > min && g.measureText(t).width > ancho) { tam -= 2; g.font = fuente(tam) }
  return tam
}

function partir(g, t, ancho) {
  const lineas = []
  for (const parrafo of String(t || '').split('\n')) {
    let actual = ''
    for (const p of parrafo.split(/\s+/).filter(Boolean)) {
      const prueba = actual ? `${actual} ${p}` : p
      if (g.measureText(prueba).width > ancho && actual) { lineas.push(actual); actual = p } else actual = prueba
    }
    if (actual) lineas.push(actual)
  }
  return lineas
}

// ── Base común ──
// Deja el contexto desplazado para que el contenido se dibuje siempre en
// coordenadas del panel (con la foto a la izquierda, el panel empieza en
// ANCHO - PANEL); quien llama hace g.save() antes y g.restore() al acabar.
function base(g, datos, recursos, etiquetaSeccion, opciones = {}) {
  const desp = datos.fotoIzquierda ? ANCHO - PANEL : 0
  g.save()
  g.textBaseline = 'alphabetic'
  const fondo = g.createLinearGradient(0, 0, 0, ALTO)
  fondo.addColorStop(0, AZUL_OSCURO)
  fondo.addColorStop(0.5, '#002261')
  fondo.addColorStop(1, '#002978')
  g.fillStyle = fondo
  g.fillRect(0, 0, ANCHO, ALTO)

  // Foto con corte recto.
  const zona = zonaFotoRecta(datos.fotoIzquierda)
  g.save()
  g.beginPath()
  g.rect(zona.x, zona.y, zona.w, zona.h)
  g.fillStyle = '#0b2a6b'
  g.fill()
  g.clip()
  const { foto } = recursos
  if (foto?.complete && foto.naturalWidth) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeEn(foto, zona, zoom, dx, dy)
    g.drawImage(foto, e.x, e.y, e.w, e.h)
  }
  const sombra = g.createLinearGradient(0, ALTO * 0.7, 0, ALTO)
  sombra.addColorStop(0, 'rgba(1,25,71,0)')
  sombra.addColorStop(1, 'rgba(1,25,71,0.6)')
  g.fillStyle = sombra
  g.fillRect(0, 0, ANCHO, ALTO)
  g.restore()
  if (datos.credito) {
    g.save()
    g.translate(zona.x + zona.w - 26, ALTO - 40)
    g.rotate(-Math.PI / 2)
    texto(g, datos.credito.toUpperCase(), 0, 0, `600 14px ${TEXTO}`, 'rgba(255,255,255,0.8)', 'left', '1px')
    g.restore()
  }

  g.translate(desp, 0)
  // Cabecera (como en el diseño de referencia): título grande y, debajo,
  // el subtítulo centrado en la columna.
  const centro = (M + LIMITE_IZQ) / 2
  const titulo = (datos.titulo || '').toUpperCase()
  if (titulo) {
    ajustar(g, titulo, t => `700 ${t}px ${TITULOS}`, 150, LIMITE_IZQ - M + 10, 60)
    g.fillStyle = '#ffffff'
    g.textAlign = 'left'
    g.fillText(titulo, M - 4, 236)
  }
  if (datos.subtitulo) {
    const sub = datos.subtitulo.toUpperCase()
    ajustar(g, sub, t => `600 ${t}px ${TEXTO}`, 25, LIMITE_IZQ - M, 14)
    g.fillStyle = 'rgba(255,255,255,0.9)'
    g.textAlign = 'center'
    g.fillText(sub, centro, titulo ? 282 : 120)
  }

  // Logo centrado debajo de la lista (en el versus va entre las tarjetas).
  const logo = recursos.logo
  if (opciones.logoAbajo !== false && logo?.complete && logo.naturalWidth) {
    const w = 168
    const h = w * logo.naturalHeight / logo.naturalWidth
    g.drawImage(logo, centro - w / 2, 1094 - h / 2, w, h)
  }

  // Pie: etiqueta de sección (sin línea) y la explicación centrada.
  const yPie = 1166
  g.fillStyle = AMARILLO
  g.fillRect(M, yPie - 9, 26, 6)
  texto(g, etiquetaSeccion, M + 40, yPie, `800 19px ${TEXTO}`, '#ffffff', 'left', '1.5px')
  if (datos.explicacion) {
    g.font = `500 25px ${TEXTO}`
    g.fillStyle = 'rgba(255,255,255,0.9)'
    g.textAlign = 'center'
    partir(g, datos.explicacion, LIMITE_IZQ - M).slice(0, 2).forEach((l, i) => g.fillText(l, centro, yPie + 66 + i * 34))
  }
  texto(g, 'rzhub.es', M, ALTO - 34, `800 19px ${TEXTO}`, AMARILLO, 'left', '1px')
  g.restore()
  g.translate(desp, 0)
}

// Tarjeta de jugador idéntica a la del Lineup (src/lib/lineupCanvas.js),
// escalada: 78×98 con foto arriba, escudo en la esquina y barra de nombre;
// azul si es del Real Zaragoza y amarillo si es de otro equipo. Sin foto,
// el escudo grande.
const TARJETA_W = 78
const TARJETA_FOTO = 80
const TARJETA_NOMBRE = 18
export const proporcionTarjeta = (TARJETA_FOTO + TARJETA_NOMBRE) / TARJETA_W

function cubrir(g, img, dx, dy, dw, dh, fx = 0.5, fy = 0.15) {
  const s = Math.max(dw / img.naturalWidth, dh / img.naturalHeight)
  const sw = dw / s
  const sh = dh / s
  const sx = Math.max(0, Math.min(img.naturalWidth - sw, (img.naturalWidth - sw) * fx))
  const sy = Math.max(0, Math.min(img.naturalHeight - sh, (img.naturalHeight - sh) * fy))
  g.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

function recortar(g, t, ancho) {
  if (g.measureText(t).width <= ancho) return t
  let corte = t.length
  while (corte > 1 && g.measureText(t.slice(0, corte) + '…').width > ancho) corte--
  return t.slice(0, corte) + '…'
}

function tarjeta(g, x, y, w, { foto, escudo, nombre, esZaragoza }, { nombreGrande = 1 } = {}) {
  const k = w / TARJETA_W
  const h = (TARJETA_FOTO + TARJETA_NOMBRE) * k
  // nombreGrande > 1: solo la letra del nombre más grande; la barra mide lo mismo que en el Lineup.
  const hNombre = TARJETA_NOMBRE * k
  const hFoto = h - hNombre
  const color = esZaragoza ? '#0B4390' : '#f5c400'
  g.save()
  g.beginPath()
  g.roundRect(x, y, w, h, 6 * k)
  g.clip()
  const fondo = g.createLinearGradient(0, y, 0, y + h)
  if (esZaragoza) { fondo.addColorStop(0, '#c5d8f0'); fondo.addColorStop(0.4, '#ddeaf8'); fondo.addColorStop(0.7, '#eef4fc'); fondo.addColorStop(1, '#f5f8fd') } else { fondo.addColorStop(0, '#f5e6b0'); fondo.addColorStop(0.4, '#faf0cc'); fondo.addColorStop(0.7, '#fdf7e8'); fondo.addColorStop(1, '#fefcf3') }
  g.fillStyle = fondo
  g.fillRect(x, y, w, h)
  const hayFoto = foto?.complete && foto.naturalWidth
  if (hayFoto) cubrir(g, foto, x, y, w, hFoto)
  else if (escudo) imagen(g, escudo, x + w / 2, y + hFoto / 2, hFoto * 0.62)
  // Escudo de la esquina sin deformar: cabe en un hueco de 14×14 (escalado).
  if (hayFoto) imagen(g, escudo, x + 10 * k, y + 10 * k, 14 * k)
  g.fillStyle = color
  g.fillRect(x, y + hFoto, w, hNombre)
  g.font = `700 ${9 * k * nombreGrande}px ${TEXTO}`
  g.fillStyle = esZaragoza ? '#ffffff' : '#000000'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(recortar(g, nombre || '', w - 8 * k), x + w / 2, y + hFoto + hNombre / 2 + 0.5 * k)
  g.textBaseline = 'alphabetic'
  g.restore()
  g.lineWidth = 2 * k
  g.strokeStyle = color
  g.beginPath()
  g.roundRect(x, y, w, h, 6 * k)
  g.stroke()
}

/**
 * Ránking de jugadores.
 * datos: { titulo, subtitulo, explicacion, credito, ajusteFoto, fotoIzquierda, filas: [{ nombre, valor }] }
 * recursos: { foto, logo, filas: [{ foto, escudo }] }
 */
export function dibujarRankingJugadores(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high' // logos y fotos reducidos sin dientes de sierra
  g.save()
  base(g, datos, recursos, 'RÁNKING')
  const filas = (datos.filas || []).filter(f => f.nombre || f.valor).slice(0, 5)
  const y0 = 326
  const alto = Math.min(176, (FIN_LISTA - y0) / filas.length)
  const hTarjeta = alto - 14
  const wTarjeta = hTarjeta / proporcionTarjeta
  filas.forEach((f, i) => {
    const y = y0 + i * alto
    tarjeta(g, M, y, wTarjeta, { ...recursos.filas?.[i], nombre: f.nombre }, { nombreGrande: 1.5 })
    const valor = String(f.valor || '')
    const tam = ajustar(g, valor, t => `700 ${t}px ${TITULOS}`, Math.min(200, hTarjeta * 1.2), LIMITE_IZQ - (M + wTarjeta + 40), 40)
    g.font = `700 ${tam}px ${TITULOS}`
    const cap = g.measureText(valor || '0').actualBoundingBoxAscent
    texto(g, valor, M + wTarjeta + 44, y + hTarjeta / 2 + cap / 2, `700 ${tam}px ${TITULOS}`, i === 0 ? AMARILLO : '#ffffff')
  })
  g.restore()
}

/**
 * Versus entre dos jugadores.
 * datos: { titulo, subtitulo, explicacion, credito, ajusteFoto, fotoIzquierda, a: { nombre, extra }, b: { nombre, extra }, filas: [{ etiqueta, a, b }] }
 * recursos: { foto, logo, a: { foto, escudo }, b: { foto, escudo } }
 */
export function dibujarVersus(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high' // logos y fotos reducidos sin dientes de sierra
  g.save()
  base(g, { ...datos, titulo: datos.titulo || '' }, recursos, 'VERSUS', { logoAbajo: false })
  // Tarjetas + filas forman un bloque centrado en vertical entre la
  // cabecera y el pie (con pocas filas no queda un hueco abajo).
  const filas = (datos.filas || []).filter(f => f.etiqueta || f.a || f.b).slice(0, 5)
  const arriba = datos.titulo ? 330 : 168
  const hT = 160
  const separacion = 78
  const alto = filas.length ? Math.min(124, (1118 - arriba - hT - separacion) / filas.length) : 0
  const yT = arriba + Math.max(0, (1118 - arriba - (hT + separacion + filas.length * alto)) / 2)
  const wT = hT / proporcionTarjeta
  tarjeta(g, M + 20, yT, wT, { ...recursos.a, nombre: datos.a?.nombre })
  tarjeta(g, LIMITE_IZQ - wT - 20, yT, wT, { ...recursos.b, nombre: datos.b?.nombre })
  // Como en el diseño de referencia: el logo entre las dos tarjetas.
  const logo = recursos.logo
  if (logo?.complete && logo.naturalWidth) {
    const w = 132
    const h = w * logo.naturalHeight / logo.naturalWidth
    g.drawImage(logo, (M + LIMITE_IZQ) / 2 - w / 2, yT + hT / 2 - h / 2, w, h)
  }
  if (datos.a?.extra) texto(g, datos.a.extra, M + 20 + wT / 2, yT + hT + 36, `600 21px ${TEXTO}`, 'rgba(255,255,255,0.85)', 'center')
  if (datos.b?.extra) texto(g, datos.b.extra, LIMITE_IZQ - wT / 2 - 20, yT + hT + 36, `600 21px ${TEXTO}`, 'rgba(255,255,255,0.85)', 'center')

  const y0 = yT + hT + separacion
  const cA = M + 70
  const cB = LIMITE_IZQ - 70
  filas.forEach((f, i) => {
    const y = y0 + i * alto
    const tam = Math.min(130, alto * 0.95)
    g.font = `700 ${tam}px ${TITULOS}`
    const cap = g.measureText('0').actualBoundingBoxAscent
    const yNum = y + alto / 2 + cap / 2
    texto(g, String(f.a ?? ''), cA, yNum, `700 ${tam}px ${TITULOS}`, '#ffffff', 'center')
    texto(g, String(f.b ?? ''), cB, yNum, `700 ${tam}px ${TITULOS}`, AMARILLO, 'center')
    const etiqueta = f.etiqueta || ''
    const t = ajustar(g, etiqueta, x => `400 ${x}px ${TEXTO}`, 32, cB - cA - 120, 14)
    texto(g, etiqueta, (cA + cB) / 2, y + alto / 2 + t * 0.36, `400 ${t}px ${TEXTO}`, '#ffffff', 'center')
    if (i < filas.length - 1) {
      g.fillStyle = 'rgba(255,255,255,0.12)'
      g.fillRect(M, y + alto - 1, LIMITE_IZQ - M, 2)
    }
  })
  g.restore()
}

/**
 * Ránking de equipos.
 * datos: { titulo, subtitulo, explicacion, credito, ajusteFoto, fotoIzquierda, filas: [{ nombre, valor }] }
 * recursos: { foto, logo, filas: [{ escudo }] }
 */
export function dibujarRankingEquipos(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high' // logos y fotos reducidos sin dientes de sierra
  g.save()
  base(g, datos, recursos, 'RÁNKING')
  const filas = (datos.filas || []).filter(f => f.nombre || f.valor).slice(0, 6)
  const y0 = 330
  const alto = Math.min(130, (FIN_LISTA - y0) / filas.length)
  const hBarra = alto - 16
  const anchoBarra = LIMITE_IZQ - M - 92
  filas.forEach((f, i) => {
    const y = y0 + i * alto
    const primero = i === 0
    // Barras sólidas (solo un leve brillo arriba, sin desvanecerse).
    const barra = g.createLinearGradient(0, y, 0, y + hBarra)
    if (primero) { barra.addColorStop(0, '#ffe14d'); barra.addColorStop(1, AMARILLO) } else { barra.addColorStop(0, '#1d5fe0'); barra.addColorStop(1, AZUL) }
    g.fillStyle = barra
    g.beginPath()
    g.roundRect(M, y, anchoBarra, hBarra, 10)
    g.fill()
    const tinta = primero ? AZUL_OSCURO : '#ffffff'
    const caja = hBarra - 16
    imagen(g, recursos.filas?.[i]?.escudo, M + 14 + caja / 2, y + hBarra / 2, caja)
    const xNombre = M + 14 + caja + 18
    const nombre = (f.nombre || '').toUpperCase()
    const t = ajustar(g, nombre, x => `800 ${x}px ${TEXTO}`, 32, anchoBarra - (xNombre - M) - 14, 14)
    texto(g, nombre, xNombre, y + hBarra / 2 + t * 0.36, `800 ${t}px ${TEXTO}`, tinta)
    const valor = String(f.valor ?? '')
    const tam = Math.min(150, hBarra * 1.25)
    g.font = `700 ${tam}px ${TITULOS}`
    const cap = g.measureText(valor || '0').actualBoundingBoxAscent
    texto(g, valor, LIMITE_IZQ, y + hBarra / 2 + cap / 2, `700 ${tam}px ${TITULOS}`, primero ? AMARILLO : '#ffffff', 'right')
  })
  g.restore()
}
