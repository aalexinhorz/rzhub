// "Mi predicción" para redes (1080×1350, 4:5): el pronóstico de un usuario
// de la Porra de RZ Hub. Arriba el logo y el título; debajo la tarjeta del
// usuario (foto, @usuario, puesto y puntos en la Porra), los datos del
// partido, dos columnas con el escudo y los goles de cada equipo (la del
// Real Zaragoza con sus goleadores) y una llamada a hacer el pronóstico.

import { AMARILLO, AZUL, AZUL_OSCURO, TEXTO, TITULOS, ajustar, hayImagen, imagen, logoRz, partir, texto } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350

function avatar(g, img, nombre, cx, cy, r) {
  g.save()
  g.beginPath()
  g.arc(cx, cy, r, 0, Math.PI * 2)
  g.fillStyle = AZUL
  g.fill()
  g.clip()
  if (hayImagen(img)) {
    const s = Math.max((2 * r) / img.naturalWidth, (2 * r) / img.naturalHeight)
    g.drawImage(img, cx - img.naturalWidth * s / 2, cy - img.naturalHeight * s / 2, img.naturalWidth * s, img.naturalHeight * s)
  } else {
    texto(g, (nombre || '?')[0].toUpperCase(), cx, cy + r * 0.36, `700 ${Math.round(r)}px ${TEXTO}`, '#ffffff', 'center')
  }
  g.restore()
  g.strokeStyle = AMARILLO
  g.lineWidth = 3
  g.beginPath()
  g.arc(cx, cy, r, 0, Math.PI * 2)
  g.stroke()
}

// Columna de un equipo: escudo, goles y (si es el Real Zaragoza) goleadores.
function columna(g, x, y, w, h, color, escudo, goles, goleadores) {
  const f = g.createLinearGradient(x, y, x, y + h)
  f.addColorStop(0, color.arriba)
  f.addColorStop(1, color.abajo)
  g.fillStyle = f
  g.beginPath()
  g.roundRect(x, y, w, h, 26)
  g.fill()
  const cx = x + w / 2
  imagen(g, escudo, cx, y + 110, 160)
  const gl = String(goles ?? '')
  texto(g, gl, cx, y + 470, `700 300px ${TITULOS}`, '#ffffff', 'center')

  if (goleadores?.length) {
    texto(g, 'GOLEADORES', cx, y + 540, `700 22px ${TEXTO}`, '#ffffff', 'center', '1px')
    const lista = goleadores.slice(0, 3)
    const ancho = 78, alto = 96, hueco = 10
    const total = lista.length * ancho + (lista.length - 1) * hueco
    lista.forEach((j, i) => {
      const xx = cx - total / 2 + i * (ancho + hueco)
      const yy = y + 560
      g.save()
      g.beginPath()
      g.roundRect(xx, yy, ancho, alto, 8)
      g.fillStyle = 'rgba(255,255,255,0.92)'
      g.fill()
      g.clip()
      if (hayImagen(j.foto)) {
        const s = Math.max(ancho / j.foto.naturalWidth, (alto - 20) / j.foto.naturalHeight)
        g.drawImage(j.foto, xx + ancho / 2 - j.foto.naturalWidth * s / 2, yy, j.foto.naturalWidth * s, j.foto.naturalHeight * s)
      }
      g.fillStyle = AZUL
      g.fillRect(xx, yy + alto - 22, ancho, 22)
      g.restore()
      const n = j.corto || ''
      const tn = ajustar(g, n, k => `700 ${k}px ${TEXTO}`, 14, ancho - 6, 9)
      texto(g, n, xx + ancho / 2, yy + alto - 6, `700 ${tn}px ${TEXTO}`, '#ffffff', 'center')
    })
    if (goleadores.length > 3) texto(g, `+${goleadores.length - 3}`, cx, y + 690, `700 18px ${TEXTO}`, '#ffffff', 'center')
  }
}

/**
 * datos: { titulo, usuario: { nombre, username, puesto, puntos }, lineas: [3 textos],
 *          golesLocal, golesVisitante, zaragozaLocal, colorRival, cta }
 * recursos: { logo, avatar, escudoLocal, escudoVisitante, goleadores: [{ corto, foto }] }
 */
