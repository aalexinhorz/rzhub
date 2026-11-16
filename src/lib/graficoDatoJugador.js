// Dos plantillas de datos para redes (1080×1350, 4:5) con el mismo marco:
// a la izquierda la foto (rectángulo liso) y a la derecha los datos, una
// etiqueta de sección y una nota al pie.
// - "Por partido": título, subtítulo y hasta 8 filas (escudo, "VS RIVAL" y
//   un valor grande: minutos, goles, notas…).
// - "El dato": un número enorme, su etiqueta y un texto con **negritas**.
// Dos temas: claro (fondo blanco, azul) y azul (fondo azul, amarillo).

import { encajeEn } from './graficosComun'
import { lineasRicas } from './graficoPorra'
import { AMARILLO, AZUL, AZUL_OSCURO, TEXTO, TITULOS, ajustar, hayImagen, imagen, logoRz, partir, texto } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
const PANEL = 560
export const ZONA_FOTO = { x: 0, y: 0, w: ANCHO - PANEL, h: ALTO }
const X_DATO = ANCHO - PANEL // donde empieza el panel de los datos
const M = 58

const TEMAS = {
  claro: { fondo: ['#ffffff', '#e8edf6'], titulo: AZUL, tinta: AZUL_OSCURO, suave: 'rgba(1,25,71,0.75)', raya: AZUL_OSCURO, gris: '#b9c3d3' },
  azul: { fondo: ['#06328a', AZUL_OSCURO], titulo: AMARILLO, tinta: '#ffffff', suave: 'rgba(255,255,255,0.8)', raya: 'rgba(255,255,255,0.85)', gris: '#4a5872' },
}
const temaDe = datos => TEMAS[datos.tema] || TEMAS.claro

// El logo de RZ Hub tiene el texto en blanco: sobre fondo claro no se ve, así
// que en el tema claro se pintan sus blancos de azul oscuro (el león amarillo
// se queda igual). Se guarda una copia por logo.
const logosClaros = new WeakMap()
function logoSobreClaro(logo) {
  if (!hayImagen(logo)) return logo
  if (logosClaros.has(logo)) return logosClaros.get(logo)
  const c = document.createElement('canvas')
  c.width = logo.naturalWidth
  c.height = logo.naturalHeight
  const g = c.getContext('2d', { willReadFrequently: true })
  g.drawImage(logo, 0, 0)
  try {
    const img = g.getImageData(0, 0, c.width, c.height)
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      const max = Math.max(d[i], d[i + 1], d[i + 2]), min = Math.min(d[i], d[i + 1], d[i + 2])
      if (d[i + 3] > 0 && min > 150 && max - min < 40) { d[i] = 1; d[i + 1] = 25; d[i + 2] = 71 }
    }
    g.putImageData(img, 0, 0)
  } catch { return logo }
  c.naturalWidth = c.width
  c.naturalHeight = c.height
  c.complete = true
  logosClaros.set(logo, c)
  return c
}
const logoDe = (datos, logo) => (datos.tema === 'azul' ? logo : logoSobreClaro(logo))

function marco(g, datos, recursos) {
  const t = temaDe(datos)
  const f = g.createLinearGradient(ANCHO, 0, X_DATO, ALTO)
  f.addColorStop(0, t.fondo[0])
  f.addColorStop(1, t.fondo[1])
  g.fillStyle = f
  g.fillRect(0, 0, ANCHO, ALTO)

  // Foto: rectángulo liso, sin curva ni filo.
  const z = ZONA_FOTO
  g.save()
  g.beginPath()
  g.rect(z.x, z.y, z.w, z.h)
  g.fillStyle = AZUL_OSCURO
  g.fill()
  g.clip()
  if (hayImagen(recursos.foto)) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeEn(recursos.foto, z, zoom, dx, dy)
    g.drawImage(recursos.foto, e.x, e.y, e.w, e.h)
  }
  g.restore()
  if (datos.credito) {
    texto(g, `FOTO: ${datos.credito.toUpperCase()}`, 30, 1150, `600 14px ${TEXTO}`, 'rgba(255,255,255,0.85)', 'left', '0.5px')
  }
}

