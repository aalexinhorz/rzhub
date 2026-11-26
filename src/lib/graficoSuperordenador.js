// "El Superordenador de RZ Hub" para redes (1080×1350, 4:5): lo que sale
// de simular el resto de la liga miles de veces (prediccion_liga) para un
// equipo: % de ascenso directo, play-off y descenso, y la probabilidad de
// acabar en cada puesto. Pensado para que se entienda sin saber nada de
// modelos: dice qué es y de dónde salen los números.

import { AMARILLO, AZUL_OSCURO, TEXTO, TITULOS, ajustar, fondoAzul, imagen, logoRz, partir, texto } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
// El nombre de la marca: cambiándolo aquí cambia en el gráfico.
export const NOMBRE_SUPERORDENADOR = 'El Superordenador de RZ Hub'
const M = 64
const VERDE = '#22c55e'
const ROJO = '#ef2b3a'

const suma = (puestos, de, a) => puestos.slice(de - 1, a).reduce((t, p) => t + p, 0)
export function porcentaje(p) {
  const v = p * 100
  if (v > 0 && v < 1) return '<1%'
  if (v < 100 && v > 99) return '>99%'
  return `${Math.round(v)}%`
}
const colorPuesto = pos => (pos === 1 ? VERDE : pos <= 5 ? AMARILLO : pos >= 16 ? ROJO : 'rgba(255,255,255,0.32)')

/**
 * datos: { equipo, nombre (corto), puestos: [20 probabilidades], jornada, simulaciones, ptsEsperados }
 * recursos: { logo, escudo }
 */
