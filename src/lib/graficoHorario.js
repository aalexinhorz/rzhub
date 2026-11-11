// "Horario confirmado" para redes (1080×1350, 4:5). Arriba una foto fundida
// con el azul, los escudos y el partido; en medio el día y la hora en
// grande. Abajo cambia según dónde se juegue:
// - En casa: el estadio y la ciudad, con un lema (¡A llenar el Ibercaja!).
// - Fuera: la ruta desde Zaragoza (km y horas en coche) y el estadio.

import { encajeEn } from './graficosComun'
import { casilla } from './graficoRival'
import { AMARILLO, AZUL_OSCURO, TEXTO, TITULOS, ajustar, hayImagen, imagen, logoRz, texto } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
export const ZONA_FOTO = { x: 0, y: 0, w: ANCHO, h: 600 }
const M = 60
const FONDO = '#002261'
const CARTA = { x: M, y: 1072, w: ANCHO - 2 * M, h: 178 }

function pastilla(g, t, x, y, alto, fuente, fondo, tinta, espaciado, centrada = false) {
  g.font = fuente
  if ('letterSpacing' in g) g.letterSpacing = espaciado
  const w = g.measureText(t).width + alto * 0.9
  if ('letterSpacing' in g) g.letterSpacing = '0px'
  const x0 = centrada ? x - w / 2 : x
  g.fillStyle = fondo
  g.beginPath()
  g.roundRect(x0, y, w, alto, alto / 2)
  g.fill()
  texto(g, t, x0 + w / 2 + 1, y + alto * 0.68, fuente, tinta, 'center', espaciado)
  return w
}

function carta(g) {
  g.fillStyle = 'rgba(255,255,255,0.06)'
  g.strokeStyle = 'rgba(255,255,255,0.14)'
  g.lineWidth = 1.5
  g.beginPath()
  g.roundRect(CARTA.x, CARTA.y, CARTA.w, CARTA.h, 24)
  g.fill()
  g.stroke()
}

// En casa: estadio y ciudad a la izquierda, lema en pastilla a la derecha.
function abajoCasa(g, datos) {
  carta(g)
  const { x, y, w, h } = CARTA
  const etiqueta = datos.ciudad ? `ESTADIO · ${datos.ciudad.toUpperCase()}` : 'ESTADIO'
  texto(g, etiqueta, x + 36, y + 58, `700 16px ${TEXTO}`, AMARILLO, 'left', '3px')
  // Lema en pastilla a la derecha, a la altura del nombre del estadio.
  let anchoLema = 0
  if (datos.lema) {
    const lema = datos.lema.toUpperCase()
    const fuente = `700 19px ${TEXTO}`
    g.font = fuente
    if ('letterSpacing' in g) g.letterSpacing = '2px'
    anchoLema = Math.min(g.measureText(lema).width + 40, w / 2)
    if ('letterSpacing' in g) g.letterSpacing = '0px'
    pastilla(g, lema, x + w - 36 - anchoLema / 2, y + h / 2 + 4, 46, fuente, AMARILLO, AZUL_OSCURO, '2px', true)
  }
  const estadio = (datos.estadio || '').toUpperCase()
  const te = ajustar(g, estadio, n => `700 ${n}px ${TITULOS}`, 92, w - 72 - (anchoLema ? anchoLema + 30 : 0), 40)
  texto(g, estadio, x + 32, y + 138, `700 ${te}px ${TITULOS}`, '#ffffff')
}

// Fuera: Zaragoza ··· km ··· destino, y el estadio debajo.
function abajoFuera(g, datos, recursos) {
  carta(g)
  const { x, y, w } = CARTA
  const yRuta = y + 70
  const xa = x + 70
  const xb = x + w - 70
  // Zaragoza.
  g.fillStyle = 'rgba(255,213,0,0.25)'
  g.beginPath(); g.arc(xa, yRuta, 18, 0, Math.PI * 2); g.fill()
  g.fillStyle = AMARILLO
  g.beginPath(); g.arc(xa, yRuta, 9, 0, Math.PI * 2); g.fill()
  texto(g, 'ZARAGOZA', xa - 18, yRuta + 50, `700 16px ${TEXTO}`, AMARILLO, 'left', '2px')
  // Destino: escudo en círculo blanco.
  g.fillStyle = '#ffffff'
  g.beginPath(); g.arc(xb, yRuta, 30, 0, Math.PI * 2); g.fill()
  g.strokeStyle = AMARILLO
  g.lineWidth = 3
  g.stroke()
  imagen(g, recursos.escudoRival, xb, yRuta, 40)
  if (datos.ciudad) texto(g, datos.ciudad.toUpperCase(), xb + 30, yRuta + 50, `700 16px ${TEXTO}`, '#ffffff', 'right', '2px')
  // Ruta punteada con los km en medio.
  const km = datos.km ? `${datos.km} KM` : ''
  const horas = datos.horas ? `${datos.horas} H EN COCHE` : ''
  const rotulo = [km, horas].filter(Boolean).join('  ·  ')
  g.font = `700 20px ${TEXTO}`
  if ('letterSpacing' in g) g.letterSpacing = '1.5px'
  const wr = rotulo ? g.measureText(rotulo).width + 40 : 0
  if ('letterSpacing' in g) g.letterSpacing = '0px'
  const cx = (xa + xb) / 2
  g.strokeStyle = AMARILLO
  g.lineWidth = 3.5
  g.lineCap = 'round'
  g.setLineDash([2, 11])
  g.beginPath()
  g.moveTo(xa + 26, yRuta); g.lineTo(cx - wr / 2 - 8, yRuta)
  g.moveTo(cx + wr / 2 + 8, yRuta); g.lineTo(xb - 40, yRuta)
  g.stroke()
  g.setLineDash([])
  if (rotulo) pastilla(g, rotulo, cx, yRuta - 22, 44, `700 20px ${TEXTO}`, AMARILLO, AZUL_OSCURO, '1.5px', true)
  // Estadio.
  const estadio = (datos.estadio || '').toUpperCase()
  if (estadio) {
    const te = ajustar(g, estadio, n => `700 ${n}px ${TEXTO}`, 30, w - 72, 18)
    texto(g, estadio, cx, y + 158, `700 ${te}px ${TEXTO}`, '#ffffff', 'center', '1px')
  }
}

