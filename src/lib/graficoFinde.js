// "Fin de semana" para redes (1080×1350, 4:5), sin foto: los partidos de los
// próximos días de todos los equipos del Real Zaragoza (primer equipo,
// filial, juvenil y femenino), uno por tarjeta. Las tarjetas se reparten el
// alto según cuántos partidos haya (1 a 4). El primer equipo va en amarillo.

import { AMARILLO, AZUL, AZUL_OSCURO, TEXTO, TITULOS, ajustar, fondoAzul, imagen, logoRz, partir, texto } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
const M = 60
const ARRIBA = 400
const ABAJO = 1250
const HUECO = 22

const diaCaja = iso => new Date(`${iso}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/[.,]/g, '').toUpperCase()

function tarjeta(g, p, imgs, y, h) {
  const primer = p.clave === 'primer'
  const x = M, w = ANCHO - 2 * M
  const k = Math.min(1.35, h / 196) // escala: con menos partidos, todo más grande
  const kA = Math.min(k, 1.12) // lo que crece a lo ancho, menos (si no, los nombres no caben)
  const tinta = primer ? AZUL_OSCURO : '#ffffff'

  // Fondo.
  g.save()
  g.beginPath()
  g.roundRect(x, y, w, h, 26)
  if (primer) {
    const f = g.createLinearGradient(x, y, x + w, y + h)
    f.addColorStop(0, '#ffd500')
    f.addColorStop(1, '#f2b200')
    g.fillStyle = f
    g.fill()
  } else {
    g.fillStyle = 'rgba(255,255,255,0.07)'
    g.fill()
    g.strokeStyle = 'rgba(255,255,255,0.12)'
    g.lineWidth = 1.5
    g.stroke()
  }
  g.restore()

  // Equipo y competición.
  const pad = 30 * k
  const yEtiqueta = y + pad + 30 * k
  const etiqueta = p.equipo.toUpperCase()
  const te = 42 * k
  texto(g, etiqueta, x + pad, yEtiqueta, `700 ${te}px ${TITULOS}`, primer ? AZUL : AMARILLO, 'left', '1px')
  g.font = `700 ${te}px ${TITULOS}`
  if ('letterSpacing' in g) g.letterSpacing = '1px'
  const anchoEtiqueta = g.measureText(etiqueta).width
  if ('letterSpacing' in g) g.letterSpacing = '0px'
  const comp = [p.competicion, p.jornada].filter(Boolean).join(' · ').toUpperCase()
  texto(g, comp, x + pad + anchoEtiqueta + 16, yEtiqueta - 4 * k, `600 ${Math.round(16 * k)}px ${TEXTO}`, primer ? 'rgba(1,25,71,0.7)' : 'rgba(255,255,255,0.65)', 'left', '1.5px')

  // Fila: escudo + nombre local · caja de día y hora · nombre + escudo visitante.
  const zona = { top: yEtiqueta + 16 * k, bottom: y + h - pad * 0.7 }
  const cy = (zona.top + zona.bottom) / 2
  const lado = Math.min(104 * kA, zona.bottom - zona.top)
  const xEscL = x + pad + lado / 2
  const xEscV = x + w - pad - lado / 2
  imagen(g, imgs?.local, xEscL, cy, lado)
  imagen(g, imgs?.visitante, xEscV, cy, lado)

  const caja = { w: 176 * kA, h: 104 * kA }
  caja.x = ANCHO / 2 - caja.w / 2
  caja.y = cy - caja.h / 2
  const anchoNombre = caja.x - (xEscL + lado / 2) - 34 * kA
  const fuenteNombre = n => `700 ${n}px ${TEXTO}`
  const nombre = (t, propio, xIni, alinear) => {
    // En dos líneas como mucho y encogiendo la letra hasta que quepa cada una.
    let n = Math.round(24 * kA)
    let lineas
    for (;;) {
      g.font = fuenteNombre(n)
      lineas = partir(g, t.toUpperCase(), anchoNombre).slice(0, 2)
      if (n <= 15 || lineas.every(l => g.measureText(l).width <= anchoNombre)) break
      n--
    }
    const alto = lineas.length * n * 1.15
    lineas.forEach((l, i) => texto(g, l, xIni, cy - alto / 2 + n * 0.88 + i * n * 1.15, fuenteNombre(n),
      propio ? (primer ? AZUL : AMARILLO) : tinta, alinear, '0.5px'))
  }
  const propioLocal = p.local
  nombre(p.nombreLocal, propioLocal, xEscL + lado / 2 + 18 * kA, 'left')
  nombre(p.nombreVisitante, !propioLocal, xEscV - lado / 2 - 18 * kA, 'right')

  // Caja de día y hora.
  const cab = 34 * kA
  g.save()
  g.shadowColor = 'rgba(0,0,0,0.25)'
  g.shadowBlur = 16
  g.beginPath()
  g.roundRect(caja.x, caja.y, caja.w, caja.h, 14 * k)
  g.fillStyle = '#ffffff'
  g.fill()
  g.restore()
  g.save()
  g.beginPath()
  g.roundRect(caja.x, caja.y, caja.w, caja.h, 14 * k)
  g.clip()
  g.fillStyle = AZUL_OSCURO
  g.fillRect(caja.x, caja.y, caja.w, cab)
  g.restore()
  texto(g, diaCaja(p.fecha), ANCHO / 2, caja.y + cab * 0.68, `700 ${Math.round(16 * kA)}px ${TEXTO}`, '#ffffff', 'center', '1.5px')
  if (p.hora) {
    texto(g, p.hora, ANCHO / 2, caja.y + caja.h - 12 * kA, `700 ${Math.round(60 * kA)}px ${TITULOS}`, AZUL, 'center', '1px')
  } else {
    texto(g, 'SIN HORA', ANCHO / 2, caja.y + cab + (caja.h - cab) / 2 + 7 * kA, `700 ${Math.round(18 * kA)}px ${TEXTO}`, '#7e93bf', 'center', '1.5px')
  }
}

/**
 * datos: { titulo, subtitulo }
 * partidos: [{ clave, equipo, competicion, jornada, nombreLocal, nombreVisitante, local, fecha, hora }]
 * recursos: { logo, escudos: { [clave]: { local, visitante } } }
 */
export function dibujarGraficoFinde(g, datos, partidos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  fondoAzul(g, ANCHO, ALTO)
  const luz = g.createRadialGradient(ANCHO / 2, 380, 40, ANCHO / 2, 380, 720)
  luz.addColorStop(0, 'rgba(0,69,191,0.45)')
  luz.addColorStop(1, 'rgba(0,69,191,0)')
  g.fillStyle = luz
  g.fillRect(0, 0, ANCHO, ALTO)

  logoRz(g, recursos.logo, M, 52, 150, true)
  texto(g, 'TODOS LOS EQUIPOS', ANCHO - M, 96, `700 16px ${TEXTO}`, 'rgba(255,255,255,0.7)', 'right', '3px')

  const titulo = (datos.titulo || '').toUpperCase()
  const tt = ajustar(g, titulo, n => `700 ${n}px ${TITULOS}`, 200, ANCHO - 2 * M, 90)
  texto(g, titulo, M, 300, `700 ${tt}px ${TITULOS}`, AMARILLO, 'left', '2px')
  if (datos.subtitulo) texto(g, datos.subtitulo, M, 350, `600 26px ${TEXTO}`, 'rgba(255,255,255,0.85)', 'left')

  const n = partidos.length
  if (n) {
    const total = ABAJO - ARRIBA
    const h = Math.min(300, (total - HUECO * (n - 1)) / n)
    const ocupado = n * h + HUECO * (n - 1)
    let y = ARRIBA + (total - ocupado) / 2
    for (const p of partidos) {
      tarjeta(g, p, recursos.escudos?.[p.clave], y, h)
      y += h + HUECO
    }
  } else {
    texto(g, 'No hay partidos en los próximos días', ANCHO / 2, 800, `600 28px ${TEXTO}`, 'rgba(255,255,255,0.7)', 'center')
  }

  texto(g, 'rzhub.es', ANCHO / 2, 1310, `700 20px ${TEXTO}`, AMARILLO, 'center', '1px')
  g.restore()
}