export function dibujarGraficoSuperordenador(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  fondoAzul(g, ANCHO, ALTO)
  const brillo = g.createRadialGradient(ANCHO * 0.8, 120, 30, ANCHO * 0.8, 120, 700)
  brillo.addColorStop(0, 'rgba(61,139,255,0.30)')
  brillo.addColorStop(1, 'rgba(61,139,255,0)')
  g.fillStyle = brillo
  g.fillRect(0, 0, ANCHO, ALTO)

  const puestos = datos.puestos || []
  const sims = Number(datos.simulaciones || 50000).toLocaleString('es-ES')

  // Cabecera: logo y "tras la jornada".
  logoRz(g, recursos.logo, M, 50, 120)
  if (datos.jornada) {
    const pastilla = `TRAS LA JORNADA ${datos.jornada}`
    g.font = `800 22px ${TEXTO}`
    const w = g.measureText(pastilla).width + 40
    g.fillStyle = AMARILLO
    g.beginPath(); g.roundRect(ANCHO - M - w, 54, w, 46, 23); g.fill()
    texto(g, pastilla, ANCHO - M - w / 2, 85, `800 22px ${TEXTO}`, AZUL_OSCURO, 'center')
  }

  // Marca + pregunta.
  texto(g, NOMBRE_SUPERORDENADOR.toUpperCase(), M, 196, `800 26px ${TEXTO}`, AMARILLO, 'left', '2px')
  texto(g, '¿DÓNDE ACABARÁ', M - 4, 352, `700 140px ${TITULOS}`, '#ffffff')
  const nombre = `EL ${(datos.nombre || '').toUpperCase()}?`
  const escudoW = 118
  const t = ajustar(g, nombre, x => `700 ${x}px ${TITULOS}`, 140, ANCHO - M * 2 - escudoW - 20, 70)
  texto(g, nombre, M - 4, 482, `700 ${t}px ${TITULOS}`, AMARILLO)
  imagen(g, recursos.escudo, ANCHO - M - escudoW / 2, 430, escudoW)

  // Qué es, para quien no sabe nada.
  g.font = `500 24px ${TEXTO}`
  partir(g, `Un ordenador ha jugado ${sims} veces los partidos que quedan de liga, según cómo está jugando cada equipo. Esto es lo que ha salido:`, ANCHO - M * 2)
    .forEach((l, i) => texto(g, l, M, 540 + i * 33, `500 24px ${TEXTO}`, 'rgba(255,255,255,0.88)'))

  // Tres tarjetas.
  const tarjetas = [
    { titulo: 'SUBE DIRECTO', sub: 'Acaba 1.º', p: suma(puestos, 1, 1), color: VERDE },
    { titulo: 'PLAY-OFF', sub: 'Acaba del 2.º al 5.º', p: suma(puestos, 2, 5), color: AMARILLO },
    { titulo: 'DESCIENDE', sub: 'Acaba del 16.º al 20.º', p: suma(puestos, 16, 20), color: ROJO },
  ]
  const hueco = 20
  const wT = (ANCHO - M * 2 - hueco * 2) / 3
  const yT = 625
  const hT = 230
  tarjetas.forEach((c, i) => {
    const x = M + i * (wT + hueco)
    g.fillStyle = 'rgba(255,255,255,0.07)'
    g.beginPath(); g.roundRect(x, yT, wT, hT, 20); g.fill()
    g.fillStyle = c.color
    g.beginPath(); g.roundRect(x, yT, wT, 8, [20, 20, 0, 0]); g.fill()
    texto(g, c.titulo, x + wT / 2, yT + 56, `800 24px ${TEXTO}`, '#ffffff', 'center', '1px')
    texto(g, porcentaje(c.p), x + wT / 2, yT + 178, `700 130px ${TITULOS}`, c.color, 'center')
    texto(g, c.sub, x + wT / 2, yT + 212, `500 19px ${TEXTO}`, 'rgba(255,255,255,0.7)', 'center')
  })

  // Barras: probabilidad de cada puesto.
  const yTit = 925
  texto(g, 'PROBABILIDAD DE ACABAR EN CADA PUESTO', M, yTit, `800 21px ${TEXTO}`, '#ffffff', 'left', '1px')
  const masProbable = puestos.length ? puestos.indexOf(Math.max(...puestos)) : -1
  const base = 1170
  const altoMax = 190
  const maxP = Math.max(...puestos, 0.01)
  const hb = 6
  const wb = (ANCHO - M * 2 - hb * 19) / 20
  puestos.forEach((p, i) => {
    const x = M + i * (wb + hb)
    const h = Math.max(4, (p / maxP) * altoMax)
    g.fillStyle = colorPuesto(i + 1)
    g.beginPath(); g.roundRect(x, base - h, wb, h, [6, 6, 0, 0]); g.fill()
    texto(g, String(i + 1), x + wb / 2, base + 30, `${i === masProbable ? 800 : 600} 19px ${TEXTO}`, i === masProbable ? '#ffffff' : 'rgba(255,255,255,0.6)', 'center')
    if (i === masProbable) texto(g, porcentaje(p), x + wb / 2, base - h - 12, `800 20px ${TEXTO}`, '#ffffff', 'center')
  })
  // Leyenda.
  const ley = [['Sube', VERDE], ['Play-off', AMARILLO], ['Desciende', ROJO]]
  let xl = M
  ley.forEach(([n, c]) => {
    g.fillStyle = c
    g.beginPath(); g.roundRect(xl, base + 52, 18, 18, 4); g.fill()
    texto(g, n, xl + 26, base + 67, `600 18px ${TEXTO}`, 'rgba(255,255,255,0.8)')
    g.font = `600 18px ${TEXTO}`
    xl += 26 + g.measureText(n).width + 28
  })
  if (masProbable >= 0) texto(g, `Puesto más probable: ${masProbable + 1}.º`, ANCHO - M, base + 67, `700 18px ${TEXTO}`, '#ffffff', 'right')

  // Pie.
  g.fillStyle = 'rgba(255,255,255,0.14)'
  g.fillRect(M, 1268, ANCHO - M * 2, 2)
  texto(g, `${sims} simulaciones · Es una estimación, no un resultado seguro`, M, 1310, `500 18px ${TEXTO}`, 'rgba(255,255,255,0.65)')
  texto(g, 'rzhub.es/prediccion', ANCHO - M, 1310, `800 20px ${TEXTO}`, AMARILLO, 'right')
  g.restore()
}

