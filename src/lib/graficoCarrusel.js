// Carrusel para redes (1080×1350, 4:5) para explicar algo en varias
// diapositivas:
// - Portada: foto a toda página, etiqueta amarilla, título enorme (las
//   *palabras entre asteriscos* en amarillo), subtítulo y, abajo a la
//   derecha, "Desliza para descubrirlo".
// - Diapositivas: fondo azul, número (02 / 05), sección, título, texto con
//   **negritas** y, si se quiere, un dato destacado en una caja amarilla.

import { encajeEn } from './graficosComun'
import { lineasRicas } from './graficoPorra'
import { dibujarIcono } from './graficosIconos'
import { AMARILLO, AZUL_OSCURO, TEXTO, TITULOS, fondoAzul, hayImagen, logoRz, partir, texto } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
export const ZONA_FOTO = { x: 0, y: 0, w: ANCHO, h: ALTO }
const M = 72

// "¿Por qué *Ademo* juega?" -> palabras en mayúsculas con su color.
function palabrasColor(t) {
  const out = []
  String(t || '').toUpperCase().split('*').forEach((trozo, i) => {
    trozo.split(/\s+/).filter(Boolean).forEach(p => out.push({ p, amarillo: i % 2 === 1 }))
  })
  return out
}

// Título en Humane: el mayor tamaño (entre max y min) con el que cabe en
// `maxLineas` líneas del ancho dado.
function tituloEnLineas(g, t, ancho, max, min, maxLineas) {
  const pals = palabrasColor(t)
  let tam = max
  let lineas = []
  for (; tam >= min; tam -= 4) {
    g.font = `700 ${tam}px ${TITULOS}`
    const esp = g.measureText(' ').width
    lineas = [[]]
    let w = 0
    let cabe = true
    for (const pal of pals) {
      const a = g.measureText(pal.p).width
      if (a > ancho) { cabe = false; break }
      const linea = lineas[lineas.length - 1]
      if (linea.length && w + esp + a > ancho) { lineas.push([{ ...pal, a }]); w = a } else { linea.push({ ...pal, a }); w += (linea.length > 1 ? esp : 0) + a }
    }
    if (cabe && lineas.length <= maxLineas) break
  }
  g.font = `700 ${tam}px ${TITULOS}`
  const mayus = g.measureText('A').actualBoundingBoxAscent
  return { lineas: lineas.filter(l => l.length), tam, mayus, espacio: g.measureText(' ').width }
}

function pintarTitulo(g, t, x, yBase, paso, alinear = 'left', ancho = 0) {
  t.lineas.forEach((l, i) => {
    const w = l.reduce((s, p) => s + p.a, 0) + t.espacio * (l.length - 1)
    let xx = alinear === 'center' ? x + (ancho - w) / 2 : x
    l.forEach(p => {
      texto(g, p.p, xx, yBase + i * paso, `700 ${t.tam}px ${TITULOS}`, p.amarillo ? AMARILLO : '#ffffff', 'left', '1px')
      xx += p.a + t.espacio
    })
  })
}