export function dibujarGraficoMiPrediccion(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  const f = g.createLinearGradient(0, 0, ANCHO, ALTO)
  f.addColorStop(0, '#0a3fa0')
  f.addColorStop(0.5, '#04205a')
  f.addColorStop(1, '#020a1c')
  g.fillStyle = f
  g.fillRect(0, 0, ANCHO, ALTO)

  logoRz(g, recursos.logo, ANCHO / 2 - 75, 44, 150)
  const titulo = (datos.titulo || '').toUpperCase()
  const tt = ajustar(g, titulo, n => `700 ${n}px ${TITULOS}`, 165, ANCHO - 160, 80)
  texto(g, titulo, ANCHO / 2, 268, `700 ${tt}px ${TITULOS}`, AMARILLO, 'center', '1px')

  // Tarjeta del usuario.
  const u = datos.usuario || {}
  const principal = u.username ? `@${u.username}` : (u.nombre || 'Aficionado')
  const extra = [u.puesto ? `${u.puesto}.º en la Porra` : '', u.puntos != null ? `${u.puntos} pts` : ''].filter(Boolean).join(' · ')
  g.font = `700 28px ${TEXTO}`
  const w1 = g.measureText(principal).width
  g.font = `500 20px ${TEXTO}`
  const w2 = extra ? g.measureText(extra).width : 0
  const r = 30
  const anchoChip = 2 * r + 18 + Math.max(w1, w2) + 34
  const xChip = ANCHO / 2 - anchoChip / 2
  const yChip = 296
  g.fillStyle = 'rgba(255,255,255,0.08)'
  g.beginPath()
  g.roundRect(xChip, yChip, anchoChip, 2 * r + 16, r + 8)
  g.fill()
  avatar(g, recursos.avatar, u.nombre || u.username, xChip + 8 + r, yChip + 8 + r, r)
  const xt = xChip + 8 + 2 * r + 16
  if (extra) {
    texto(g, principal, xt, yChip + 40, `700 28px ${TEXTO}`, '#ffffff')
    texto(g, extra, xt, yChip + 64, `500 20px ${TEXTO}`, AMARILLO)
  } else {
    texto(g, principal, xt, yChip + 52, `700 28px ${TEXTO}`, '#ffffff')
  }

  // Partido.
  const [l1, l2, l3] = datos.lineas || []
  if (l1) texto(g, l1, ANCHO / 2, 432, `700 26px ${TEXTO}`, '#ffffff', 'center', '-0.3px')
  if (l2) texto(g, l2, ANCHO / 2, 464, `400 24px ${TEXTO}`, 'rgba(255,255,255,0.85)', 'center')
  if (l3) texto(g, l3, ANCHO / 2, 496, `700 24px ${TEXTO}`, '#ffffff', 'center')

  // Columnas.
  const y = 530, h = 700, w = 300, hueco = 80
  const xL = ANCHO / 2 - hueco / 2 - w
  const xV = ANCHO / 2 + hueco / 2
  const azul = { arriba: '#0a4fd0', abajo: AZUL_OSCURO }
  const rival = { arriba: datos.colorRival || 'rgba(255,255,255,0.18)', abajo: datos.colorRivalOscuro || 'rgba(255,255,255,0.06)' }
  const zl = datos.zaragozaLocal !== false
  columna(g, xL, y, w, h, zl ? azul : rival, recursos.escudoLocal, datos.golesLocal, zl ? recursos.goleadores : null)
  columna(g, xV, y, w, h, zl ? rival : azul, recursos.escudoVisitante, datos.golesVisitante, zl ? null : recursos.goleadores)
  texto(g, '-', ANCHO / 2, y + 430, `700 120px ${TITULOS}`, 'rgba(255,255,255,0.6)', 'center')

  // Llamada.
  if (datos.cta) {
    g.font = `700 26px ${TEXTO}`
    const lineas = partir(g, datos.cta, 820).slice(0, 1)
    const t = lineas[0] || ''
    const wc = g.measureText(t).width + 64
    g.fillStyle = AMARILLO
    g.beginPath()
    g.roundRect(ANCHO / 2 - wc / 2, 1258, wc, 56, 28)
    g.fill()
    texto(g, t, ANCHO / 2, 1295, `700 26px ${TEXTO}`, AZUL_OSCURO, 'center')
  }
  g.restore()
}