// Etiqueta de sección ("EL DATO", "RÁNKING"…), en coordenadas del panel.
// Centrada y sin raya, o a la izquierda con una raya hasta el borde.
function seccion(g, datos, y, centrada) {
  const t = temaDe(datos)
  if (!datos.seccion) return
  const s = datos.seccion.toUpperCase()
  g.font = `700 19px ${TEXTO}`
  const w = g.measureText(s).width
  const x = centrada ? PANEL / 2 - (46 + w) / 2 : M
  g.fillStyle = AMARILLO
  g.fillRect(x, y - 13, 30, 9)
  texto(g, s, x + 46, y, `700 19px ${TEXTO}`, t.tinta, 'left', '0.5px')
  if (centrada) return
  g.fillStyle = t.raya
  g.fillRect(x + 46 + w + 20, y - 11, PANEL - M - (x + 46 + w + 20), 5)
}

/**
 * Fila con el escudo en su recuadro, el texto y un valor grande (la usan
 * "Por partido" y "Ránking equipos"). Con alto distinto de 74 se escala todo.
 * f: { x, y, ancho, alto, escudo, texto, valor, vacia, destacada, colorValor, gris }
 */
export function filaEscudo(g, f) {
  const { x, y, ancho, alto = 74 } = f
  const k = alto / 74
  const vacia = f.vacia
  const color = vacia ? f.gris : f.destacada ? AMARILLO : AZUL
  const transparente = vacia ? 'rgba(185,195,211,0)' : f.destacada ? 'rgba(255,213,0,0)' : 'rgba(0,69,191,0)'
  // Barra que se desvanece hacia la derecha.
  const grad = g.createLinearGradient(x, 0, x + ancho, 0)
  grad.addColorStop(0, color)
  grad.addColorStop(0.62, color)
  grad.addColorStop(1, transparente)
  g.fillStyle = grad
  g.beginPath()
  g.roundRect(x, y, ancho, alto, 8 * k)
  g.fill()
  // Recuadro del escudo, más oscuro.
  g.fillStyle = vacia ? 'rgba(0,0,0,0.18)' : AZUL_OSCURO
  g.beginPath()
  g.roundRect(x, y, alto, alto, [8 * k, 0, 0, 8 * k])
  g.fill()
  imagen(g, f.escudo, x + alto / 2, y + alto / 2, alto * 0.72)
  const tx = (f.texto || '').toUpperCase()
  const tf = ajustar(g, tx, n => `700 ${n}px ${TEXTO}`, Math.round(26 * k), ancho - alto - 140 * k, 15)
  texto(g, tx, x + alto + 16 * k, y + alto / 2 + tf * 0.36, `700 ${tf}px ${TEXTO}`, f.destacada && !vacia ? AZUL_OSCURO : '#ffffff', 'left', '-0.3px')
  if (f.valor !== '' && f.valor != null) {
    texto(g, String(f.valor), x + ancho + 6 * k, y + alto - 2 * k, `700 ${Math.round(92 * k)}px ${TITULOS}`, vacia ? f.gris : f.colorValor, 'right', '1px')
  }
}

function nota(g, datos, y) {
  if (!datos.nota) return
  const t = temaDe(datos)
  g.font = `500 26px ${TEXTO}`
  partir(g, datos.nota, PANEL - 2 * M).slice(0, 3)
    .forEach((l, i) => texto(g, l, PANEL / 2, y + i * 34, `500 26px ${TEXTO}`, t.tinta, 'center'))
}

/**
 * Por partido.
 * datos: { tema, titulo, subtitulo, filas: [{ texto, valor, vacia }], seccion, nota, credito, ajusteFoto }
 * recursos: { foto, logo, escudos: [img por fila] }
 */
