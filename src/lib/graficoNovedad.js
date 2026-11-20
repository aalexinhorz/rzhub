// Plantilla "Novedad web": una mejora de la web por imagen (1080×1350).
// Arriba el logo y la fecha, la etiqueta amarilla, el título grande y la
// explicación; debajo, una captura de la web en su marco (se arrastra para
// encuadrarla) y abajo el enlace para probarlo.

import { encajeEn } from './graficosComun'
import { ajustar, fondoAzul, hayImagen, logoRz, partir, texto, AMARILLO, AZUL_OSCURO, TITULOS, TEXTO } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
const M = 70
export const ZONA_FOTO = { x: M, y: 660, w: ANCHO - 2 * M, h: 500 }

function pastilla(g, t, x, y) {
  const s = t.toUpperCase()
  g.font = `800 24px ${TEXTO}`
  if ('letterSpacing' in g) g.letterSpacing = '1.5px'
  const w = g.measureText(s).width + 44
  if ('letterSpacing' in g) g.letterSpacing = '0px'
  g.fillStyle = AMARILLO
  g.beginPath()
  g.roundRect(x, y, w, 50, 25)
  g.fill()
  texto(g, s, x + 22, y + 34, `800 24px ${TEXTO}`, AZUL_OSCURO, 'left', '1.5px')
}

// Etiqueta, título y explicación desde y0; devuelve dónde acaba.
function bloqueTexto(g, datos, y0, hayFoto) {
  let y = y0
  if (datos.etiqueta) { pastilla(g, datos.etiqueta, M, y); y += 50 }

  // Título en Humane, hasta 2 líneas.
  const titulo = (datos.titulo || '').toUpperCase()
  if (titulo) {
    const maxT = hayFoto ? 170 : 220
    let tam = maxT
    let lineas
    for (; tam >= 80; tam -= 4) {
      g.font = `700 ${tam}px ${TITULOS}`
      lineas = partir(g, titulo, ANCHO - 2 * M)
      if (lineas.length <= 2) break
    }
    lineas = lineas.slice(0, 2)
    const paso = tam * 0.86
    y += tam * 0.86 + 14
    lineas.forEach((l, i) => texto(g, l, M - 3, y + i * paso, `700 ${tam}px ${TITULOS}`, '#ffffff', 'left', '1px'))
    y += (lineas.length - 1) * paso
  }

  // Explicación.
  if (datos.texto) {
    const limite = hayFoto ? ZONA_FOTO.y - 34 : y0 + 900
    let tam = hayFoto ? 34 : 42
    let lineas
    for (; tam >= 24; tam -= 2) {
      g.font = `500 ${tam}px ${TEXTO}`
      lineas = partir(g, datos.texto, ANCHO - 2 * M)
      if (y + 30 + lineas.length * tam * 1.32 <= limite) break
    }
    y += tam * 1.32 + 22
    lineas.forEach((l, i) => texto(g, l, M, y + i * tam * 1.32, `500 ${tam}px ${TEXTO}`, 'rgba(255,255,255,0.88)'))
    y += (lineas.length - 1) * tam * 1.32
  }
  return y - y0 + 10
}

/**
 * datos: { etiqueta, fecha, titulo, texto, enlace, ajusteFoto }
 * recursos: { logo, foto }
 */
export function dibujarNovedad(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  fondoAzul(g, ANCHO, ALTO)
  const halo = g.createRadialGradient(ANCHO / 2, ZONA_FOTO.y + ZONA_FOTO.h / 2, 0, ANCHO / 2, ZONA_FOTO.y + ZONA_FOTO.h / 2, 700)
  halo.addColorStop(0, 'rgba(0,69,191,0.55)')
  halo.addColorStop(1, 'rgba(0,69,191,0)')
  g.fillStyle = halo
  g.fillRect(0, 0, ANCHO, ALTO)

  // Cabecera: logo y fecha.
  logoRz(g, recursos.logo, M, 58, 190)
  if (datos.fecha) texto(g, datos.fecha.toUpperCase(), ANCHO - M, 112, `700 24px ${TEXTO}`, 'rgba(255,255,255,0.7)', 'right', '1px')

  const hayFoto = hayImagen(recursos.foto)
  // Sin captura, el texto sale más grande y centrado en el hueco libre
  // (se mide primero sin pintar y luego se pinta en su sitio).
  if (hayFoto) bloqueTexto(g, datos, 210, true)
  else {
    g.save()
    g.globalAlpha = 0
    const alto = bloqueTexto(g, datos, 0, false)
    g.restore()
    bloqueTexto(g, datos, 180 + Math.max(0, (1180 - 180 - alto) / 2), false)
  }

  // Captura en su marco.
  if (hayFoto) {
    const z = ZONA_FOTO
    g.save()
    g.shadowColor = 'rgba(0,0,0,0.5)'
    g.shadowBlur = 50
    g.shadowOffsetY = 18
    g.fillStyle = '#0a1730'
    g.beginPath()
    g.roundRect(z.x, z.y, z.w, z.h, 22)
    g.fill()
    g.restore()
    g.save()
    g.beginPath()
    g.roundRect(z.x, z.y, z.w, z.h, 22)
    g.clip()
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeEn(recursos.foto, z, zoom, dx, dy)
    g.drawImage(recursos.foto, e.x, e.y, e.w, e.h)
    g.restore()
    g.strokeStyle = 'rgba(255,255,255,0.18)'
    g.lineWidth = 2
    g.beginPath()
    g.roundRect(z.x, z.y, z.w, z.h, 22)
    g.stroke()
  }

  // Enlace: botón amarillo centrado abajo.
  const enlace = (datos.enlace || 'rzhub.es').trim()
  const yBoton = 1206
  const etiquetaBoton = 'Pruébalo en '
  g.font = `600 30px ${TEXTO}`
  const w1 = g.measureText(etiquetaBoton).width
  const tamEnlace = ajustar(g, enlace, n => `800 ${n}px ${TEXTO}`, 30, 640, 18)
  const w2 = g.measureText(enlace).width
  const ancho = w1 + w2 + 72
  const x0 = (ANCHO - ancho) / 2
  g.fillStyle = AMARILLO
  g.beginPath()
  g.roundRect(x0, yBoton, ancho, 78, 39)
  g.fill()
  texto(g, etiquetaBoton, x0 + 36, yBoton + 50, `600 30px ${TEXTO}`, AZUL_OSCURO)
  texto(g, enlace, x0 + 36 + w1, yBoton + 50, `800 ${tamEnlace}px ${TEXTO}`, AZUL_OSCURO)
  g.restore()
}
