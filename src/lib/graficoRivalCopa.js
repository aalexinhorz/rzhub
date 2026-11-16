// "Rival en Copa" para redes (1080×1350, 4:5): a la izquierda un panel azul
// con el logo, el título, la ronda, el escudo del rival en grande, su nombre
// en una pastilla amarilla y las fechas; a la derecha, la foto a todo alto.

import { encajeEn } from './graficosComun'
import { AMARILLO, AZUL_OSCURO, TEXTO, TITULOS, ajustar, hayImagen, imagen, logoRz, texto } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
const PANEL = 588
export const ZONA_FOTO = { x: PANEL, y: 0, w: ANCHO - PANEL, h: ALTO }

/**
 * datos: { titulo, ronda, rival, fechas, credito, ajusteFoto }
 * recursos: { foto, logo, escudo }
 */
export function dibujarGraficoRivalCopa(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'

  // Foto a la derecha.
  const z = ZONA_FOTO
  g.fillStyle = '#0a1730'
  g.fillRect(z.x, z.y, z.w, z.h)
  if (hayImagen(recursos.foto)) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeEn(recursos.foto, z, zoom, dx, dy)
    g.save()
    g.beginPath(); g.rect(z.x, z.y, z.w, z.h); g.clip()
    g.drawImage(recursos.foto, e.x, e.y, e.w, e.h)
    g.restore()
  }
  if (datos.credito) {
    g.save()
    g.translate(ANCHO - 22, ALTO - 30)
    g.rotate(-Math.PI / 2)
    texto(g, datos.credito.toUpperCase(), 0, 0, `600 14px ${TEXTO}`, 'rgba(255,255,255,0.85)', 'left', '1px')
    g.restore()
  }

  // Panel azul.
  const f = g.createLinearGradient(0, 0, PANEL * 0.4, ALTO)
  f.addColorStop(0, '#0a3fa0')
  f.addColorStop(0.55, '#062a6e')
  f.addColorStop(1, AZUL_OSCURO)
  g.fillStyle = f
  g.fillRect(0, 0, PANEL, ALTO)

  const cx = PANEL / 2
  logoRz(g, recursos.logo, cx - 100, 70, 200)

  const titulo = (datos.titulo || '').toUpperCase()
  const tt = ajustar(g, titulo, n => `700 ${n}px ${TITULOS}`, 150, PANEL - 70, 70)
  texto(g, titulo, cx, 405, `700 ${tt}px ${TITULOS}`, AMARILLO, 'center')
  if (datos.ronda) {
    const r = datos.ronda.toUpperCase()
    const tr = ajustar(g, r, n => `700 ${n}px ${TEXTO}`, 32, PANEL - 90, 18)
    texto(g, r, cx, 448, `700 ${tr}px ${TEXTO}`, '#ffffff', 'center', '-0.5px')
  }

  imagen(g, recursos.escudo, cx, 685, 380)

  if (datos.rival) {
    const nombre = datos.rival.toUpperCase()
    const tn = ajustar(g, nombre, n => `700 ${n}px ${TEXTO}`, 32, 330, 18)
    g.fillStyle = AMARILLO
    g.beginPath()
    g.roundRect(cx - 190, 920, 380, 50, 25)
    g.fill()
    texto(g, nombre, cx, 956, `700 ${tn}px ${TEXTO}`, AZUL_OSCURO, 'center', '-0.5px')
  }
  if (datos.fechas) texto(g, datos.fechas.toUpperCase(), cx, 1010, `700 26px ${TEXTO}`, '#ffffff', 'center', '-0.3px')
  g.restore()
}
