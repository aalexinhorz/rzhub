// "Convocatoria" para redes (1080×1350, 4:5): título con el rival, las
// tarjetas del Lineup de los convocados ordenadas por posición y, si se
// sube, la foto del entrenador a la derecha fundida con el fondo.

import { encajeEn } from './graficosComun'
import { tarjeta, proporcionTarjeta } from './graficoListas'
import { AMARILLO, TEXTO, TITULOS, ajustar, creditoVertical, fondoAzul, hayImagen, imagen, logoRz, texto } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
const M = 48
const Y_REJILLA = 300
const Y_FIN = 1240
// Foto del entrenador: la mitad derecha, por debajo de la cabecera.
export const ZONA_FOTO = { x: 560, y: 250, w: ANCHO - 560, h: ALTO - 250 }

// POR, DEF, MED, DEL (con las variantes que hay en la base de datos).
export function ordenPosicion(pos) {
  const p = String(pos || '').toUpperCase().split('/')[0]
  if (p === 'POR') return 0
  if (['DEF', 'DFC', 'LD', 'LI', 'CAR'].includes(p)) return 1
  if (['MED', 'MC', 'MCD', 'MCO', 'MD', 'MI'].includes(p)) return 2
  return 3
}

/**
 * datos: { antetitulo, titulo, pie, credito, ajusteFoto }
 * recursos: { logo, foto, escudoRival, cartas: [{ foto, escudo, nombre, esZaragoza }] }
 */
export function dibujarGraficoConvocatoria(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  fondoAzul(g, ANCHO, ALTO)

  // Foto del entrenador, fundida por la izquierda y por abajo.
  const hayFoto = hayImagen(recursos.foto)
  if (hayFoto) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeEn(recursos.foto, ZONA_FOTO, zoom, dx, dy)
    g.save()
    g.beginPath()
    g.rect(ZONA_FOTO.x, ZONA_FOTO.y, ZONA_FOTO.w, ZONA_FOTO.h)
    g.clip()
    g.drawImage(recursos.foto, e.x, e.y, e.w, e.h)
    const izq = g.createLinearGradient(ZONA_FOTO.x, 0, ZONA_FOTO.x + 220, 0)
    izq.addColorStop(0, '#00215e')
    izq.addColorStop(1, 'rgba(0,33,94,0)')
    g.fillStyle = izq
    g.fillRect(ZONA_FOTO.x, ZONA_FOTO.y, 221, ZONA_FOTO.h)
    const abajo = g.createLinearGradient(0, ALTO - 260, 0, ALTO)
    abajo.addColorStop(0, 'rgba(0,41,120,0)')
    abajo.addColorStop(1, '#002978')
    g.fillStyle = abajo
    g.fillRect(ZONA_FOTO.x, ALTO - 260, ZONA_FOTO.w, 260)
    g.restore()
    creditoVertical(g, datos.credito, ANCHO - 26, ALTO - 80)
  }

  // Cabecera: antetítulo, título y escudo del rival; el logo arriba a la derecha.
  logoRz(g, recursos.logo, ANCHO - M - 124, 52, 124)
  texto(g, (datos.antetitulo || '').toUpperCase(), M, 110, `700 20px ${TEXTO}`, AMARILLO, 'left', '2.5px')
  const titulo = (datos.titulo || 'Convocatoria').toUpperCase()
  const hayEscudo = hayImagen(recursos.escudoRival)
  const anchoTitulo = ANCHO - M * 2 - 160 - (hayEscudo ? 120 : 0)
  const t = ajustar(g, titulo, x => `700 ${x}px ${TITULOS}`, 150, anchoTitulo, 60)
  texto(g, titulo, M - 4, 236, `700 ${t}px ${TITULOS}`, '#ffffff')
  if (hayEscudo) {
    g.font = `700 ${t}px ${TITULOS}`
    const fin = M - 4 + g.measureText(titulo).width
    imagen(g, recursos.escudoRival, fin + 70, 236 - t * 0.33, Math.min(110, t * 0.75))
  }

  // Rejilla de tarjetas: 5 columnas (con foto, en la mitad izquierda) o 6.
  const cartas = recursos.cartas || []
  if (cartas.length) {
    const ancho = (hayFoto ? 640 : ANCHO - M) - M
    const cols = hayFoto ? 5 : 6
    const hueco = 14
    const filas = Math.ceil(cartas.length / cols)
    let w = (ancho - hueco * (cols - 1)) / cols
    const alto = Y_FIN - Y_REJILLA
    if (filas * w * proporcionTarjeta + (filas - 1) * hueco > alto) w = (alto - (filas - 1) * hueco) / filas / proporcionTarjeta
    const h = w * proporcionTarjeta
    // Sin foto, la rejilla va centrada; con foto, pegada a la izquierda.
    const x0 = hayFoto ? M : M + (ancho - (cols * w + (cols - 1) * hueco)) / 2
    cartas.forEach((c, i) => {
      const fila = Math.floor(i / cols)
      const x = x0 + (i % cols) * (w + hueco)
      const y = Y_REJILLA + fila * (h + hueco)
      tarjeta(g, x, y, w, c, { nombreGrande: 1.25 })
    })
  }

  // Pie.
  // Pie: texto libre (p. ej. el entrenador) a la izquierda y la web a la derecha.
  if (datos.pie) texto(g, datos.pie, M, ALTO - 44, `600 20px ${TEXTO}`, 'rgba(255,255,255,0.85)')
  texto(g, 'rzhub.es', ANCHO - M, ALTO - 44, `700 19px ${TEXTO}`, AMARILLO, 'right', '1px')
  g.restore()
}