/**
 * datos: { enCasa, titulo, local, visitante, competicion, fecha, hora, estadio, ciudad, lema, km, horas, credito, ajusteFoto }
 * recursos: { foto, logo, escudoLocal, escudoVisitante, escudoRival, logoCompeticion }
 */
export function dibujarGraficoHorario(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  g.fillStyle = FONDO
  g.fillRect(0, 0, ANCHO, ALTO)
  const abajo = g.createLinearGradient(0, 600, 0, ALTO)
  abajo.addColorStop(0, FONDO)
  abajo.addColorStop(1, AZUL_OSCURO)
  g.fillStyle = abajo
  g.fillRect(0, 600, ANCHO, ALTO - 600)

  // Foto arriba, fundida.
  const z = ZONA_FOTO
  if (hayImagen(recursos.foto)) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeEn(recursos.foto, z, zoom, dx, dy)
    g.save()
    g.beginPath(); g.rect(z.x, z.y, z.w, z.h); g.clip()
    g.drawImage(recursos.foto, e.x, e.y, e.w, e.h)
    g.restore()
  }
  const sombraArriba = g.createLinearGradient(0, 0, 0, 190)
  sombraArriba.addColorStop(0, 'rgba(1,25,71,0.6)')
  sombraArriba.addColorStop(1, 'rgba(1,25,71,0)')
  g.fillStyle = sombraArriba
  g.fillRect(0, 0, ANCHO, 190)
  const fundido = g.createLinearGradient(0, 250, 0, 600)
  fundido.addColorStop(0, 'rgba(0,34,97,0)')
  fundido.addColorStop(0.6, 'rgba(0,34,97,0.75)')
  fundido.addColorStop(1, FONDO)
  g.fillStyle = fundido
  g.fillRect(0, 250, ANCHO, 351)
  if (datos.credito) {
    g.save()
    g.translate(ANCHO - 22, 380)
    g.rotate(-Math.PI / 2)
    texto(g, datos.credito.toUpperCase(), 0, 0, `600 14px ${TEXTO}`, 'rgba(255,255,255,0.85)', 'left', '1px')
    g.restore()
  }

  // Cabecera.
  pastilla(g, (datos.titulo || 'Horario confirmado').toUpperCase(), M, 52, 48, `700 22px ${TEXTO}`, AMARILLO, AZUL_OSCURO, '3px')
  logoRz(g, recursos.logo, ANCHO - M - 130, 44, 130, true)

  // Escudos con el logo de la competición en medio.
  const lado = 136
  const yEsc = 452
  casilla(g, recursos.escudoLocal, ANCHO / 2 - 70 - lado, yEsc, lado, datos.local === 'Real Zaragoza')
  casilla(g, recursos.escudoVisitante, ANCHO / 2 + 70, yEsc, lado, datos.visitante === 'Real Zaragoza')
  imagen(g, recursos.logoCompeticion, ANCHO / 2, yEsc + lado / 2, 70)
  if (datos.local && datos.visitante) texto(g, `${datos.local} - ${datos.visitante}`, ANCHO / 2, 650, `700 30px ${TEXTO}`, '#ffffff', 'center', '-0.3px')
  if (datos.competicion) texto(g, datos.competicion.toUpperCase(), ANCHO / 2, 690, `600 18px ${TEXTO}`, 'rgba(255,255,255,0.7)', 'center', '3px')

  // Día y hora.
  if (datos.fecha) {
    const f = datos.fecha.toUpperCase()
    const tf = ajustar(g, f, n => `700 ${n}px ${TEXTO}`, 36, ANCHO - 2 * M, 20)
    texto(g, f, ANCHO / 2, 770, `700 ${tf}px ${TEXTO}`, '#ffffff', 'center', '2px')
  }
  if (datos.hora) {
    g.save()
    g.shadowColor = 'rgba(0,0,0,0.3)'
    g.shadowBlur = 30
    texto(g, datos.hora, ANCHO / 2, 1030, `700 290px ${TITULOS}`, AMARILLO, 'center', '6px')
    g.restore()
  }

  if (datos.enCasa) abajoCasa(g, datos)
  else abajoFuera(g, datos, recursos)

  texto(g, 'rzhub.es', ANCHO / 2, 1306, `700 19px ${TEXTO}`, 'rgba(255,255,255,0.8)', 'center', '1px')
  g.restore()
}
