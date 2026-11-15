// "Portada" para redes (1080×1350, 4:5): un título enorme (CONVOCADOS,
// FICHAJES…), un subtítulo y, abajo, un panel con la foto de fondo y los
// recortes de jugadores (PNG sin fondo) que asoman por encima del panel.
// Dos temas: claro (fondo blanco, título azul) y azul (título amarillo).

import { encajeEn } from './graficosComun'
import { AMARILLO, AZUL, AZUL_OSCURO, TEXTO, TITULOS, ajustar, hayImagen, logoRz, texto } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
const Y_PANEL = 490
export const ZONA_FOTO = { x: 0, y: Y_PANEL, w: ANCHO, h: ALTO - Y_PANEL }
export const MAX_RECORTES = 5

const TEMAS = {
  claro: { fondo: ['#ffffff', '#e9eef7'], titulo: AZUL, subtitulo: AZUL_OSCURO },
  azul: { fondo: ['#002261', AZUL_OSCURO], titulo: AMARILLO, subtitulo: '#ffffff' },
}

// Recorte con la parte de abajo fundida a transparente, para que no se vea
// el corte recto si se sube. Se guarda solo el último tamaño de cada imagen.
const fundidos = new WeakMap()
function recorteFundido(img, w, h) {
  const previo = fundidos.get(img)
  if (previo && previo.width === w && previo.height === h) return previo
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const x = c.getContext('2d')
  x.imageSmoothingQuality = 'high'
  x.drawImage(img, 0, 0, w, h)
  x.globalCompositeOperation = 'destination-in'
  const m = x.createLinearGradient(0, h * 0.78, 0, h)
  m.addColorStop(0, '#000')
  m.addColorStop(1, 'rgba(0,0,0,0)')
  x.fillStyle = m
  x.fillRect(0, 0, w, h) // por encima del 78 % el degradado se queda en opaco
  fundidos.set(img, c)
  return c
}

/** Rectángulo que ocupa un recorte en el gráfico (para dibujarlo y para arrastrarlo). */
export function cajaRecorte(r) {
  const w = r.alto * r.img.naturalWidth / r.img.naturalHeight
  return { x: r.x - w / 2, y: r.yBase - r.alto, w, h: r.alto }
}

/** Posiciones de partida de n recortes: repartidos a lo ancho y apoyados abajo. */
export function colocarRecortes(n) {
  const paso = n > 1 ? Math.min(250, 820 / (n - 1)) : 0
  const x0 = ANCHO / 2 - paso * (n - 1) / 2
  return Array.from({ length: n }, (_, i) => ({ x: x0 + paso * i, yBase: ALTO + 10, alto: n > 3 ? 820 : 880 }))
}

/**
 * datos: { tema, pastilla, titulo, subtitulo, credito, ajusteFoto }
 * recursos: { foto, logo, recortes: [{ img, x, yBase, alto }] }
 */
export function dibujarGraficoPortada(g, datos, recursos) {
  const tema = TEMAS[datos.tema] || TEMAS.claro
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'

  // Fondo.
  const f = g.createLinearGradient(0, 0, 0, Y_PANEL)
  f.addColorStop(0, tema.fondo[0])
  f.addColorStop(1, tema.fondo[1])
  g.fillStyle = f
  g.fillRect(0, 0, ANCHO, ALTO)

  // Pastilla, título y subtítulo.
  const titulo = (datos.titulo || '').toUpperCase()
  const t = titulo ? ajustar(g, titulo, n => `700 ${n}px ${TITULOS}`, 360, ANCHO - 100, 120) : 0
  const yTitulo = 382
  if (datos.pastilla) {
    const p = datos.pastilla.toUpperCase()
    const fuente = `700 22px ${TEXTO}`
    g.font = fuente
    if ('letterSpacing' in g) g.letterSpacing = '3px'
    const w = g.measureText(p).width + 44
    if ('letterSpacing' in g) g.letterSpacing = '0px'
    g.font = `700 ${t}px ${TITULOS}`
    const alto = titulo ? g.measureText(titulo).actualBoundingBoxAscent : 0
    const yP = titulo ? yTitulo - alto - 30 - 46 : 60
    g.fillStyle = AMARILLO
    g.beginPath()
    g.roundRect(ANCHO / 2 - w / 2, yP, w, 46, 23)
    g.fill()
    texto(g, p, ANCHO / 2 + 1.5, yP + 31, fuente, AZUL_OSCURO, 'center', '3px')
  }
  if (titulo) texto(g, titulo, ANCHO / 2, yTitulo, `700 ${t}px ${TITULOS}`, tema.titulo, 'center', '2px')
  if (datos.subtitulo) {
    const s = datos.subtitulo.toUpperCase()
    const ts = ajustar(g, s, n => `700 ${n}px ${TEXTO}`, 42, ANCHO - 120, 20)
    texto(g, s, ANCHO / 2, yTitulo + 66, `700 ${ts}px ${TEXTO}`, tema.subtitulo, 'center', '-0.5px')
  }

  // Panel de la foto: esquina de arriba a la izquierda muy redondeada y
  // un filo amarillo encima.
  const z = ZONA_FOTO
  const radio = [120, 0, 0, 0]
  g.save()
  g.beginPath()
  g.roundRect(z.x, z.y, z.w + 20, z.h + 20, radio)
  g.fillStyle = AZUL_OSCURO
  g.fill()
  g.clip()
  if (hayImagen(recursos.foto)) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeEn(recursos.foto, z, zoom, dx, dy)
    g.drawImage(recursos.foto, e.x, e.y, e.w, e.h)
  } else {
    const v = g.createLinearGradient(0, z.y, 0, ALTO)
    v.addColorStop(0, AZUL)
    v.addColorStop(1, AZUL_OSCURO)
    g.fillStyle = v
    g.fillRect(z.x, z.y, z.w, z.h)
  }
  g.restore()
  g.save()
  g.beginPath()
  g.roundRect(z.x, z.y, z.w + 20, z.h + 20, radio)
  g.strokeStyle = AMARILLO
  g.lineWidth = 10
  g.stroke()
  g.restore()

  // Recortes de jugadores: pueden salirse del panel por arriba.
  for (const r of recursos.recortes || []) {
    if (!hayImagen(r.img)) continue
    const c = cajaRecorte(r)
    g.save()
    g.shadowColor = 'rgba(0,0,0,0.35)'
    g.shadowBlur = 40
    g.shadowOffsetY = 10
    const k = g.getTransform().a
    g.drawImage(recorteFundido(r.img, Math.max(1, Math.round(c.w * k)), Math.max(1, Math.round(c.h * k))), c.x, c.y, c.w, c.h)
    g.restore()
  }

  // Fundido abajo para que los cortes de los recortes no se vean y el logo
  // se lea.
  const abajo = g.createLinearGradient(0, ALTO - 300, 0, ALTO)
  abajo.addColorStop(0, 'rgba(1,25,71,0)')
  abajo.addColorStop(0.65, 'rgba(1,25,71,0.75)')
  abajo.addColorStop(1, 'rgba(1,25,71,0.95)')
  g.fillStyle = abajo
  g.fillRect(0, ALTO - 300, ANCHO, 300)

  logoRz(g, recursos.logo, ANCHO / 2 - 95, ALTO - 118, 190, true)
  if (datos.credito) {
    g.save()
    g.translate(ANCHO - 24, ALTO - 30)
    g.rotate(-Math.PI / 2)
    texto(g, datos.credito.toUpperCase(), 0, 0, `600 14px ${TEXTO}`, 'rgba(255,255,255,0.85)', 'left', '1px')
    g.restore()
  }
  g.restore()
}
