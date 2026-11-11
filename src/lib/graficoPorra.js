// "La Porra" para redes (1080×1350, 4:5): panel con LA PORRA en grande, los
// escudos del partido con el logo de la competición, la llamada a jugar
// (lo que va entre **asteriscos** sale en negrita) y la dirección; al otro
// lado, una foto a toda altura.

import { encajeEn } from './graficosComun'
import { casilla } from './graficoRival'
import { AMARILLO, AZUL_OSCURO, TEXTO, TITULOS, ajustar, hayImagen, imagen, logoRz, texto } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
const PANEL = 570
export const zonaFoto = fotoIzquierda => ({ x: fotoIzquierda ? 0 : PANEL, y: 0, w: ANCHO - PANEL, h: ALTO })

// "texto **negrita** texto" → palabras con su peso, partidas en líneas.
function lineasRicas(g, t, ancho, tam) {
  const palabras = []
  String(t || '').split('**').forEach((trozo, i) => {
    trozo.split(/\s+/).filter(Boolean).forEach(p => palabras.push({ p, negrita: i % 2 === 1 }))
  })
  const fuente = n => `${n ? 700 : 500} ${tam}px ${TEXTO}`
  const ancho_ = w => { g.font = fuente(w.negrita); return g.measureText(w.p).width }
  g.font = fuente(false)
  const espacio = g.measureText(' ').width
  const lineas = []
  let actual = []
  let w = 0
  palabras.forEach(pal => {
    const a = ancho_(pal)
    if (actual.length && w + espacio + a > ancho) { lineas.push({ palabras: actual, w }); actual = []; w = 0 }
    w += (actual.length ? espacio : 0) + a
    actual.push({ ...pal, a })
  })
  if (actual.length) lineas.push({ palabras: actual, w })
  return { lineas, espacio, fuente }
}

/**
 * datos: { titulo, texto, enlace, fotoIzquierda, credito, ajusteFoto, zaragozaLocal }
 * recursos: { foto, logo, escudoLocal, escudoVisitante, logoCompeticion }
 */
export function dibujarGraficoPorra(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  const fondo = g.createLinearGradient(0, 0, 0, ALTO)
  fondo.addColorStop(0, '#003a9e')
  fondo.addColorStop(0.55, '#002261')
  fondo.addColorStop(1, AZUL_OSCURO)
  g.fillStyle = fondo
  g.fillRect(0, 0, ANCHO, ALTO)

  const zona = zonaFoto(datos.fotoIzquierda)
  g.save()
  g.beginPath()
  g.rect(zona.x, zona.y, zona.w, zona.h)
  g.fillStyle = '#0b2a6b'
  g.fill()
  g.clip()
  if (hayImagen(recursos.foto)) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeEn(recursos.foto, zona, zoom, dx, dy)
    g.drawImage(recursos.foto, e.x, e.y, e.w, e.h)
  }
  g.restore()
  if (datos.credito) {
    g.save()
    g.translate(zona.x + zona.w - 22, ALTO - 30)
    g.rotate(-Math.PI / 2)
    texto(g, datos.credito.toUpperCase(), 0, 0, `600 14px ${TEXTO}`, 'rgba(255,255,255,0.85)', 'left', '1px')
    g.restore()
  }

  g.translate(datos.fotoIzquierda ? ANCHO - PANEL : 0, 0)
  const centro = PANEL / 2 - 5

  // Título.
  const titulo = (datos.titulo || 'La Porra').toUpperCase()
  const t = ajustar(g, titulo, x => `700 ${x}px ${TITULOS}`, 262, PANEL - 110, 80)
  texto(g, titulo, centro, 452, `700 ${t}px ${TITULOS}`, AMARILLO, 'center')

  // Escudos con el logo de la competición en medio.
  const lado = 170
  casilla(g, recursos.escudoLocal, centro - 43 - lado, 520, lado, datos.zaragozaLocal)
  casilla(g, recursos.escudoVisitante, centro + 43, 520, lado, !datos.zaragozaLocal)
  imagen(g, recursos.logoCompeticion, centro, 605, 62)

  // Llamada a jugar, centrada, con la parte en negrita.
  const tam = 30
  const { lineas, espacio, fuente } = lineasRicas(g, datos.texto, PANEL - 100, tam)
  const interlineado = 39
  let y = 752
  lineas.slice(0, 5).forEach(l => {
    let x = centro - l.w / 2
    l.palabras.forEach(p => {
      texto(g, p.p, x, y, fuente(p.negrita), '#ffffff', 'left', '-0.4px')
      x += p.a + espacio
    })
    y += interlineado
  })

  // Pastilla con la dirección.
  const enlace = datos.enlace || 'rzhub.es/porra'
  const yPastilla = y + 3
  g.font = `700 30px ${TEXTO}`
  const w = g.measureText(enlace).width + 68
  g.fillStyle = AMARILLO
  g.beginPath()
  g.roundRect(centro - w / 2, yPastilla, w, 58, 12)
  g.fill()
  texto(g, enlace, centro, yPastilla + 40, `700 30px ${TEXTO}`, AZUL_OSCURO, 'center', '-0.3px')

  if (hayImagen(recursos.logo)) {
    const lw = 150
    logoRz(g, recursos.logo, centro - lw / 2, yPastilla + 108, lw)
  }
  g.restore()
}
