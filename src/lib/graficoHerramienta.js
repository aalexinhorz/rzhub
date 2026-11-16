// "Herramienta" para redes (1080×1350, 4:5): presenta una herramienta de la
// web (nueva o no). Icono, nombre en grande, descripción, hasta 3 puntos y
// una captura dentro de un marco de navegador o de móvil (opcional), con la
// dirección para entrar.

import { encajeEn } from './graficosComun'
import { AMARILLO, AZUL_OSCURO, TEXTO, TITULOS, ajustar, fondoAzul, hayImagen, logoRz, partir, texto } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
const M = 60
const ESPACIADO_CTA = '0.3px' // el botón de "Entra en…", con las letras juntas

// Dónde va la captura en cada formato (la parte "pantalla" del marco).
const NAVEGADOR = { x: M, y: 720, w: ANCHO - 2 * M, h: 470, barra: 46 }
const MOVIL = { x: 640, y: 560, w: 380, h: 740, borde: 14 }
export function zonaCaptura(formato) {
  if (formato === 'movil') {
    const m = MOVIL
    return { x: m.x + m.borde, y: m.y + m.borde, w: m.w - 2 * m.borde, h: m.h - 2 * m.borde }
  }
  const n = NAVEGADOR
  return { x: n.x, y: n.y + n.barra, w: n.w, h: n.h - n.barra }
}

function anchoPastilla(g, t, alto, espaciado = '3px') {
  g.font = `700 ${Math.round(alto * 0.46)}px ${TEXTO}`
  if ('letterSpacing' in g) g.letterSpacing = espaciado
  const w = g.measureText(t).width + alto * 1.1
  if ('letterSpacing' in g) g.letterSpacing = '0px'
  return w
}

function pastilla(g, t, x, y, alto, fondo, tinta, espaciado = '3px') {
  const fuente = `700 ${Math.round(alto * 0.46)}px ${TEXTO}`
  const w = anchoPastilla(g, t, alto, espaciado)
  g.fillStyle = fondo
  g.beginPath()
  g.roundRect(x, y, w, alto, alto / 2)
  g.fill()
  texto(g, t, x + w / 2 + 1.5, y + alto * 0.67, fuente, tinta, 'center', espaciado)
  return w
}

function captura(g, foto, zona, ajuste) {
  g.save()
  g.beginPath()
  g.rect(zona.x, zona.y, zona.w, zona.h)
  g.clip()
  g.fillStyle = '#0a1730'
  g.fillRect(zona.x, zona.y, zona.w, zona.h)
  if (hayImagen(foto)) {
    const { zoom = 1, dx = 0, dy = 0 } = ajuste || {}
    const e = encajeEn(foto, zona, zoom, dx, dy)
    g.drawImage(foto, e.x, e.y, e.w, e.h)
  }
  g.restore()
}

function marcoNavegador(g, foto, datos) {
  const n = NAVEGADOR
  g.save()
  g.shadowColor = 'rgba(0,0,0,0.45)'
  g.shadowBlur = 40
  g.shadowOffsetY = 16
  g.beginPath()
  g.roundRect(n.x, n.y, n.w, n.h, 22)
  g.fillStyle = '#0a1730'
  g.fill()
  g.restore()
  g.save()
  g.beginPath()
  g.roundRect(n.x, n.y, n.w, n.h, 22)
  g.clip()
  captura(g, foto, zonaCaptura('navegador'), datos.ajusteFoto)
  g.fillStyle = '#e9eef7'
  g.fillRect(n.x, n.y, n.w, n.barra)
  g.restore()
  ;['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
    g.fillStyle = c
    g.beginPath()
    g.arc(n.x + 30 + i * 22, n.y + n.barra / 2, 7, 0, Math.PI * 2)
    g.fill()
  })
  const url = datos.url || 'rzhub.es'
  g.fillStyle = '#ffffff'
  g.beginPath()
  g.roundRect(n.x + 110, n.y + 9, n.w - 220, n.barra - 18, 14)
  g.fill()
  texto(g, url, n.x + n.w / 2, n.y + n.barra / 2 + 6, `600 17px ${TEXTO}`, '#40506e', 'center')
}

function marcoMovil(g, foto, datos) {
  const m = MOVIL
  g.save()
  g.shadowColor = 'rgba(0,0,0,0.5)'
  g.shadowBlur = 44
  g.shadowOffsetY = 18
  g.beginPath()
  g.roundRect(m.x, m.y, m.w, m.h, 52)
  g.fillStyle = '#05080f'
  g.fill()
  g.restore()
  const z = zonaCaptura('movil')
  g.save()
  g.beginPath()
  g.roundRect(z.x, z.y, z.w, z.h, 40)
  g.clip()
  captura(g, foto, z, datos.ajusteFoto)
  g.restore()
  // Isla de la cámara.
  g.fillStyle = '#05080f'
  g.beginPath()
  g.roundRect(m.x + m.w / 2 - 60, m.y + m.borde + 12, 120, 32, 16)
  g.fill()
}

