// Plantilla "Ganadores de la Porra" (1080×1350): el partido de la jornada
// elegida con su resultado y los que más puntos sacaron, con su foto de
// perfil, @usuario, su pronóstico y los puntos. Si nadie acertó el
// resultado exacto, en vez de la lista sale cuántos acertaron el ganador.

import { ajustar, fondoAzul, hayImagen, imagen, logoRz, texto, AMARILLO, AZUL, AZUL_OSCURO, TITULOS, TEXTO } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
const M = 64

function recortar(g, t, ancho) {
  if (g.measureText(t).width <= ancho) return t
  let s = t
  while (s.length > 1 && g.measureText(`${s}…`).width > ancho) s = s.slice(0, -1)
  return `${s.trimEnd()}…`
}

function avatar(g, img, inicial, cx, cy, r) {
  g.save()
  g.beginPath()
  g.arc(cx, cy, r, 0, Math.PI * 2)
  g.fillStyle = AMARILLO
  g.fill()
  g.clip()
  if (hayImagen(img)) {
    const s = Math.max((2 * r) / img.naturalWidth, (2 * r) / img.naturalHeight)
    g.drawImage(img, cx - (img.naturalWidth * s) / 2, cy - (img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s)
  } else {
    texto(g, (inicial || '?').toUpperCase(), cx, cy + r * 0.42, `700 ${Math.round(r * 1.25)}px ${TITULOS}`, AZUL_OSCURO, 'center')
  }
  g.restore()
  g.strokeStyle = AMARILLO
  g.lineWidth = 3
  g.beginPath()
  g.arc(cx, cy, r, 0, Math.PI * 2)
  g.stroke()
}

function pastillaPuntos(g, puntos, xDcha, cy, alto) {
  const t = `+${puntos}`
  const tam = Math.round(alto * 0.46)
  g.font = `800 ${tam}px ${TEXTO}`
  const w = g.measureText(t).width + alto * 0.7
  g.fillStyle = AMARILLO
  g.beginPath()
  g.roundRect(xDcha - w, cy - alto / 2, w, alto, alto / 2)
  g.fill()
  texto(g, t, xDcha - w / 2, cy + tam * 0.36, `800 ${tam}px ${TEXTO}`, AZUL_OSCURO, 'center')
  return w
}

/**
 * datos: {
 *   jornada: 'Jornada 13', local, visitante, golesLocal, golesVisitante, goleadores: 'Sangalli, Espiau',
 *   ganadores: [{ usuario, inicial, pronostico: '2-0', goleadores: 'Sangalli, Espiau', puntos }],
 *   acertantesSigno: n, totalPronosticos: n, cta,
 * }
 * recursos: { logo, escudoLocal, escudoVisitante, avatares: [img por ganador] }
 */
export function dibujarGanadoresPorra(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  fondoAzul(g, ANCHO, ALTO)
  const halo = g.createRadialGradient(ANCHO * 0.85, 200, 0, ANCHO * 0.85, 200, 650)
  halo.addColorStop(0, 'rgba(255,213,0,0.14)')
  halo.addColorStop(1, 'rgba(255,213,0,0)')
  g.fillStyle = halo
  g.fillRect(0, 0, ANCHO, ALTO)

  // Cabecera.
  logoRz(g, recursos.logo, M, 56, 180)
  if (datos.jornada) texto(g, datos.jornada.toUpperCase(), ANCHO - M, 104, `800 24px ${TEXTO}`, 'rgba(255,255,255,0.75)', 'right', '1.5px')
  texto(g, 'GANADORES', M - 4, 330, `700 200px ${TITULOS}`, '#ffffff', 'left', '1px')
  const t2 = ajustar(g, 'DE LA PORRA', n => `700 ${n}px ${TITULOS}`, 200, ANCHO - 2 * M, 100)
  texto(g, 'DE LA PORRA', M - 4, 330 + t2 * 0.84, `700 ${t2}px ${TITULOS}`, AMARILLO, 'left', '1px')

  // Partido: escudos y marcador.
  const yP = 530
  const hP = 128
  g.fillStyle = 'rgba(1,25,71,0.75)'
  g.beginPath()
  g.roundRect(M, yP, ANCHO - 2 * M, hP, 18)
  g.fill()
  const cx = ANCHO / 2
  imagen(g, recursos.escudoLocal, cx - 250, yP + hP / 2 - (datos.goleadores ? 8 : 0), 84)
  imagen(g, recursos.escudoVisitante, cx + 250, yP + hP / 2 - (datos.goleadores ? 8 : 0), 84)
  const marcador = `${datos.golesLocal ?? '-'} - ${datos.golesVisitante ?? '-'}`
  texto(g, marcador, cx, yP + (datos.goleadores ? 92 : 100), `700 ${datos.goleadores ? 104 : 120}px ${TITULOS}`, '#ffffff', 'center', '2px')
  if (datos.goleadores) {
    const tg = ajustar(g, datos.goleadores, n => `600 ${n}px ${TEXTO}`, 22, 380, 14)
    texto(g, datos.goleadores, cx, yP + hP - 12, `600 ${tg}px ${TEXTO}`, 'rgba(255,255,255,0.75)', 'center')
  }
  // Nombres a los lados, en pequeño.
  const nombre = (n, x, al) => {
    const s = (n || '').toUpperCase()
    const tn = ajustar(g, s, k => `800 ${k}px ${TEXTO}`, 20, 150, 12)
    texto(g, s, x, yP + hP / 2 + 6, `800 ${tn}px ${TEXTO}`, '#ffffff', al)
  }
  nombre(datos.local, M + 26, 'left')
  nombre(datos.visitante, ANCHO - M - 26, 'right')

  // Ganadores.
  const ganadores = datos.ganadores || []
  const y0 = yP + hP + 40
  const yFin = 1190
  if (ganadores.length) {
    const dos = ganadores.length > 5
    const cols = dos ? 2 : 1
    const max = dos ? 12 : 5
    const lista = ganadores.slice(0, ganadores.length > max ? max - 1 : max)
    const filasN = Math.ceil((lista.length + (ganadores.length > max ? 1 : 0)) / cols)
    const hueco = 14
    const alto = Math.min(dos ? 96 : ganadores.length <= 2 ? 130 : 108, (yFin - y0 - (filasN - 1) * hueco) / filasN)
    // Pocas filas: la lista se centra en el hueco libre.
    const yLista = y0 + Math.max(0, (yFin - y0 - (filasN * alto + (filasN - 1) * hueco)) / 2)
    const anchoCol = (ANCHO - 2 * M - (cols - 1) * 20) / cols
    const r = alto * 0.36
    lista.forEach((w, i) => {
      const col = dos ? i % 2 : 0
      const fila = dos ? Math.floor(i / 2) : i
      const x = M + col * (anchoCol + 20)
      const y = yLista + fila * (alto + hueco)
      g.fillStyle = i === 0 && !dos ? 'rgba(255,213,0,0.14)' : 'rgba(255,255,255,0.06)'
      g.beginPath()
      g.roundRect(x, y, anchoCol, alto, 14)
      g.fill()
      avatar(g, recursos.avatares?.[i], w.inicial, x + 16 + r, y + alto / 2, r)
      const xt = x + 32 + 2 * r
      const anchoPuntos = pastillaPuntos(g, w.puntos, x + anchoCol - 14, y + alto / 2, alto * 0.5)
      const anchoTexto = anchoCol - (xt - x) - anchoPuntos - 30
      const tu = Math.round(alto * (dos ? 0.27 : 0.3))
      g.font = `800 ${tu}px ${TEXTO}`
      texto(g, recortar(g, `@${w.usuario}`, anchoTexto), xt, y + alto / 2 - 2, `800 ${tu}px ${TEXTO}`, '#ffffff')
      const detalle = [w.pronostico, w.goleadores].filter(Boolean).join(' · ')
      const td = Math.round(alto * (dos ? 0.2 : 0.22))
      g.font = `600 ${td}px ${TEXTO}`
      texto(g, recortar(g, detalle, anchoTexto), xt, y + alto / 2 + td + 6, `600 ${td}px ${TEXTO}`, AMARILLO)
    })
    if (ganadores.length > max) {
      const i = lista.length
      const col = dos ? i % 2 : 0
      const fila = dos ? Math.floor(i / 2) : i
      const x = M + col * (anchoCol + 20)
      const y = yLista + fila * (alto + hueco)
      texto(g, `y ${ganadores.length - lista.length} más`, x + anchoCol / 2, y + alto / 2 + 12, `800 ${Math.round(alto * 0.3)}px ${TEXTO}`, 'rgba(255,255,255,0.8)', 'center')
    }
  } else {
    // Nadie clavó el resultado: cuántos acertaron quién ganaba.
    const cy = (y0 + yFin) / 2
    texto(g, 'NADIE CLAVÓ EL RESULTADO', ANCHO / 2, cy - 150, `800 34px ${TEXTO}`, 'rgba(255,255,255,0.85)', 'center', '1.5px')
    texto(g, String(datos.acertantesSigno || 0), ANCHO / 2, cy + 110, `700 300px ${TITULOS}`, AMARILLO, 'center')
    const sub = datos.acertantesSigno === 1 ? 'acertó el ganador y se lleva +1' : 'acertaron el ganador y se llevan +1'
    texto(g, sub, ANCHO / 2, cy + 170, `600 32px ${TEXTO}`, '#ffffff', 'center')
  }

  // Pie: llamada a la siguiente porra.
  const cta = datos.cta || '¿Te atreves con la próxima? rzhub.es/porra'
  const tc = ajustar(g, cta, n => `800 ${n}px ${TEXTO}`, 28, ANCHO - 2 * M - 80, 16)
  const wc = g.measureText(cta).width + 70
  g.fillStyle = AZUL
  g.beginPath()
  g.roundRect((ANCHO - wc) / 2, 1228, wc, 70, 35)
  g.fill()
  texto(g, cta, ANCHO / 2, 1228 + 35 + tc * 0.36, `800 ${tc}px ${TEXTO}`, '#ffffff', 'center')
  g.restore()
}