// ── Un partido del Real Zaragoza ──
// Misma cuenta que la función prediccion-liga (modelo.ts): goles esperados de
// cada equipo con Poisson + corrección de Dixon-Coles para los marcadores bajos.
const MAX_GOLES = 10
function poisson(l) {
  const p = [Math.exp(-l)]
  for (let k = 1; k <= MAX_GOLES; k++) p.push(p[k - 1] * l / k)
  return p
}
export function prediccionPartido(modelo, eqLocal, eqVisitante) {
  const lh = Math.exp(modelo.c + modelo.h + eqLocal.ataque + eqVisitante.defensa)
  const la = Math.exp(modelo.c + eqVisitante.ataque + eqLocal.defensa)
  const pl = poisson(lh), pv = poisson(la), rho = modelo.rho
  const marcadores = []
  let s = 0
  for (let i = 0; i <= MAX_GOLES; i++) {
    for (let j = 0; j <= MAX_GOLES; j++) {
      let tau = 1
      if (i === 0 && j === 0) tau = 1 - lh * la * rho
      else if (i === 0 && j === 1) tau = 1 + lh * rho
      else if (i === 1 && j === 0) tau = 1 + la * rho
      else if (i === 1 && j === 1) tau = 1 - rho
      const v = Math.max(0, pl[i] * pv[j] * tau)
      marcadores.push({ l: i, v: j, p: v })
      s += v
    }
  }
  marcadores.forEach(m => { m.p /= s })
  const p1 = marcadores.filter(m => m.l > m.v).reduce((t, m) => t + m.p, 0)
  const px = marcadores.filter(m => m.l === m.v).reduce((t, m) => t + m.p, 0)
  return { p1, px, p2: 1 - p1 - px, goles: [lh, la], top: [...marcadores].sort((a, b) => b.p - a.p).slice(0, 4) }
}

/**
 * datos: { local, visitante (nombres cortos), jornada, tras, simulaciones, pj, ventajaCasa (0.34 = +34 %),
 *          pred: prediccionPartido(...) }
 * recursos: { logo, escudoLocal, escudoVisitante }
 */
