// "Foto de jugador" para redes (1080×1350, 4:5): la foto a toda página y,
// abajo, la tarjeta del Lineup del jugador con su nombre en grande, una
// etiqueta opcional encima (NUEVO JUGADOR, MVP…) y una pastilla amarilla
// debajo (la temporada u otro texto corto).

import { encajeEn } from './graficosComun'
import { tarjeta, proporcionTarjeta } from './graficoListas'
import { AMARILLO, AZUL_OSCURO, TEXTO, TITULOS, ajustar, creditoVertical, hayImagen, logoRz, texto } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
export const ZONA_FOTO = { x: 0, y: 0, w: ANCHO, h: ALTO }
const M = 48
const W_CARTA = 196

/**
 * datos: { nombre, etiqueta, pastilla, credito, ajusteFoto }
 * recursos: { foto, logo, carta: { foto, escudo, nombre, esZaragoza } }
 */
export function dibujarGraficoJugador(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  g.fillStyle = '#002261'
  g.fillRect(0, 0, ANCHO, ALTO)

  if (hayImagen(recursos.foto)) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeEn(recursos.foto, ZONA_FOTO, zoom, dx, dy)
    g.save()
    g.beginPath()
    g.rect(0, 0, ANCHO, ALTO)
    g.clip()
    g.drawImage(recursos.foto, e.x, e.y, e.w, e.h)
    g.restore()
  }
  // Oscurecido arriba (para el logo) y degradado azul abajo (para el nombre).
  const arriba = g.createLinearGradient(0, 0, 0, 220)
  arriba.addColorStop(0, 'rgba(1,25,71,0.55)')
  arriba.addColorStop(1, 'rgba(1,25,71,0)')
  g.fillStyle = arriba
  g.fillRect(0, 0, ANCHO, 220)
  const abajo = g.createLinearGradient(0, ALTO * 0.5, 0, ALTO)
  abajo.addColorStop(0, 'rgba(0,34,97,0)')
  abajo.addColorStop(0.55, 'rgba(0,34,97,0.7)')
  abajo.addColorStop(1, 'rgba(0,34,97,0.97)')
  g.fillStyle = abajo
  g.fillRect(0, 0, ANCHO, ALTO)

  logoRz(g, recursos.logo, M, 46, 132, true)
  creditoVertical(g, datos.credito, ANCHO - 26, ALTO - 120)

  // Bloque de abajo: tarjeta + etiqueta, nombre y pastilla.
  const hCarta = W_CARTA * proporcionTarjeta
  const yCarta = ALTO - 70 - hCarta
  const hayCarta = recursos.carta && (hayImagen(recursos.carta.foto) || recursos.carta.nombre)
  const xTexto = hayCarta ? M + W_CARTA + 36 : M
  if (hayCarta) tarjeta(g, M, yCarta, W_CARTA, recursos.carta, { nombreGrande: 1.3 })

  const anchoTexto = ANCHO - M - xTexto
  const pastilla = (datos.pastilla || '').toUpperCase()
  const yPastilla = ALTO - 70 - 56
  if (pastilla) {
    g.font = `700 30px ${TEXTO}`
    if ('letterSpacing' in g) g.letterSpacing = '2px'
    const w = Math.min(anchoTexto, g.measureText(pastilla).width + 52)
    if ('letterSpacing' in g) g.letterSpacing = '0px'
    g.fillStyle = AMARILLO
    g.beginPath()
    g.roundRect(xTexto, yPastilla, w, 56, 28)
    g.fill()
    texto(g, pastilla, xTexto + w / 2 + 1, yPastilla + 39, `700 30px ${TEXTO}`, AZUL_OSCURO, 'center', '2px')
  }
  const nombre = (datos.nombre || '').toUpperCase()
  const baseNombre = (pastilla ? yPastilla : ALTO - 70) - 20
  let altoNombre = 0
  if (nombre) {
    const t = ajustar(g, nombre, x => `700 ${x}px ${TITULOS}`, 240, anchoTexto, 70)
    g.font = `700 ${t}px ${TITULOS}`
    altoNombre = g.measureText(nombre).actualBoundingBoxAscent
    texto(g, nombre, xTexto - 4, baseNombre, `700 ${t}px ${TITULOS}`, '#ffffff')
  }
  if (datos.etiqueta) {
    texto(g, datos.etiqueta.toUpperCase(), xTexto, baseNombre - altoNombre - 22, `700 22px ${TEXTO}`, AMARILLO, 'left', '3px')
  }
  texto(g, 'rzhub.es', ANCHO - M, ALTO - 30, `700 17px ${TEXTO}`, 'rgba(255,255,255,0.8)', 'right', '1px')
  g.restore()
}
