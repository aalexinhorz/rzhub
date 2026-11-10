// Gráfico de la clasificación para redes (1080×1350, 4:5), con el mismo
// estilo que el de estadísticas (graficoStats.js). Lo usa /redaccion-graficos.

import { zonaDe } from './clasificacion'

export const ANCHO = 1080
export const ALTO = 1350
const M = 48
const AMARILLO = '#ffd500'
const AZUL_OSCURO = '#011947'
const TITULOS = "Humane, 'Arial Narrow', sans-serif"
const TEXTO = 'Archivo, sans-serif'
const COLOR_ZONA = { ascenso: '#2bd576', playoff: '#3d8bff', descenso: '#ff4d5e' }

// Nombres cortos para que quepan en la fila (liga_calendario usa los
// nombres oficiales largos).
const CORTOS = {
  'Juventud de Torremolinos CF': 'Juventud Torremolinos',
  'Hércules de Alicante CF': 'Hércules',
  'Gimnàstic de Tarragona': 'Nàstic',
  'CF Rayo Majadahonda': 'Rayo Majadahonda',
  'Villarreal CF "B"': 'Villarreal B',
  'Real Jaén CF': 'Real Jaén',
  'Real Murcia CF': 'Real Murcia',
}
export const nombreCorto = n => CORTOS[n] || n.replace(/^(CF|CD|UD|AD|UE|CE|SD|FC)\s+|\s+(CF|FC)$/g, '').replace(/["“”]/g, '').trim()

function dibujarImagen(g, img, cx, cy, caja) {
  if (!img?.complete || !img.naturalWidth) return false
  const s = Math.min(caja / img.naturalWidth, caja / img.naturalHeight)
  g.drawImage(img, cx - img.naturalWidth * s / 2, cy - img.naturalHeight * s / 2, img.naturalWidth * s, img.naturalHeight * s)
  return true
}

function texto(g, t, x, y, { fuente, color, alinear = 'left', espaciado = '0px' }) {
  g.font = fuente
  g.fillStyle = color
  g.textAlign = alinear
  if ('letterSpacing' in g) g.letterSpacing = espaciado
  g.fillText(t, x, y)
  if ('letterSpacing' in g) g.letterSpacing = '0px'
}

function flecha(g, x, y, sube) {
  g.fillStyle = sube ? COLOR_ZONA.ascenso : COLOR_ZONA.descenso
  g.beginPath()
  if (sube) { g.moveTo(x, y - 7); g.lineTo(x + 7, y + 4); g.lineTo(x - 7, y + 4) } else { g.moveTo(x, y + 7); g.lineTo(x + 7, y - 4); g.lineTo(x - 7, y - 4) }
  g.closePath()
  g.fill()
}

/**
 * datos: { tabla: [{ equipo, pj, g, e, p, dg, pts, cambio }], jornada, resaltar, subtitulo, mostrarCambios }
 * recursos: { logo, escudos: { [equipo]: Image } }
 */
export function dibujarGraficoClasificacion(g, datos, recursos) {
  g.save()
  g.textBaseline = 'alphabetic'

  // Fondo azul con un brillo arriba.
  const fondo = g.createLinearGradient(0, 0, 0, ALTO)
  fondo.addColorStop(0, AZUL_OSCURO)
  fondo.addColorStop(0.5, '#002261')
  fondo.addColorStop(1, '#002978')
  g.fillStyle = fondo
  g.fillRect(0, 0, ANCHO, ALTO)
  const brillo = g.createRadialGradient(ANCHO * 0.8, -100, 50, ANCHO * 0.8, -100, 700)
  brillo.addColorStop(0, 'rgba(61,139,255,0.35)')
  brillo.addColorStop(1, 'rgba(61,139,255,0)')
  g.fillStyle = brillo
  g.fillRect(0, 0, ANCHO, ALTO)

  // Cabecera: logo, jornada, título y competición.
  const logo = recursos.logo
  if (logo?.complete && logo.naturalWidth) g.drawImage(logo, M, 48, 128, 128 * logo.naturalHeight / logo.naturalWidth)
  if (datos.jornada) {
    g.font = `700 22px ${TEXTO}`
    const etiqueta = `JORNADA ${datos.jornada}`
    if ('letterSpacing' in g) g.letterSpacing = '2px'
    const w = g.measureText(etiqueta).width + 36
    if ('letterSpacing' in g) g.letterSpacing = '0px'
    g.fillStyle = AMARILLO
    g.beginPath()
    g.roundRect(ANCHO - M - w, 46, w, 48, 24)
    g.fill()
    texto(g, etiqueta, ANCHO - M - w / 2, 78, { fuente: `700 22px ${TEXTO}`, color: AZUL_OSCURO, alinear: 'center', espaciado: '2px' })
  }
  texto(g, 'CLASIFICACIÓN', M - 4, 248, { fuente: `700 176px ${TITULOS}`, color: '#ffffff' })
  texto(g, (datos.subtitulo || 'Primera Federación · Grupo 2').toUpperCase(), M, 290, { fuente: `600 22px ${TEXTO}`, color: AMARILLO, espaciado: '2px' })

  // Cabecera de la tabla.
  const COL = { pj: 676, g: 740, e: 800, p: 860, dg: 940, pts: ANCHO - M - 8 }
  const yCab = 344
  const cab = { fuente: `700 17px ${TEXTO}`, color: 'rgba(255,213,0,0.85)', alinear: 'right', espaciado: '1px' }
  texto(g, '#', M + 44, yCab, { ...cab, alinear: 'center' })
  texto(g, 'EQUIPO', 200, yCab, { ...cab, alinear: 'left' })
  for (const [k, v] of Object.entries({ pj: 'PJ', g: 'G', e: 'E', p: 'P', dg: 'DG', pts: 'PTS' })) texto(g, v, COL[k], yCab, cab)

  // Filas.
  const tabla = datos.tabla || []
  const y0 = 360
  const alto = Math.min(46, (1250 - y0) / Math.max(1, tabla.length))
  tabla.forEach((f, i) => {
    const pos = i + 1
    const y = y0 + i * alto
    const medio = y + alto / 2
    const resaltado = datos.resaltar && f.equipo === datos.resaltar
    const zona = zonaDe(pos)

    if (resaltado) {
      g.fillStyle = AMARILLO
      g.beginPath()
      g.roundRect(M, y + 2, ANCHO - M * 2, alto - 4, 10)
      g.fill()
    } else if (i % 2 === 0) {
      g.fillStyle = 'rgba(255,255,255,0.045)'
      g.fillRect(M, y + 2, ANCHO - M * 2, alto - 4)
    }
    if (zona) {
      g.fillStyle = COLOR_ZONA[zona]
      g.fillRect(M, y + 4, 6, alto - 8)
    }
    // Separadores de zona.
    if (pos === 1 || pos === 5 || pos === 15) {
      g.fillStyle = 'rgba(255,255,255,0.22)'
      g.fillRect(M, y + alto - 1, ANCHO - M * 2, 2)
    }

    const tinta = resaltado ? AZUL_OSCURO : '#ffffff'
    const base = medio + 8
    texto(g, String(pos), M + 44, base, { fuente: `700 24px ${TEXTO}`, color: tinta, alinear: 'center' })
    if (datos.mostrarCambios && f.cambio) flecha(g, M + 76, medio, f.cambio > 0)

    if (!dibujarImagen(g, recursos.escudos?.[f.equipo], 158, medio, alto - 12)) {
      g.fillStyle = 'rgba(255,255,255,0.2)'
      g.beginPath(); g.arc(158, medio, (alto - 14) / 2, 0, Math.PI * 2); g.fill()
    }
    texto(g, nombreCorto(f.equipo).toUpperCase(), 200, base, { fuente: `${resaltado ? 800 : 600} 23px ${TEXTO}`, color: tinta })

    const num = { fuente: `600 23px ${TEXTO}`, color: resaltado ? AZUL_OSCURO : 'rgba(255,255,255,0.85)', alinear: 'right' }
    texto(g, String(f.pj), COL.pj, base, num)
    texto(g, String(f.g), COL.g, base, num)
    texto(g, String(f.e), COL.e, base, num)
    texto(g, String(f.p), COL.p, base, num)
    texto(g, `${f.dg > 0 ? '+' : ''}${f.dg}`, COL.dg, base, num)
    texto(g, String(f.pts), COL.pts, base + 2, { fuente: `700 30px ${TEXTO}`, color: resaltado ? AZUL_OSCURO : AMARILLO, alinear: 'right' })
  })

  // Leyenda y web.
  const yLey = 1300
  let x = M
  for (const [zona, nombre] of [['ascenso', 'ASCENSO'], ['playoff', 'PLAYOFF'], ['descenso', 'DESCENSO']]) {
    g.fillStyle = COLOR_ZONA[zona]
    g.fillRect(x, yLey - 14, 16, 16)
    g.font = `600 16px ${TEXTO}`
    if ('letterSpacing' in g) g.letterSpacing = '1px'
    g.fillStyle = 'rgba(255,255,255,0.85)'
    g.textAlign = 'left'
    g.fillText(nombre, x + 26, yLey)
    x += 26 + g.measureText(nombre).width + 34
    if ('letterSpacing' in g) g.letterSpacing = '0px'
  }
  texto(g, 'rzhub.es', ANCHO - M, yLey, { fuente: `700 17px ${TEXTO}`, color: 'rgba(255,255,255,0.85)', alinear: 'right', espaciado: '1px' })
  g.restore()
}
