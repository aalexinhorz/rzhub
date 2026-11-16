// "Final de partido" para redes (1080×1350, 4:5): foto arriba que se funde
// con el azul, la etiqueta del resultado para el Real Zaragoza (VICTORIA /
// EMPATE / DERROTA), los escudos con el marcador en grande, los goleadores
// de cada equipo debajo y, al pie, la competición con su logo.
// Diseño "escudos": sin foto, con los dos escudos en grande y sus siluetas
// de fondo (para el filial, el juvenil o el femenino, que no suelen tener foto).

import { encajeEn, siluetaBlanca } from './graficosComun'
import { AMARILLO, AZUL_OSCURO, TEXTO, TITULOS, ajustar, creditoVertical, fondoAzul, hayImagen, imagen, logoRz, partir, texto } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
export const ZONA_FOTO = { x: 0, y: 0, w: ANCHO, h: 850 }
const M = 48
const ETIQUETA = { g: ['VICTORIA', '#1fbf6a', '#ffffff'], e: ['EMPATE', AMARILLO, AZUL_OSCURO], p: ['DERROTA', '#e5383b', '#ffffff'] }

function etiquetaResultado(g, datos, y) {
  const etiqueta = ETIQUETA[datos.resultado]
  if (etiqueta) {
    const [t, fondo, tinta] = etiqueta
    g.font = `700 24px ${TEXTO}`
    if ('letterSpacing' in g) g.letterSpacing = '4px'
    const w = g.measureText(t).width + 56
    if ('letterSpacing' in g) g.letterSpacing = '0px'
    g.fillStyle = fondo
    g.beginPath()
    g.roundRect(ANCHO / 2 - w / 2, y - 34, w, 50, 25)
    g.fill()
    texto(g, t, ANCHO / 2 + 2, y, `700 24px ${TEXTO}`, tinta, 'center', '4px')
  } else {
    texto(g, 'FINAL', ANCHO / 2, y, `700 24px ${TEXTO}`, AMARILLO, 'center', '4px')
  }
}

// Marcador con los escudos a los lados, nombres debajo y goleadores en dos
// columnas bajo el marcador.
function marcador(g, datos, recursos, { y, xLocal, lado, cifras, separacion, yNombres, yGoleadores }) {
  imagen(g, recursos.escudoLocal, xLocal, y, lado)
  imagen(g, recursos.escudoVisitante, ANCHO - xLocal, y, lado)
  const gl = String(datos.golesLocal ?? '')
  const gv = String(datos.golesVisitante ?? '')
  g.font = `700 ${cifras}px ${TITULOS}`
  const cap = g.measureText('0').actualBoundingBoxAscent
  const base = y + cap / 2
  texto(g, gl, ANCHO / 2 - separacion, base, `700 ${cifras}px ${TITULOS}`, '#ffffff', 'right')
  texto(g, gv, ANCHO / 2 + separacion, base, `700 ${cifras}px ${TITULOS}`, '#ffffff', 'left')
  g.fillStyle = AMARILLO
  g.fillRect(ANCHO / 2 - 22, y - 5, 44, 10)

  const nombre = (t, x) => {
    g.font = `700 21px ${TEXTO}`
    partir(g, (t || '').toUpperCase(), 250).slice(0, 2)
      .forEach((l, i) => texto(g, l, x, yNombres + i * 26, `700 21px ${TEXTO}`, '#ffffff', 'center', '1px'))
  }
  nombre(datos.local, xLocal)
  nombre(datos.visitante, ANCHO - xLocal)

  const goleadores = (t, x, alinear) => {
    String(t || '').split('\n').map(l => l.trim()).filter(Boolean).slice(0, 5)
      .forEach((l, i) => texto(g, l, x, yGoleadores + i * 31, `600 22px ${TEXTO}`, 'rgba(255,255,255,0.88)', alinear))
  }
  goleadores(datos.goleadoresLocal, ANCHO / 2 - 34, 'right')
  goleadores(datos.goleadoresVisitante, ANCHO / 2 + 34, 'left')
}