// Flecha dentro de un círculo amarillo.
function flecha(g, cx, cy, r) {
  g.fillStyle = AMARILLO
  g.beginPath()
  g.arc(cx, cy, r, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = AZUL_OSCURO
  g.lineWidth = r * 0.16
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.beginPath()
  g.moveTo(cx - r * 0.42, cy)
  g.lineTo(cx + r * 0.38, cy)
  g.moveTo(cx + r * 0.05, cy - r * 0.34)
  g.lineTo(cx + r * 0.4, cy)
  g.lineTo(cx + r * 0.05, cy + r * 0.34)
  g.stroke()
}

// "DESLIZA PARA DESCUBRIRLO" + flecha, pegado a la derecha.
function desliza(g, textoDesliza, y, tam = 22) {
  const r = tam * 1.25
  const cx = ANCHO - M - r
  flecha(g, cx, y - tam * 0.36, r)
  if (textoDesliza) texto(g, textoDesliza.toUpperCase(), cx - r - 16, y, `800 ${tam}px ${TEXTO}`, '#ffffff', 'right', '1.5px')
}

function pie(g, datos, ultima) {
  texto(g, 'rzhub.es', M, ALTO - 62, `800 22px ${TEXTO}`, AMARILLO, 'left', '1px')
  if (!ultima) desliza(g, datos.desliza, ALTO - 62, 20)
}

/**
 * Portada.
 * datos: { etiqueta, titulo, subtitulo, desliza, credito, ajusteFoto }
 * recursos: { foto, logo }
 */
export function dibujarPortadaCarrusel(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  fondoAzul(g, ANCHO, ALTO)
  if (hayImagen(recursos.foto)) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeEn(recursos.foto, ZONA_FOTO, zoom, dx, dy)
    g.drawImage(recursos.foto, e.x, e.y, e.w, e.h)
  }
  // Oscurecido abajo (para el texto) y un poco arriba (para el logo).
  const abajo = g.createLinearGradient(0, ALTO * 0.38, 0, ALTO)
  abajo.addColorStop(0, 'rgba(1,25,71,0)')
  abajo.addColorStop(0.55, 'rgba(1,25,71,0.82)')
  abajo.addColorStop(1, 'rgba(1,25,71,0.97)')
  g.fillStyle = abajo
  g.fillRect(0, 0, ANCHO, ALTO)
  const arriba = g.createLinearGradient(0, 0, 0, 230)
  arriba.addColorStop(0, 'rgba(1,25,71,0.6)')
  arriba.addColorStop(1, 'rgba(1,25,71,0)')
  g.fillStyle = arriba
  g.fillRect(0, 0, ANCHO, 230)
  logoRz(g, recursos.logo, M, 56, 150, true)
  if (datos.credito) texto(g, `FOTO: ${datos.credito.toUpperCase()}`, ANCHO - M, 92, `600 15px ${TEXTO}`, 'rgba(255,255,255,0.85)', 'right', '0.5px')

  // De abajo arriba: pie, subtítulo, título y etiqueta.
  pie(g, datos, false)
  let y = ALTO - 150
  if (datos.subtitulo) {
    g.font = `500 32px ${TEXTO}`
    const ls = partir(g, datos.subtitulo, ANCHO - 2 * M).slice(0, 3)
    y -= (ls.length - 1) * 44
    ls.forEach((l, i) => texto(g, l, M, y + i * 44, `500 32px ${TEXTO}`, 'rgba(255,255,255,0.92)'))
    y -= 58
  }
  const t = tituloEnLineas(g, datos.titulo, ANCHO - 2 * M, 250, 90, 3)
  const paso = t.mayus + 36 // hueco para las tildes de la línea de abajo
  const yPrimera = y - (t.lineas.length - 1) * paso
  pintarTitulo(g, t, M, yPrimera, paso)
  if (datos.etiqueta) {
    const e = datos.etiqueta.toUpperCase()
    g.font = `800 24px ${TEXTO}`
    if ('letterSpacing' in g) g.letterSpacing = '2px'
    const w = g.measureText(e).width + 44
    if ('letterSpacing' in g) g.letterSpacing = '0px'
    const yE = yPrimera - t.mayus - 56 - 50
    g.fillStyle = AMARILLO
    g.beginPath()
    g.roundRect(M, yE, w, 50, 8)
    g.fill()
    texto(g, e, M + 22, yE + 34, `800 24px ${TEXTO}`, AZUL_OSCURO, 'left', '2px')
  }
  g.restore()
}

/**
 * Diapositiva de texto.
 * diapo: { seccion, titulo, texto, numero, etiquetaNumero }
 * extra: { indice (1, 2…), total, desliza }
 */
export function dibujarDiapositivaCarrusel(g, diapo, recursos, extra) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  fondoAzul(g, ANCHO, ALTO)
  logoRz(g, recursos.logo, M, 64, 120)

  let y = 300
  if (diapo.seccion) {
    g.fillStyle = AMARILLO
    g.fillRect(M, y - 14, 34, 10)
    texto(g, diapo.seccion.toUpperCase(), M + 50, y, `800 24px ${TEXTO}`, AMARILLO, 'left', '2px')
    y += 40
  }
  if (diapo.titulo) {
    const t = tituloEnLineas(g, diapo.titulo, ANCHO - 2 * M, 170, 80, 3)
    const paso = t.mayus + 18
    pintarTitulo(g, t, M, y + t.mayus, paso)
    y += t.mayus + (t.lineas.length - 1) * paso + 64
  }

  // Dato destacado abajo (si hay); el texto ocupa lo que queda en medio.
  const conDato = !!String(diapo.numero || '').trim()
  const altoCaja = 210
  const yCaja = ALTO - 150 - altoCaja
  const limite = conDato ? yCaja - 50 : ALTO - 160
  if (diapo.texto) {
    // El punto o la coma tras unas **negritas** va pegado a ellas.
    const textoDiapo = diapo.texto.replace(/\*\*([.,;:!?)]+)/g, '$1**')
    let tam = 42
    let r
    for (; tam >= 24; tam -= 2) {
      r = lineasRicas(g, textoDiapo, ANCHO - 2 * M, tam)
      if (y + (r.lineas.length - 1) * tam * 1.42 + tam <= limite) break
    }
    const paso = tam * 1.42
    r.lineas.forEach((l, i) => {
      let x = M
      l.palabras.forEach(p => {
        texto(g, p.p, x, y + tam + i * paso, r.fuente(p.negrita), p.negrita ? '#ffffff' : 'rgba(255,255,255,0.82)')
        x += p.a + r.espacio
      })
    })
  }
  if (conDato) {
    g.fillStyle = AMARILLO
    g.beginPath()
    g.roundRect(M, yCaja, ANCHO - 2 * M, altoCaja, 18)
    g.fill()
    const num = String(diapo.numero).toUpperCase()
    g.font = `700 230px ${TITULOS}`
    const cap = g.measureText(num).actualBoundingBoxAscent
    const tn = Math.min(230, (altoCaja - 40) / cap * 230)
    g.font = `700 ${tn}px ${TITULOS}`
    const wNum = g.measureText(num).width
    const capN = g.measureText(num).actualBoundingBoxAscent
    texto(g, num, M + 44, yCaja + altoCaja / 2 + capN / 2, `700 ${tn}px ${TITULOS}`, AZUL_OSCURO, 'left', '1px')
    if (diapo.etiquetaNumero) {
      const xE = M + 44 + wNum + 36
      g.font = `800 34px ${TEXTO}`
      const ls = partir(g, diapo.etiquetaNumero.toUpperCase(), ANCHO - M - 40 - xE).slice(0, 3)
      const y0 = yCaja + altoCaja / 2 - (ls.length - 1) * 21 + 12
      ls.forEach((l, i) => texto(g, l, xE, y0 + i * 42, `800 34px ${TEXTO}`, AZUL_OSCURO, 'left', '0.5px'))
    }
  }
  pie(g, { desliza: extra.desliza }, extra.indice === extra.total - 1)
  g.restore()
}