export function dibujarGraficoPorPartido(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  const t = temaDe(datos)
  marco(g, datos, recursos)
  g.translate(X_DATO, 0) // todo lo demás, en coordenadas del panel

  const titulo = (datos.titulo || '').toUpperCase()
  const tt = ajustar(g, titulo, n => `700 ${n}px ${TITULOS}`, 130, PANEL - 2 * M, 60)
  texto(g, titulo, M, 230, `700 ${tt}px ${TITULOS}`, t.titulo, 'left', '1px')
  // El subtítulo, centrado bajo el título.
  if (datos.subtitulo) {
    g.font = `700 ${tt}px ${TITULOS}`
    const centro = M + g.measureText(titulo).width / 2
    const ts = ajustar(g, datos.subtitulo.toUpperCase(), n => `500 ${n}px ${TEXTO}`, 30, PANEL - 2 * M, 18)
    texto(g, datos.subtitulo.toUpperCase(), centro, 280, `500 ${ts}px ${TEXTO}`, t.tinta, 'center', '-0.5px')
  }

  const filas = (datos.filas || []).filter(f => f.texto || f.valor).slice(0, 8)
  const alto = 74, hueco = 14
  filas.forEach((f, i) => filaEscudo(g, {
    x: M, y: 318 + i * (alto + hueco), ancho: PANEL - M - 40, alto,
    escudo: recursos.escudos?.[i], texto: f.texto, valor: f.valor, vacia: f.vacia, colorValor: t.titulo, gris: t.gris,
  }))

  const fin = 318 + Math.max(filas.length, 1) * (alto + hueco)
  logoRz(g, logoDe(datos, recursos.logo), PANEL / 2 - 85, Math.min(fin + 14, 1060), 170, datos.tema === 'azul')
  seccion(g, datos, 1172, false)
  nota(g, datos, 1240)
  g.restore()
}

/**
 * El dato.
 * datos: { tema, numero, etiqueta, texto, seccion, nota, credito, ajusteFoto }
 * recursos: { foto, logo }
 */
export function dibujarGraficoDato(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  const t = temaDe(datos)
  marco(g, datos, recursos)
  g.translate(X_DATO, 0) // todo lo demás, en coordenadas del panel
  const cx = PANEL / 2

  logoRz(g, logoDe(datos, recursos.logo), cx - 90, 120, 180, datos.tema === 'azul')

  // Número enorme.
  const numero = String(datos.numero ?? '')
  const tn = ajustar(g, numero, n => `700 ${n}px ${TITULOS}`, 400, PANEL - 2 * M, 120)
  texto(g, numero, cx, 600, `700 ${tn}px ${TITULOS}`, t.titulo, 'center', '2px')

  // Etiqueta en dos líneas lo más iguales posible.
  const etiqueta = (datos.etiqueta || '').toUpperCase()
  const palabras = etiqueta.split(/\s+/).filter(Boolean)
  g.font = `700 140px ${TITULOS}`
  let lineas = etiqueta ? [etiqueta] : []
  if (palabras.length > 1) {
    let mejor = Infinity
    for (let i = 1; i < palabras.length; i++) {
      const par = [palabras.slice(0, i).join(' '), palabras.slice(i).join(' ')]
      const w = Math.max(...par.map(l => g.measureText(l).width))
      if (w < mejor) { mejor = w; lineas = par }
    }
    if (g.measureText(etiqueta).width <= PANEL - 2 * M) lineas = [etiqueta]
  }
  const te = Math.min(...lineas.map(l => ajustar(g, l, n => `700 ${n}px ${TITULOS}`, 140, PANEL - 2 * M, 60)), 140)
  g.font = `700 ${te}px ${TITULOS}`
  const mayus = g.measureText('A').actualBoundingBoxAscent
  let y = 620 + mayus + 18
  lineas.forEach(l => { texto(g, l, cx, y, `700 ${te}px ${TITULOS}`, t.titulo, 'center', '1px'); y += mayus + 12 })

  // Texto con **negritas**, centrado.
  if (datos.texto) {
    const tam = 30
    const { lineas: ls, espacio, fuente } = lineasRicas(g, datos.texto, PANEL - 2 * M, tam)
    let yy = y + 36
    ls.slice(0, 6).forEach(l => {
      let x = cx - l.w / 2
      l.palabras.forEach(p => { texto(g, p.p, x, yy, fuente(p.negrita), t.tinta); x += p.a + espacio })
      yy += 42
    })
  }

  seccion(g, datos, 1172, true)
  nota(g, datos, 1240)
  g.restore()
}