// Pie: competición con su logo, detalle y web.
function pie(g, datos, recursos) {
  g.fillStyle = 'rgba(255,213,0,0.85)'
  g.fillRect(M, 1222, ANCHO - M * 2, 1.5)
  let xPie = M
  const logoComp = recursos.logoCompeticion
  if (hayImagen(logoComp)) {
    const s = Math.min(70 / logoComp.naturalWidth, 60 / logoComp.naturalHeight)
    const lw = Math.round(logoComp.naturalWidth * s)
    const lh = Math.round(logoComp.naturalHeight * s)
    const k = g.getTransform().a
    g.drawImage(siluetaBlanca(logoComp, Math.round(lw * k), Math.round(lh * k)), xPie, 1286 - lh / 2, lw, lh)
    xPie += lw + 20
  }
  const comp = (datos.competicion || '').toUpperCase()
  const tc = ajustar(g, comp, n => `700 ${n}px ${TEXTO}`, 21, ANCHO - M - xPie - 130, 14)
  texto(g, comp, xPie, 1280, `700 ${tc}px ${TEXTO}`, '#ffffff', 'left', '1.5px')
  if (datos.detalle) texto(g, datos.detalle, xPie, 1310, `500 19px ${TEXTO}`, 'rgba(255,255,255,0.75)')
  texto(g, 'rzhub.es', ANCHO - M, 1296, `700 19px ${TEXTO}`, AMARILLO, 'right', '1px')
}

// Versión sin foto: los escudos mandan.
function dibujarSoloEscudos(g, datos, recursos) {
  fondoAzul(g, ANCHO, ALTO)
  const luz = g.createRadialGradient(ANCHO / 2, 640, 40, ANCHO / 2, 640, 640)
  luz.addColorStop(0, 'rgba(0,69,191,0.55)')
  luz.addColorStop(1, 'rgba(0,69,191,0)')
  g.fillStyle = luz
  g.fillRect(0, 0, ANCHO, ALTO)
  // Siluetas de los escudos, enormes y cortadas por los lados.
  const k = g.getTransform().a
  const silueta = (img, cx) => {
    if (!hayImagen(img)) return
    const h = 820
    const w = h * img.naturalWidth / img.naturalHeight
    g.save()
    g.globalAlpha = 0.06
    g.drawImage(siluetaBlanca(img, Math.round(w * k), Math.round(h * k)), cx - w / 2, 670 - h / 2, w, h)
    g.restore()
  }
  silueta(recursos.escudoLocal, 40)
  silueta(recursos.escudoVisitante, ANCHO - 40)
  logoRz(g, recursos.logo, M, 44, 124, true)

  etiquetaResultado(g, datos, 400)
  marcador(g, datos, recursos, { y: 670, xLocal: 215, lado: 270, cifras: 340, separacion: 64, yNombres: 870, yGoleadores: 960 })
  pie(g, datos, recursos)
}

/**
 * datos: { diseno: 'foto' | 'escudos', local, visitante, golesLocal, golesVisitante, goleadoresLocal, goleadoresVisitante,
 *          resultado: 'g' | 'e' | 'p' | '', competicion, detalle, credito, ajusteFoto }
 * recursos: { foto, logo, escudoLocal, escudoVisitante, logoCompeticion }
 */
export function dibujarGraficoResultado(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  if (datos.diseno === 'escudos') {
    dibujarSoloEscudos(g, datos, recursos)
    g.restore()
    return
  }
  fondoAzul(g, ANCHO, ALTO)

  // Foto arriba, fundida con el azul por abajo.
  const { foto } = recursos
  if (hayImagen(foto)) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeEn(foto, ZONA_FOTO, zoom, dx, dy)
    g.save()
    g.beginPath()
    g.rect(ZONA_FOTO.x, ZONA_FOTO.y, ZONA_FOTO.w, ZONA_FOTO.h)
    g.clip()
    g.drawImage(foto, e.x, e.y, e.w, e.h)
    g.restore()
  }
  const fundido = g.createLinearGradient(0, 480, 0, ZONA_FOTO.h)
  fundido.addColorStop(0, 'rgba(1,25,71,0)')
  // Termina justo en el color del fondo a esa altura (sin corte).
  fundido.addColorStop(0.7, 'rgba(0,35,106,0.85)')
  fundido.addColorStop(1, '#00236a')
  g.fillStyle = fundido
  g.fillRect(0, 480, ANCHO, ZONA_FOTO.h - 480 + 1)
  logoRz(g, recursos.logo, M, 44, 124, true)
  creditoVertical(g, datos.credito, ANCHO - 26, 820)

  etiquetaResultado(g, datos, 770)
  marcador(g, datos, recursos, { y: 950, xLocal: 190, lado: 176, cifras: 300, separacion: 70, yNombres: 1078, yGoleadores: 1126 })
  pie(g, datos, recursos)
  g.restore()
}
