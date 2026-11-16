// "Las notas del partido" para redes (1080×1350, 4:5): el título en dos
// líneas a la izquierda, el crédito de la foto, a la derecha el marcador con
// los escudos en cajas del color de cada equipo y el logo de la competición
// encima; debajo, la foto con las esquinas de arriba redondeadas, y al pie
// el logo de RZ Hub.

import { encajeEn } from './graficosComun'
import { AMARILLO, AZUL, AZUL_OSCURO, TEXTO, TITULOS, ajustar, hayImagen, imagen, logoRz, texto } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
export const ZONA_FOTO = { x: 0, y: 413, w: ANCHO, h: 790 }
const M = 88

function caja(g, escudo, x, y, lado, color) {
  g.fillStyle = color
  g.beginPath()
  g.roundRect(x, y, lado, lado, [6, 6, 24, 6])
  g.fill()
  imagen(g, escudo, x + lado / 2, y + lado / 2, lado * 0.68)
}

/**
 * datos: { titulo, golesLocal, golesVisitante, colorLocal, colorVisitante, credito, ajusteFoto }
 * recursos: { foto, logo, escudoLocal, escudoVisitante, logoCompeticion }
 */
export function dibujarGraficoNotasPartido(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  const f = g.createLinearGradient(0, 0, ANCHO, ALTO)
  f.addColorStop(0, '#0a3fa0')
  f.addColorStop(0.45, '#04205a')
  f.addColorStop(1, '#020a1c')
  g.fillStyle = f
  g.fillRect(0, 0, ANCHO, ALTO)

  // Título en dos líneas lo más iguales posible ("LAS NOTAS / DEL PARTIDO").
  const titulo = (datos.titulo || '').toUpperCase()
  g.font = `700 150px ${TITULOS}`
  const palabras = titulo.split(/\s+/).filter(Boolean)
  let lineas = [titulo]
  if (palabras.length > 1) {
    let mejor = Infinity
    for (let i = 1; i < palabras.length; i++) {
      const par = [palabras.slice(0, i).join(' '), palabras.slice(i).join(' ')]
      const ancho = Math.max(...par.map(l => g.measureText(l).width))
      if (ancho < mejor) { mejor = ancho; lineas = par }
    }
  }
  const tt = Math.min(...lineas.map(l => ajustar(g, l, n => `700 ${n}px ${TITULOS}`, 150, 420, 80)))
  // Líneas muy juntas, como en el diseño: entre una y otra solo un hueco
  // pequeño (la altura de las mayúsculas + 14 px).
  g.font = `700 ${tt}px ${TITULOS}`
  const mayus = g.measureText('LAS').actualBoundingBoxAscent
  const base1 = 62 + mayus
  const paso = mayus + 14
  lineas.forEach((l, i) => texto(g, l, M, base1 + i * paso, `700 ${tt}px ${TITULOS}`, AMARILLO, 'left', '1px'))
  if (datos.credito) {
    const yCredito = base1 + (lineas.length - 1) * paso + 34
    g.font = `500 18px ${TEXTO}`
    const pre = 'FOTO: '
    const w = g.measureText(pre).width
    texto(g, pre, M, yCredito, `500 18px ${TEXTO}`, '#ffffff')
    texto(g, datos.credito.toUpperCase(), M + w, yCredito, `700 18px ${TEXTO}`, '#ffffff')
  }

  // Marcador con los escudos.
  const lado = 152
  const xL = 548, xV = 862, yC = 147
  const cx = (xL + lado + xV) / 2
  imagen(g, recursos.logoCompeticion, cx, 88, 56)
  caja(g, recursos.escudoLocal, xL, yC, lado, datos.colorLocal || AZUL)
  caja(g, recursos.escudoVisitante, xV, yC, lado, datos.colorVisitante || AZUL)
  const marcador = `${datos.golesLocal ?? ''}-${datos.golesVisitante ?? ''}`
  const tm = ajustar(g, marcador, n => `700 ${n}px ${TITULOS}`, 175, xV - xL - lado - 24, 90)
  g.font = `700 ${tm}px ${TITULOS}`
  const alto = g.measureText('0').actualBoundingBoxAscent
  texto(g, marcador, cx, yC + lado / 2 + alto / 2, `700 ${tm}px ${TITULOS}`, '#ffffff', 'center', '2px')

  // Foto con las esquinas de arriba redondeadas.
  const z = ZONA_FOTO
  g.save()
  g.beginPath()
  g.roundRect(z.x, z.y, z.w, z.h, [48, 48, 0, 0])
  g.fillStyle = '#0a1730'
  g.fill()
  g.clip()
  if (hayImagen(recursos.foto)) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeEn(recursos.foto, z, zoom, dx, dy)
    g.drawImage(recursos.foto, e.x, e.y, e.w, e.h)
  }
  g.restore()

  // Pie con el logo.
  const pie = g.createLinearGradient(0, z.y + z.h, ANCHO, ALTO)
  pie.addColorStop(0, '#062a6e')
  pie.addColorStop(1, AZUL_OSCURO)
  g.fillStyle = pie
  g.fillRect(0, z.y + z.h, ANCHO, ALTO - z.y - z.h)
  logoRz(g, recursos.logo, ANCHO / 2 - 75, z.y + z.h + 42, 150)
  g.restore()
}
