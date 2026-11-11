// "Partido" para redes (1080×1350, 4:5): logo de la competición, el lema
// en grande entre los dos escudos, los datos del partido y una foto ancha
// con las esquinas de arriba redondeadas (p. ej. un jugador de cada equipo).

import { encajeEn } from './graficosComun'
import { casilla } from './graficoRival'
import { AMARILLO, AZUL_OSCURO, TEXTO, TITULOS, ajustar, hayImagen, imagen, logoRz, texto } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
export const ZONA_FOTO = { x: 0, y: 415, w: ANCHO, h: 790 }

/**
 * datos: { titulo, linea1, linea2, linea3, zaragozaLocal, credito, ajusteFoto }
 * recursos: { foto, logo, escudoLocal, escudoVisitante, logoCompeticion }
 */
export function dibujarGraficoPartido(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  const fondo = g.createLinearGradient(0, 0, ANCHO * 0.4, ALTO)
  fondo.addColorStop(0, '#003a9e')
  fondo.addColorStop(0.5, '#002261')
  fondo.addColorStop(1, AZUL_OSCURO)
  g.fillStyle = fondo
  g.fillRect(0, 0, ANCHO, ALTO)

  // Logo de la competición y lema entre los escudos.
  imagen(g, recursos.logoCompeticion, ANCHO / 2, 66, 76)
  const lado = 128
  casilla(g, recursos.escudoLocal, 31, 127, lado, datos.zaragozaLocal)
  casilla(g, recursos.escudoVisitante, ANCHO - 31 - lado, 127, lado, !datos.zaragozaLocal)
  const titulo = (datos.titulo || '').toUpperCase()
  if (titulo) {
    const t = ajustar(g, titulo, x => `700 ${x}px ${TITULOS}`, 178, ANCHO - 2 * (31 + lado + 16), 70)
    g.font = `700 ${t}px ${TITULOS}`
    // Centrado en vertical con las casillas.
    const alto = g.measureText(titulo).actualBoundingBoxAscent
    texto(g, titulo, ANCHO / 2, 127 + lado / 2 + alto / 2, `700 ${t}px ${TITULOS}`, AMARILLO, 'center')
  }

  if (datos.linea1) texto(g, datos.linea1, ANCHO / 2, 306, `700 25px ${TEXTO}`, '#ffffff', 'center', '-0.3px')
  if (datos.linea2) texto(g, datos.linea2, ANCHO / 2, 338, `400 25px ${TEXTO}`, '#ffffff', 'center', '-0.3px')
  if (datos.linea3) texto(g, datos.linea3, ANCHO / 2, 370, `700 24px ${TEXTO}`, '#ffffff', 'center', '-0.3px')

  // Foto con las esquinas de arriba redondeadas.
  const z = ZONA_FOTO
  g.save()
  g.beginPath()
  g.roundRect(z.x, z.y, z.w, z.h, [40, 40, 0, 0])
  g.fillStyle = '#0b2a6b'
  g.fill()
  g.clip()
  if (hayImagen(recursos.foto)) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeEn(recursos.foto, z, zoom, dx, dy)
    g.drawImage(recursos.foto, e.x, e.y, e.w, e.h)
  }
  g.restore()
  if (datos.credito) {
    g.save()
    g.translate(z.x + z.w - 22, z.y + z.h - 20)
    g.rotate(-Math.PI / 2)
    texto(g, datos.credito.toUpperCase(), 0, 0, `600 14px ${TEXTO}`, 'rgba(255,255,255,0.85)', 'left', '1px')
    g.restore()
  }

  if (hayImagen(recursos.logo)) logoRz(g, recursos.logo, ANCHO / 2 - 75, 1246, 150)
  g.restore()
}