/**
 * Diapositiva de cierre: "¡Síguenos!" con una pastilla blanca arriba, el
 * texto y el logo de RZ Hub abajo. Puede llevar una foto de fondo (se tiñe
 * de azul).
 * diapo: { etiqueta, titulo, texto, ajusteFoto }
 * recursos: { logo, fotoCierre }
 */
export function dibujarCierreCarrusel(g, diapo, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  fondoAzul(g, ANCHO, ALTO)
  if (hayImagen(recursos.fotoCierre)) {
    const { zoom = 1, dx = 0, dy = 0 } = diapo.ajusteFoto || {}
    const e = encajeEn(recursos.fotoCierre, ZONA_FOTO, zoom, dx, dy)
    g.drawImage(recursos.fotoCierre, e.x, e.y, e.w, e.h)
    // Tinte azul: la foto se intuye, el texto manda.
    const tinte = g.createLinearGradient(0, 0, 0, ALTO)
    tinte.addColorStop(0, 'rgba(0,69,191,0.88)')
    tinte.addColorStop(0.5, 'rgba(0,45,140,0.82)')
    tinte.addColorStop(1, 'rgba(1,25,71,0.7)')
    g.fillStyle = tinte
    g.fillRect(0, 0, ANCHO, ALTO)
  }
  // Brillo suave en el centro.
  const halo = g.createRadialGradient(ANCHO / 2, ALTO * 0.45, 0, ANCHO / 2, ALTO * 0.45, 640)
  halo.addColorStop(0, 'rgba(255,255,255,0.08)')
  halo.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = halo
  g.fillRect(0, 0, ANCHO, ALTO)

  // Medidas del bloque para centrarlo en vertical.
  const titulo = (diapo.titulo || '').toUpperCase()
  let tt = 430
  g.font = `700 ${tt}px ${TITULOS}`
  while (tt > 120 && g.measureText(titulo).width > ANCHO - 2 * M) { tt -= 6; g.font = `700 ${tt}px ${TITULOS}` }
  const capT = titulo ? g.measureText(titulo).actualBoundingBoxAscent : 0
  g.font = `700 46px ${TEXTO}`
  const lineasTexto = diapo.texto ? partir(g, diapo.texto, 640).slice(0, 3) : []
  const hPastilla = 86
  const wLogo = 420
  const hLogo = hayImagen(recursos.logo) ? wLogo * recursos.logo.naturalHeight / recursos.logo.naturalWidth : 0
  const alto = (diapo.etiqueta ? hPastilla + 70 : 0) + capT + (lineasTexto.length ? 70 + lineasTexto.length * 58 : 0) + (hLogo ? 130 + hLogo : 0)
  let y = (ALTO - alto) / 2

  if (diapo.etiqueta) {
    const e = diapo.etiqueta.toUpperCase()
    g.font = `800 34px ${TEXTO}`
    const wTexto = g.measureText(e).width
    const w = wTexto + 56 + 46 + 16
    const x = ANCHO / 2 - w / 2
    g.fillStyle = '#ffffff'
    g.beginPath()
    g.roundRect(x, y, w, hPastilla, hPastilla / 2)
    g.fill()
    dibujarIcono(g, 'seguir', x + 30, y + hPastilla / 2 - 23, 46, AZUL_OSCURO, 2.2)
    texto(g, e, x + 30 + 46 + 16, y + hPastilla / 2 + 12, `800 34px ${TEXTO}`, AZUL_OSCURO, 'left', '0.5px')
    y += hPastilla + 70
  }
  if (titulo) {
    texto(g, titulo, ANCHO / 2, y + capT, `700 ${tt}px ${TITULOS}`, '#ffffff', 'center', '2px')
    y += capT
  }
  if (lineasTexto.length) {
    y += 70
    lineasTexto.forEach(l => { texto(g, l, ANCHO / 2, y + 40, `700 46px ${TEXTO}`, '#ffffff', 'center', '-0.5px'); y += 58 })
  }
  if (hLogo) logoRz(g, recursos.logo, ANCHO / 2 - wLogo / 2, y + 130, wLogo, true)
  g.restore()
}
