// "On Tour" para redes (1080×1350, 4:5), para los desplazamientos: la foto
// del estadio arriba fundida con el azul, la ciudad en grande con el escudo
// del rival, el viaje en cifras (km, puesto entre los desplazamientos y
// horas en coche) y un mapa con todos los desplazamientos de la temporada
// y la ruta desde Zaragoza.

import { encajeEn } from './graficosComun'
import { DESPLAZAMIENTOS, ZARAGOZA } from './desplazamientos'
import { CIUDAD_RIVAL } from './partidoSeo'
import { ESPANA, PORTUGAL } from './mapaPeninsula'
import { AMARILLO, AZUL_OSCURO, TEXTO, TITULOS, ajustar, hayImagen, imagen, logoRz, texto } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
export const ZONA_FOTO = { x: 0, y: 0, w: ANCHO, h: 800 }
const M = 60
const FONDO = '#002261'
const MAPA = { x: 600, y: 812, w: 420, h: 420 }

// Horas en coche aproximadas (media de 90 km/h), redondeadas al cuarto de hora.
export function horasCoche(km) {
  const cuartos = Math.round((km / 90) * 4)
  return `${Math.floor(cuartos / 4)}:${String((cuartos % 4) * 15).padStart(2, '0')}`
}

function mapa(g, destino, escudo) {
  const { x, y, w, h } = MAPA
  g.save()
  g.fillStyle = 'rgba(255,255,255,0.05)'
  g.strokeStyle = 'rgba(255,255,255,0.12)'
  g.lineWidth = 1.5
  g.beginPath()
  g.roundRect(x, y, w, h, 22)
  g.fill()
  g.stroke()
  g.clip()

  // Proyección equirectangular de la península (con Baleares).
  const lng0 = -9.6
  const lng1 = 4.5
  const lat0 = 35.8
  const lat1 = 43.9
  const k = Math.cos((39.3 * Math.PI) / 180)
  const s = Math.min((w - 40) / ((lng1 - lng0) * k), (h - 90) / (lat1 - lat0))
  const ox = x + (w - (lng1 - lng0) * k * s) / 2
  const oy = y + 58 + (h - 58 - (lat1 - lat0) * s) / 2
  const px = (lng, lat) => [ox + (lng - lng0) * k * s, oy + (lat1 - lat) * s]

  // Cuadrícula de meridianos y paralelos.
  g.strokeStyle = 'rgba(255,255,255,0.06)'
  g.lineWidth = 1
  for (let lng = -9; lng <= 4; lng++) { const [a] = px(lng, 0); g.beginPath(); g.moveTo(a, y); g.lineTo(a, y + h); g.stroke() }
  for (let lat = 36; lat <= 43; lat++) { const [, b] = px(0, lat); g.beginPath(); g.moveTo(x, b); g.lineTo(x + w, b); g.stroke() }

  // Silueta de la península (Portugal más tenue) y Baleares.
  const silueta = (anillos, relleno, borde) => {
    g.fillStyle = relleno
    g.strokeStyle = borde
    g.lineWidth = 1.5
    g.lineJoin = 'round'
    anillos.forEach(anillo => {
      g.beginPath()
      anillo.forEach(([lng, lat], i) => { const [a, b] = px(lng, lat); if (i) g.lineTo(a, b); else g.moveTo(a, b) })
      g.closePath()
      g.fill()
      g.stroke()
    })
  }
  silueta(PORTUGAL, 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.1)')
  silueta(ESPANA, 'rgba(255,255,255,0.09)', 'rgba(255,255,255,0.28)')

  texto(g, `LOS ${DESPLAZAMIENTOS.length} DESPLAZAMIENTOS`, x + 24, y + 40, `700 15px ${TEXTO}`, AMARILLO, 'left', '2.5px')

  // Todos los destinos, tenues.
  DESPLAZAMIENTOS.forEach(d => {
    if (d === destino) return
    const [a, b] = px(d.lng, d.lat)
    g.fillStyle = 'rgba(255,255,255,0.35)'
    g.beginPath()
    g.arc(a, b, 4.5, 0, Math.PI * 2)
    g.fill()
  })

  const [zx, zy] = px(ZARAGOZA.lng, ZARAGOZA.lat)
  if (destino) {
    // Ruta en arco desde Zaragoza.
    const [dx, dy] = px(destino.lng, destino.lat)
    const mx = (zx + dx) / 2
    const my = (zy + dy) / 2
    // Punto de control desplazado en perpendicular, siempre hacia arriba.
    let nx = -(dy - zy) * 0.28
    let ny = (dx - zx) * 0.28
    if (ny > 0) { nx = -nx; ny = -ny }
    const cx = mx + nx
    const cy = my + ny
    g.strokeStyle = AMARILLO
    g.lineWidth = 3.5
    g.lineCap = 'round'
    g.setLineDash([2, 10])
    g.beginPath()
    g.moveTo(zx, zy)
    g.quadraticCurveTo(cx, cy, dx, dy)
    g.stroke()
    g.setLineDash([])

    // Destino: escudo en un círculo blanco.
    g.fillStyle = '#ffffff'
    g.beginPath()
    g.arc(dx, dy, 25, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = AMARILLO
    g.lineWidth = 3
    g.stroke()
    imagen(g, escudo, dx, dy, 34)
    const arriba = dy > y + h - 70
    texto(g, (CIUDAD_RIVAL[destino.rival] || destino.ciudad).toUpperCase(), Math.min(Math.max(dx, x + 70), x + w - 70), arriba ? dy - 36 : dy + 50, `700 15px ${TEXTO}`, '#ffffff', 'center', '1.5px')
  }
  // Zaragoza.
  g.fillStyle = 'rgba(255,213,0,0.25)'
  g.beginPath()
  g.arc(zx, zy, 16, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = AMARILLO
  g.beginPath()
  g.arc(zx, zy, 8, 0, Math.PI * 2)
  g.fill()
  texto(g, 'ZARAGOZA', zx, zy - 26, `700 15px ${TEXTO}`, AMARILLO, 'center', '1.5px')
  g.restore()
}

/**
 * datos: { antetitulo, ciudad, estadio, rival, credito, ajusteFoto }
 * recursos: { foto, logo, escudoRival }
 */
export function dibujarGraficoOnTour(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  g.fillStyle = FONDO
  g.fillRect(0, 0, ANCHO, ALTO)
  const abajo = g.createLinearGradient(0, 800, 0, ALTO)
  abajo.addColorStop(0, FONDO)
  abajo.addColorStop(1, AZUL_OSCURO)
  g.fillStyle = abajo
  g.fillRect(0, 800, ANCHO, ALTO - 800)

  // Foto del estadio, fundida por abajo y oscurecida arriba.
  const z = ZONA_FOTO
  if (hayImagen(recursos.foto)) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeEn(recursos.foto, z, zoom, dx, dy)
    g.save()
    g.beginPath()
    g.rect(z.x, z.y, z.w, z.h)
    g.clip()
    g.drawImage(recursos.foto, e.x, e.y, e.w, e.h)
    g.restore()
  }
  const arriba = g.createLinearGradient(0, 0, 0, 200)
  arriba.addColorStop(0, 'rgba(1,25,71,0.6)')
  arriba.addColorStop(1, 'rgba(1,25,71,0)')
  g.fillStyle = arriba
  g.fillRect(0, 0, ANCHO, 200)
  const fundido = g.createLinearGradient(0, 380, 0, 800)
  fundido.addColorStop(0, 'rgba(0,34,97,0)')
  fundido.addColorStop(0.55, 'rgba(0,34,97,0.72)')
  fundido.addColorStop(1, FONDO)
  g.fillStyle = fundido
  g.fillRect(0, 380, ANCHO, 421)
  if (datos.credito) {
    g.save()
    g.translate(ANCHO - 22, 470)
    g.rotate(-Math.PI / 2)
    texto(g, datos.credito.toUpperCase(), 0, 0, `600 14px ${TEXTO}`, 'rgba(255,255,255,0.85)', 'left', '1px')
    g.restore()
  }

  // Cabecera: pastilla ON TOUR y logo.
  g.font = `700 22px ${TEXTO}`
  if ('letterSpacing' in g) g.letterSpacing = '3px'
  const wPastilla = g.measureText('ON TOUR').width + 40
  if ('letterSpacing' in g) g.letterSpacing = '0px'
  g.fillStyle = AMARILLO
  g.beginPath()
  g.roundRect(M, 52, wPastilla, 48, 24)
  g.fill()
  texto(g, 'ON TOUR', M + wPastilla / 2 + 1.5, 84, `700 22px ${TEXTO}`, AZUL_OSCURO, 'center', '3px')
  logoRz(g, recursos.logo, ANCHO - M - 130, 44, 130, true)

  // Ciudad en grande con el escudo del rival.
  const ciudad = (datos.ciudad || '').toUpperCase()
  const baseCiudad = 772
  const ladoEscudo = 150
  if (ciudad) {
    const t = ajustar(g, ciudad, x => `700 ${x}px ${TITULOS}`, 250, ANCHO - 2 * M - ladoEscudo - 30, 90)
    g.font = `700 ${t}px ${TITULOS}`
    const alto = g.measureText(ciudad).actualBoundingBoxAscent
    g.save()
    g.shadowColor = 'rgba(0,0,0,0.35)'
    g.shadowBlur = 24
    texto(g, ciudad, M - 4, baseCiudad, `700 ${t}px ${TITULOS}`, AMARILLO)
    g.restore()
    if (datos.antetitulo) texto(g, datos.antetitulo.toUpperCase(), M, baseCiudad - alto - 26, `700 21px ${TEXTO}`, '#ffffff', 'left', '2.5px')
    imagen(g, recursos.escudoRival, ANCHO - M - ladoEscudo / 2, baseCiudad - alto / 2, ladoEscudo)
  }

  // ── El viaje en cifras ──
  const destino = DESPLAZAMIENTOS.find(d => d.rival === datos.rival) || null
  texto(g, 'ESTADIO', M, 842, `700 16px ${TEXTO}`, AMARILLO, 'left', '3px')
  const estadio = (datos.estadio || '').toUpperCase()
  if (estadio) {
    const te = ajustar(g, estadio, x => `700 ${x}px ${TEXTO}`, 36, 500, 20)
    texto(g, estadio, M, 884, `700 ${te}px ${TEXTO}`, '#ffffff', 'left', '-0.5px')
  }
  g.fillStyle = 'rgba(255,255,255,0.15)'
  g.fillRect(M, 912, 500, 1.5)
  if (destino) {
    const total = DESPLAZAMIENTOS.length
    const corto = destino.num <= Math.ceil(total / 2)
    const filas = [
      [String(destino.km), ['KM DESDE', 'ZARAGOZA'], AMARILLO],
      [`${corto ? destino.num : total - destino.num + 1}º`, [`DESPLAZAMIENTO MÁS ${corto ? 'CORTO' : 'LARGO'}`, 'DE LA TEMPORADA'], '#ffffff'],
      destino.nota
        ? ['+', ['EN COCHE Y BARCO', destino.nota.toUpperCase()], '#ffffff']
        : [horasCoche(destino.km), ['HORAS EN COCHE', '(APROXIMADAMENTE)'], '#ffffff'],
    ]
    filas.forEach(([valor, lineas, color], i) => {
      const y = 940 + i * 100
      texto(g, valor, M - 2, y + 86, `700 104px ${TITULOS}`, color)
      g.font = `700 104px ${TITULOS}`
      const xl = M + Math.max(g.measureText(valor).width, 60) + 22
      texto(g, lineas[0], xl, y + 48, `700 20px ${TEXTO}`, '#ffffff', 'left', '1px')
      texto(g, lineas[1], xl, y + 76, `500 20px ${TEXTO}`, 'rgba(255,255,255,0.75)', 'left', '1px')
    })
  }

  mapa(g, destino, recursos.escudoRival)

  // Pie.
  g.font = `500 19px ${TEXTO}`
  const pre = 'Quedadas, guía y mapa del viaje en '
  texto(g, pre, M, 1296, `500 19px ${TEXTO}`, 'rgba(255,255,255,0.8)')
  texto(g, 'rzhub.es/on-tour', M + g.measureText(pre).width, 1296, `700 19px ${TEXTO}`, AMARILLO)
  g.restore()
}
