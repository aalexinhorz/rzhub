// Plantilla "Barras": ránking de hasta 8 equipos a todo el ancho, sin foto.
// Cada fila lleva su puesto en un recuadro, una barra con el escudo y el
// nombre (más larga cuanto mayor es el número) y el número grande a la
// derecha. Una fila (el Real Zaragoza, normalmente) puede ir en amarillo.

import { ajustar, fondoAzul, hayImagen, imagen, logoRz, texto, AMARILLO, AZUL, AZUL_OSCURO, TITULOS, TEXTO } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
const M = 56
const COL_VALOR = 190 // hueco para el número de la derecha
const PUESTO = 76 // ancho del recuadro del puesto

// "1.200" → 1200, "79,5%" → 79.5; null si no es un número.
export function numeroDe(v) {
  const limpio = String(v ?? '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.').match(/-?\d+(\.\d+)?/)
  return limpio ? Number(limpio[0]) : null
}

// Recorta con "…" si no cabe.
function recortar(g, t, ancho) {
  if (g.measureText(t).width <= ancho) return t
  let s = t
  while (s.length > 1 && g.measureText(`${s}…`).width > ancho) s = s.slice(0, -1)
  return `${s.trimEnd()}…`
}

/**
 * datos: { cabecera, titulo, subtitulo, seccion, filas: [{ nombre, valor }], destacada (índice o -1) }
 * recursos: { logo, escudos: [img por fila] }
 */
export function dibujarBarras(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  fondoAzul(g, ANCHO, ALTO)
  // Halo suave detrás de la cabecera.
  const halo = g.createRadialGradient(ANCHO * 0.8, 120, 0, ANCHO * 0.8, 120, 620)
  halo.addColorStop(0, 'rgba(0,69,191,0.45)')
  halo.addColorStop(1, 'rgba(0,69,191,0)')
  g.fillStyle = halo
  g.fillRect(0, 0, ANCHO, ALTO)

  // Cabecera: línea pequeña arriba, logo a la derecha, título y subtítulo.
  if (datos.cabecera) {
    const c = datos.cabecera
    const tc = ajustar(g, c, n => `600 ${n}px ${TEXTO}`, 24, ANCHO - 2 * M, 14)
    texto(g, c, ANCHO / 2, 78, `600 ${tc}px ${TEXTO}`, 'rgba(255,255,255,0.75)', 'center', '0.3px')
  }
  const anchoLogo = 190
  if (hayImagen(recursos.logo)) logoRz(g, recursos.logo, ANCHO - M - anchoLogo, 130, anchoLogo)
  const titulo = (datos.titulo || '').toUpperCase()
  const anchoTitulo = ANCHO - 2 * M - anchoLogo - 30
  if (titulo) {
    const tt = ajustar(g, titulo, n => `700 ${n}px ${TITULOS}`, 190, anchoTitulo, 70)
    texto(g, titulo, M - 4, 288, `700 ${tt}px ${TITULOS}`, '#ffffff', 'left', '1px')
  }
  if (datos.subtitulo) {
    const sub = datos.subtitulo.toUpperCase()
    const ts = ajustar(g, sub, n => `700 ${n}px ${TEXTO}`, 28, anchoTitulo, 16)
    texto(g, sub, M, 334, `700 ${ts}px ${TEXTO}`, AMARILLO, 'left', '0.5px')
  }

  // Filas.
  const filas = (datos.filas || []).map((f, i) => ({ ...f, i })).filter(f => f.nombre || f.valor !== '').slice(0, 8)
  const n = Math.max(filas.length, 1)
  const y0 = 384
  const disponible = 1236 - y0
  const hueco = 16
  const alto = Math.min(110, (disponible - (n - 1) * hueco) / n)
  const xBarra = M + PUESTO
  const maxBarra = ANCHO - M - COL_VALOR - xBarra
  const minBarra = Math.min(maxBarra, alto + 330) // siempre cabe escudo + nombre
  const numeros = filas.map(f => numeroDe(f.valor))
  const tope = Math.max(...numeros.filter(v => v != null && v > 0), 0)
  const k = alto / 100

  filas.forEach((f, j) => {
    const y = y0 + j * (alto + hueco)
    const destacada = datos.destacada === f.i
    const v = numeros[j]
    const largo = tope && v != null ? minBarra + (maxBarra - minBarra) * Math.max(0, v) / tope : maxBarra
    const r = 10 * k

    // Puesto.
    g.fillStyle = destacada ? AMARILLO : AZUL_OSCURO
    g.beginPath()
    g.roundRect(M, y, PUESTO, alto, [r, 0, 0, r])
    g.fill()
    texto(g, String(j + 1), M + PUESTO / 2, y + alto / 2 + 33 * k, `700 ${Math.round(96 * k)}px ${TITULOS}`, destacada ? AZUL_OSCURO : '#ffffff', 'center')

    // Barra.
    const grad = g.createLinearGradient(xBarra, 0, xBarra + largo, 0)
    if (destacada) { grad.addColorStop(0, AMARILLO); grad.addColorStop(1, '#ffe14d') } else { grad.addColorStop(0, AZUL); grad.addColorStop(1, '#1a5fd6') }
    g.fillStyle = grad
    g.beginPath()
    g.roundRect(xBarra, y, largo, alto, [0, r, r, 0])
    g.fill()

    // Escudo y nombre.
    const caja = alto * 0.74
    imagen(g, recursos.escudos?.[f.i], xBarra + 14 * k + caja / 2, y + alto / 2, caja)
    const xt = xBarra + 28 * k + caja
    const nombre = (f.nombre || '').toUpperCase()
    g.font = `800 ${Math.round(30 * k)}px ${TEXTO}`
    texto(g, recortar(g, nombre, largo - (xt - xBarra) - 20), xt, y + alto / 2 + 11 * k, `800 ${Math.round(30 * k)}px ${TEXTO}`, destacada ? AZUL_OSCURO : '#ffffff', 'left', '-0.3px')

    // Número.
    if (f.valor !== '' && f.valor != null) {
      const tv = ajustar(g, String(f.valor), t => `700 ${t}px ${TITULOS}`, Math.round(128 * k), COL_VALOR - 14, 40)
      texto(g, String(f.valor), ANCHO - M + 4, y + alto - 2 * k, `700 ${tv}px ${TITULOS}`, destacada ? AMARILLO : '#ffffff', 'right', '1px')
    }
  })

  // Pie: sección a la izquierda y la web a la derecha.
  const yPie = 1296
  if (datos.seccion) {
    g.fillStyle = AMARILLO
    g.fillRect(M, yPie - 13, 30, 9)
    texto(g, datos.seccion.toUpperCase(), M + 46, yPie, `700 20px ${TEXTO}`, '#ffffff', 'left', '0.5px')
  }
  texto(g, 'rzhub.es', ANCHO - M, yPie, `800 24px ${TEXTO}`, AMARILLO, 'right')
  g.restore()
}