// Puntos con un check amarillo; devuelve dónde acaba.
function puntos(g, lista, x, y, ancho, tam) {
  let yy = y
  for (const p of lista) {
    g.fillStyle = AMARILLO
    g.beginPath()
    g.arc(x + tam * 0.5, yy - tam * 0.32, tam * 0.5, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = AZUL_OSCURO
    g.lineWidth = tam * 0.12
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.beginPath()
    g.moveTo(x + tam * 0.27, yy - tam * 0.33)
    g.lineTo(x + tam * 0.44, yy - tam * 0.16)
    g.lineTo(x + tam * 0.74, yy - tam * 0.5)
    g.stroke()
    g.font = `600 ${tam}px ${TEXTO}`
    const lineas = partir(g, p, ancho - tam * 1.6)
    lineas.forEach((l, i) => texto(g, l, x + tam * 1.6, yy + i * tam * 1.3, `600 ${tam}px ${TEXTO}`, '#ffffff'))
    yy += lineas.length * tam * 1.3 + tam * 0.9
  }
  return yy
}

/**
 * datos: { formato: 'navegador' | 'movil' | 'sin', pastilla, titulo, descripcion, puntos: [], url, ajusteFoto }
 * recursos: { logo, icono, foto }
 */
export function dibujarGraficoHerramienta(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  fondoAzul(g, ANCHO, ALTO)
  const luz = g.createRadialGradient(ANCHO * 0.75, 300, 40, ANCHO * 0.75, 300, 700)
  luz.addColorStop(0, 'rgba(0,69,191,0.5)')
  luz.addColorStop(1, 'rgba(0,69,191,0)')
  g.fillStyle = luz
  g.fillRect(0, 0, ANCHO, ALTO)

  logoRz(g, recursos.logo, M, 52, 150, true)
  if (datos.pastilla) {
    const t = datos.pastilla.toUpperCase()
    pastilla(g, t, ANCHO - M - anchoPastilla(g, t, 48), 64, 48, AMARILLO, AZUL_OSCURO)
  }

  const formato = datos.formato || 'navegador'
  const movil = formato === 'movil'
  const anchoTexto = movil ? MOVIL.x - M - 40 : ANCHO - 2 * M

  // Icono en su casilla y nombre en grande.
  const yIcono = 190
  const ladoIcono = 112
  g.fillStyle = 'rgba(255,255,255,0.08)'
  g.beginPath()
  g.roundRect(M, yIcono, ladoIcono, ladoIcono, 28)
  g.fill()
  g.strokeStyle = 'rgba(255,213,0,0.35)'
  g.lineWidth = 2
  g.stroke()
  if (hayImagen(recursos.icono)) g.drawImage(recursos.icono, M + 26, yIcono + 26, ladoIcono - 52, ladoIcono - 52)

  const titulo = (datos.titulo || '').toUpperCase()
  const tt = ajustar(g, titulo, n => `700 ${n}px ${TITULOS}`, movil ? 170 : 210, anchoTexto, 80)
  const yTitulo = yIcono + ladoIcono + 20 + tt * 0.78
  texto(g, titulo, M, yTitulo, `700 ${tt}px ${TITULOS}`, AMARILLO, 'left', '2px')

  // Descripción.
  let y = yTitulo + 56
  if (datos.descripcion) {
    const td = movil ? 28 : 30
    g.font = `500 ${td}px ${TEXTO}`
    // Con el navegador, dos líneas como mucho para que no choque con el marco.
    const lineas = partir(g, datos.descripcion, anchoTexto).slice(0, movil ? 5 : formato === 'navegador' ? 2 : 3)
    lineas.forEach((l, i) => texto(g, l, M, y + i * td * 1.35, `500 ${td}px ${TEXTO}`, 'rgba(255,255,255,0.88)'))
    y += lineas.length * td * 1.35 + 30
  }

  const lista = (datos.puntos || []).map(p => p.trim()).filter(Boolean).slice(0, 3)
  const url = datos.url || 'rzhub.es'
  const cta = `Entra en ${url}`

  if (formato === 'navegador') {
    if (lista.length) {
      // Puntos en fila, encima del navegador: dos líneas como mucho cada
      // uno (si no caben, letra más pequeña).
      const anchoPunto = (ANCHO - 2 * M - (lista.length - 1) * 24) / lista.length
      let tam = 24
      for (; tam > 17; tam--) {
        g.font = `600 ${tam}px ${TEXTO}`
        if (lista.every(p => partir(g, p, anchoPunto - tam * 1.6).length <= 2)) break
      }
      lista.forEach((p, i) => puntos(g, [p], M + i * (anchoPunto + 24), Math.max(y + 10, 640), anchoPunto, tam))
    }
    marcoNavegador(g, recursos.foto, datos)
    pastilla(g, cta, ANCHO / 2 - anchoPastilla(g, cta, 62, ESPACIADO_CTA) / 2, 1222, 62, AMARILLO, AZUL_OSCURO, ESPACIADO_CTA)
  } else if (movil) {
    let yy = Math.max(y, 640)
    if (lista.length) yy = puntos(g, lista, M, yy + 20, anchoTexto, 28)
    marcoMovil(g, recursos.foto, datos)
    pastilla(g, cta, M, Math.min(Math.max(yy + 10, 1120), 1230), 62, AMARILLO, AZUL_OSCURO, ESPACIADO_CTA)
  } else {
    // Sin captura: los puntos como tarjetas.
    let yy = Math.max(y, 700)
    for (const p of lista) {
      g.font = `600 30px ${TEXTO}`
      const lineas = partir(g, p, ANCHO - 2 * M - 120)
      const h = 50 + lineas.length * 40
      g.fillStyle = 'rgba(255,255,255,0.07)'
      g.beginPath()
      g.roundRect(M, yy, ANCHO - 2 * M, h, 22)
      g.fill()
      puntos(g, [p], M + 30, yy + 58, ANCHO - 2 * M - 60, 30)
      yy += h + 18
    }
    pastilla(g, cta, M, Math.min(Math.max(yy + 20, 1080), 1230), 62, AMARILLO, AZUL_OSCURO, ESPACIADO_CTA)
  }

  if (!movil) texto(g, 'rzhub.es', ANCHO - M, 1310, `700 19px ${TEXTO}`, 'rgba(255,255,255,0.75)', 'right', '1px')
  g.restore()
}