export function dibujarSuperordenadorPartido(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  fondoAzul(g, ANCHO, ALTO)
  const brillo = g.createRadialGradient(ANCHO / 2, 300, 30, ANCHO / 2, 300, 700)
  brillo.addColorStop(0, 'rgba(61,139,255,0.28)')
  brillo.addColorStop(1, 'rgba(61,139,255,0)')
  g.fillStyle = brillo
  g.fillRect(0, 0, ANCHO, ALTO)
  const { pred } = datos
  const sims = Number(datos.simulaciones || 50000).toLocaleString('es-ES')

  logoRz(g, recursos.logo, M, 50, 120)
  if (datos.jornada) {
    const pastilla = `JORNADA ${datos.jornada}`
    g.font = `800 22px ${TEXTO}`
    const w = g.measureText(pastilla).width + 40
    g.fillStyle = AMARILLO
    g.beginPath(); g.roundRect(ANCHO - M - w, 54, w, 46, 23); g.fill()
    texto(g, pastilla, ANCHO - M - w / 2, 85, `800 22px ${TEXTO}`, AZUL_OSCURO, 'center')
  }
  texto(g, NOMBRE_SUPERORDENADOR.toUpperCase(), ANCHO / 2, 186, `800 26px ${TEXTO}`, AMARILLO, 'center', '2px')
  texto(g, 'ASÍ VE EL PARTIDO', ANCHO / 2, 300, `700 120px ${TITULOS}`, '#ffffff', 'center')

  // Escudos y nombres.
  const yE = 410
  const xs = [ANCHO * 0.25, ANCHO * 0.75]
  ;[[recursos.escudoLocal, datos.local], [recursos.escudoVisitante, datos.visitante]].forEach(([esc, n], i) => {
    imagen(g, esc, xs[i], yE, 130)
    const t = ajustar(g, n.toUpperCase(), x => `800 ${x}px ${TEXTO}`, 26, 380, 16)
    texto(g, n.toUpperCase(), xs[i], yE + 102, `800 ${t}px ${TEXTO}`, '#ffffff', 'center')
  })
  texto(g, 'VS', ANCHO / 2, yE + 26, `700 80px ${TITULOS}`, 'rgba(255,255,255,0.5)', 'center')

  // 1-X-2 en tres columnas, la más alta en amarillo.
  const ops = [['GANA', datos.local, pred.p1], ['EMPATE', '', pred.px], ['GANA', datos.visitante, pred.p2]]
  const mejor = Math.max(pred.p1, pred.px, pred.p2)
  const wC = (ANCHO - M * 2 - 40) / 3
  const yC = 570
  ops.forEach(([a, b, p], i) => {
    const x = M + i * (wC + 20)
    const top = p === mejor
    g.fillStyle = top ? AMARILLO : 'rgba(255,255,255,0.08)'
    g.beginPath(); g.roundRect(x, yC, wC, 190, 20); g.fill()
    const tinta = top ? AZUL_OSCURO : '#ffffff'
    texto(g, porcentaje(p), x + wC / 2, yC + 112, `700 110px ${TITULOS}`, tinta, 'center')
    texto(g, a, x + wC / 2, yC + 148, `800 20px ${TEXTO}`, tinta, 'center', '1px')
    if (b) {
      const t = ajustar(g, b.toUpperCase(), x2 => `600 ${x2}px ${TEXTO}`, 17, wC - 24, 12)
      texto(g, b.toUpperCase(), x + wC / 2, yC + 174, `600 ${t}px ${TEXTO}`, top ? AZUL_OSCURO : 'rgba(255,255,255,0.7)', 'center')
    }
  })

  // Marcadores más probables.
  const yM = 820
  texto(g, 'LOS RESULTADOS MÁS PROBABLES', M, yM, `800 21px ${TEXTO}`, '#ffffff', 'left', '1px')
  const wM = (ANCHO - M * 2 - 3 * 16) / 4
  pred.top.forEach((m, i) => {
    const x = M + i * (wM + 16)
    g.fillStyle = i === 0 ? 'rgba(255,213,0,0.16)' : 'rgba(255,255,255,0.07)'
    g.beginPath(); g.roundRect(x, yM + 18, wM, 130, 16); g.fill()
    if (i === 0) { g.strokeStyle = AMARILLO; g.lineWidth = 3; g.stroke() }
    texto(g, `${m.l}-${m.v}`, x + wM / 2, yM + 100, `700 86px ${TITULOS}`, i === 0 ? AMARILLO : '#ffffff', 'center', '3px')
    texto(g, porcentaje(m.p), x + wM / 2, yM + 132, `700 20px ${TEXTO}`, 'rgba(255,255,255,0.8)', 'center')
  })

  // En qué se basa.
  const yB = 1010
  g.fillStyle = 'rgba(0,0,0,0.22)'
  g.beginPath(); g.roundRect(M, yB, ANCHO - M * 2, 230, 18); g.fill()
  texto(g, '¿DE DÓNDE SALE ESTO?', M + 28, yB + 44, `800 21px ${TEXTO}`, AMARILLO, 'left', '1px')
  const casa = Math.round((datos.ventajaCasa || 0) * 100)
  const puntos = [
    `Los goles que ha marcado y recibido cada equipo en las ${datos.pj || ''} jornadas de liga jugadas.`,
    'Contra quién: no es lo mismo marcarle al líder que al último.',
    `Jugar en casa: en esta liga el local marca de media un ${casa} % más.`,
    `Con eso calcula los goles que se esperan de cada uno (${pred.goles[0].toFixed(1).replace('.', ',')} - ${pred.goles[1].toFixed(1).replace('.', ',')}) y juega el partido ${sims} veces.`,
  ]
  let y = yB + 84
  puntos.forEach(p => {
    g.font = `500 19px ${TEXTO}`
    const lineas = partir(g, p, ANCHO - M * 2 - 90)
    g.fillStyle = AMARILLO
    g.beginPath(); g.arc(M + 36, y - 6, 5, 0, Math.PI * 2); g.fill()
    lineas.forEach((l, k) => texto(g, l, M + 54, y + k * 25, `500 19px ${TEXTO}`, 'rgba(255,255,255,0.9)'))
    y += lineas.length * 25 + 10
  })

  g.fillStyle = 'rgba(255,255,255,0.14)'
  g.fillRect(M, 1268, ANCHO - M * 2, 2)
  texto(g, `Con los datos tras la jornada ${datos.tras} · Es una estimación, no un resultado seguro`, M, 1310, `500 17px ${TEXTO}`, 'rgba(255,255,255,0.65)')
  texto(g, 'rzhub.es/prediccion', ANCHO - M, 1310, `800 20px ${TEXTO}`, AMARILLO, 'right')
  g.restore()
}
