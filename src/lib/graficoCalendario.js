// Gráfico del calendario del Real Zaragoza para redes (1080×1350, 4:5):
// cuadrícula de semanas (L–D) con los partidos del rango elegido (en casa
// en amarillo, fuera en azul). Mismo estilo que las demás plantillas de
// /redaccion-graficos.

export const ANCHO = 1080
export const ALTO = 1350
const M = 48
const AMARILLO = '#ffd500'
const AZUL = '#0045bf'
const AZUL_OSCURO = '#011947'
const TITULOS = "Humane, 'Arial Narrow', sans-serif"
const TEXTO = 'Archivo, sans-serif'
const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// Fechas como 'YYYY-MM-DD' (hora de Madrid) para no pelearse con husos.
export const sumarDias = (ymd, n) => {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export const lunesDe = ymd => {
  const d = new Date(`${ymd}T12:00:00Z`)
  return sumarDias(ymd, -((d.getUTCDay() + 6) % 7))
}
// Último día del rango: el domingo de la última semana, para que N
// semanas sean siempre N filas de la rejilla (los días anteriores al de
// inicio salen apagados).
export const finDe = (desde, semanas) => sumarDias(lunesDe(desde), semanas * 7 - 1)
const etiquetaFecha = ymd => `${Number(ymd.slice(8, 10))} ${MESES[Number(ymd.slice(5, 7)) - 1]}`

function casa(g, x, y, s, color) {
  g.fillStyle = color
  g.beginPath()
  g.moveTo(x, y - s * 0.55)
  g.lineTo(x + s * 0.55, y - s * 0.05)
  g.lineTo(x + s * 0.38, y - s * 0.05)
  g.lineTo(x + s * 0.38, y + s * 0.45)
  g.lineTo(x + s * 0.1, y + s * 0.45)
  g.lineTo(x + s * 0.1, y + s * 0.15)
  g.lineTo(x - s * 0.1, y + s * 0.15)
  g.lineTo(x - s * 0.1, y + s * 0.45)
  g.lineTo(x - s * 0.38, y + s * 0.45)
  g.lineTo(x - s * 0.38, y - s * 0.05)
  g.lineTo(x - s * 0.55, y - s * 0.05)
  g.closePath()
  g.fill()
}

function avion(g, x, y, s, color) {
  g.save()
  g.translate(x, y)
  g.rotate(-Math.PI / 4)
  g.fillStyle = color
  g.beginPath()
  g.ellipse(0, 0, s * 0.11, s * 0.55, 0, 0, Math.PI * 2) // fuselaje
  g.fill()
  g.beginPath() // alas
  g.moveTo(0, -s * 0.12); g.lineTo(s * 0.55, s * 0.12); g.lineTo(s * 0.55, s * 0.22); g.lineTo(0, s * 0.08)
  g.lineTo(-s * 0.55, s * 0.22); g.lineTo(-s * 0.55, s * 0.12); g.closePath()
  g.fill()
  g.beginPath() // cola
  g.moveTo(0, s * 0.32); g.lineTo(s * 0.24, s * 0.48); g.lineTo(s * 0.24, s * 0.55); g.lineTo(0, s * 0.47)
  g.lineTo(-s * 0.24, s * 0.55); g.lineTo(-s * 0.24, s * 0.48); g.closePath()
  g.fill()
  g.restore()
}

function texto(g, t, x, y, fuente, color, alinear = 'left', espaciado = '0px') {
  g.font = fuente
  g.fillStyle = color
  g.textAlign = alinear
  if ('letterSpacing' in g) g.letterSpacing = espaciado
  g.fillText(t, x, y)
  if ('letterSpacing' in g) g.letterSpacing = '0px'
}

function imagen(g, img, cx, cy, caja) {
  if (!img?.complete || !img.naturalWidth) return false
  const s = Math.min(caja / img.naturalWidth, caja / img.naturalHeight)
  g.drawImage(img, cx - img.naturalWidth * s / 2, cy - img.naturalHeight * s / 2, img.naturalWidth * s, img.naturalHeight * s)
  return true
}

/**
 * datos: { desde: 'YYYY-MM-DD', semanas, titulo, subtitulo,
 *          partidos: [{ fecha: 'YYYY-MM-DD', hora: 'HH:MM' | null, rival, enCasa, etiqueta }] }
 * recursos: { logo, escudos: { [rival]: Image } }
 */
export function dibujarGraficoCalendario(g, datos, recursos) {
  g.save()
  g.textBaseline = 'alphabetic'

  const fondo = g.createLinearGradient(0, 0, 0, ALTO)
  fondo.addColorStop(0, AZUL_OSCURO)
  fondo.addColorStop(0.5, '#002261')
  fondo.addColorStop(1, '#002978')
  g.fillStyle = fondo
  g.fillRect(0, 0, ANCHO, ALTO)
  const brillo = g.createRadialGradient(ANCHO * 0.85, -80, 40, ANCHO * 0.85, -80, 650)
  brillo.addColorStop(0, 'rgba(61,139,255,0.32)')
  brillo.addColorStop(1, 'rgba(61,139,255,0)')
  g.fillStyle = brillo
  g.fillRect(0, 0, ANCHO, ALTO)

  const semanas = Math.min(6, Math.max(3, datos.semanas || 5))
  const desde = datos.desde
  const hasta = finDe(desde, semanas)
  const inicioRejilla = lunesDe(desde)
  const filas = semanas

  // Cabecera.
  const { logo } = recursos
  if (logo?.complete && logo.naturalWidth) g.drawImage(logo, M, 46, 128, 128 * logo.naturalHeight / logo.naturalWidth)
  const rango = `${etiquetaFecha(desde)} – ${etiquetaFecha(hasta)}`
  g.font = `800 24px ${TEXTO}`
  if ('letterSpacing' in g) g.letterSpacing = '1px'
  const anchoRango = g.measureText(rango).width + 40
  if ('letterSpacing' in g) g.letterSpacing = '0px'
  g.fillStyle = AMARILLO
  g.beginPath()
  g.roundRect(ANCHO - M - anchoRango, 44, anchoRango, 50, 25)
  g.fill()
  texto(g, rango, ANCHO - M - anchoRango / 2, 78, `800 24px ${TEXTO}`, AZUL_OSCURO, 'center', '1px')
  texto(g, (datos.titulo || 'Calendario').toUpperCase(), M - 4, 250, `700 176px ${TITULOS}`, '#ffffff')
  texto(g, (datos.subtitulo || 'Todos los partidos del Real Zaragoza').toUpperCase(), M, 292, `600 22px ${TEXTO}`, AMARILLO, 'left', '2px')

  // Rejilla.
  const hueco = 12
  const anchoCelda = (ANCHO - M * 2 - hueco * 6) / 7
  const yDias = 346
  DIAS.forEach((d, i) => texto(g, d, M + i * (anchoCelda + hueco) + anchoCelda / 2, yDias, `800 24px ${TEXTO}`, 'rgba(255,213,0,0.9)', 'center'))
  const y0 = yDias + 22
  const altoCelda = Math.min(200, (1236 - y0 - hueco * (filas - 1)) / filas)
  const partidos = new Map((datos.partidos || []).map(p => [p.fecha, p]))

  for (let i = 0; i < filas * 7; i++) {
    const dia = sumarDias(inicioRejilla, i)
    const fuera = dia < desde || dia > hasta
    const x = M + (i % 7) * (anchoCelda + hueco)
    const y = y0 + Math.floor(i / 7) * (altoCelda + hueco)
    const p = !fuera && partidos.get(dia)
    const numero = String(Number(dia.slice(8, 10)))
    const mes = (i === 0 || dia.slice(8, 10) === '01' || dia === desde) ? MESES[Number(dia.slice(5, 7)) - 1] : null

    g.save()
    g.beginPath()
    g.roundRect(x, y, anchoCelda, altoCelda, 16)
    if (p) {
      const fondoCelda = g.createLinearGradient(x, y, x + anchoCelda, y + altoCelda)
      if (p.enCasa) { fondoCelda.addColorStop(0, '#ffe14d'); fondoCelda.addColorStop(1, '#f5b800') } else { fondoCelda.addColorStop(0, '#1d5fe0'); fondoCelda.addColorStop(1, '#0a3a9e') }
      g.fillStyle = fondoCelda
      g.fill()
      g.clip()
      // Franja diagonal de brillo.
      g.fillStyle = 'rgba(255,255,255,0.14)'
      g.beginPath()
      g.moveTo(x + anchoCelda * 0.45, y); g.lineTo(x + anchoCelda * 0.75, y); g.lineTo(x + anchoCelda * 0.2, y + altoCelda); g.lineTo(x - anchoCelda * 0.1, y + altoCelda)
      g.fill()
      const tinta = p.enCasa ? AZUL_OSCURO : '#ffffff'
      texto(g, numero, x + anchoCelda - 12, y + 30, `800 20px ${TEXTO}`, tinta, 'right')
      if (p.etiqueta) texto(g, p.etiqueta, x + 12, y + 30, `800 17px ${TEXTO}`, tinta, 'left', '0.5px')
      const caja = Math.min(anchoCelda * 0.62, altoCelda * 0.5)
      if (!imagen(g, recursos.escudos?.[p.rival], x + anchoCelda / 2, y + altoCelda * 0.47, caja)) {
        texto(g, (p.rival || '?').slice(0, 3).toUpperCase(), x + anchoCelda / 2, y + altoCelda * 0.52, `700 ${Math.round(caja * 0.6)}px ${TITULOS}`, tinta, 'center')
      }
      const hora = p.hora ? `${p.hora}H` : 'SIN HORA'
      g.font = `800 ${p.hora ? 21 : 17}px ${TEXTO}`
      const anchoHora = g.measureText(hora).width
      const icono = 22
      const xIni = x + anchoCelda / 2 - (anchoHora + icono + 6) / 2
      const yHora = y + altoCelda - 18
      if (p.enCasa) casa(g, xIni + icono / 2, yHora - 7, icono, tinta)
      else avion(g, xIni + icono / 2, yHora - 7, icono, tinta)
      texto(g, hora, xIni + icono + 6, yHora, `800 ${p.hora ? 21 : 17}px ${TEXTO}`, tinta)
    } else {
      g.fillStyle = fuera ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.06)'
      g.fill()
      g.lineWidth = 2
      g.strokeStyle = fuera ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.18)'
      g.stroke()
      const color = fuera ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.55)'
      texto(g, numero, x + anchoCelda / 2, y + altoCelda / 2 + Math.min(40, altoCelda * 0.22), `700 ${Math.round(Math.min(110, altoCelda * 0.62))}px ${TITULOS}`, color, 'center')
      if (mes && !fuera) texto(g, mes, x + anchoCelda / 2, y + 30, `800 18px ${TEXTO}`, AMARILLO, 'center', '1px')
    }
    g.restore()
  }

  // Leyenda y web.
  const yLey = 1302
  g.fillStyle = AMARILLO
  g.beginPath(); g.roundRect(M, yLey - 22, 30, 30, 7); g.fill()
  casa(g, M + 15, yLey - 8, 18, AZUL_OSCURO)
  texto(g, 'EN CASA', M + 42, yLey, `700 18px ${TEXTO}`, 'rgba(255,255,255,0.88)', 'left', '1px')
  const x2 = M + 42 + 120
  g.fillStyle = AZUL
  g.beginPath(); g.roundRect(x2, yLey - 22, 30, 30, 7); g.fill()
  avion(g, x2 + 15, yLey - 8, 18, '#ffffff')
  texto(g, 'FUERA', x2 + 42, yLey, `700 18px ${TEXTO}`, 'rgba(255,255,255,0.88)', 'left', '1px')
  texto(g, 'rzhub.es', ANCHO - M, yLey, `700 18px ${TEXTO}`, 'rgba(255,255,255,0.85)', 'right', '1px')
  g.restore()
}
