// Utilidades compartidas por las plantillas de /redaccion-graficos.
import { ESCUDO_ZARAGOZA, getEscudo } from './escudos'

// El escudo del Real Zaragoza no está en ESCUDOS_CLUBS (va en su propia
// constante). Todos son locales (/escudos), así el canvas se puede exportar.
export const escudoDe = nombre => {
  const limpio = (nombre || '').replace(/["“”]/g, '').trim()
  return limpio === 'Real Zaragoza' ? ESCUDO_ZARAGOZA : getEscudo(nombre) || getEscudo(limpio)
}

// cors: para imágenes de otro dominio (Supabase Storage…); sin eso el
// canvas no se podría exportar. Si el servidor no lo permite, devuelve null.
export function cargarImagen(src, { cors = false } = {}) {
  return new Promise(resolve => {
    if (!src) { resolve(null); return }
    const img = new Image()
    if (cors) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export const slug = t => (t || 'grafico').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

// Los gráficos se diseñan a 1080×1350 pero el canvas tiene el doble de
// píxeles (2160×2700): el PNG exportado sale con texto, escudos y logos
// mucho más nítidos (Instagram y compañía lo reducen bien al subirlo).
export const ESCALA = 2
export function contextoGrafico(canvas) {
  const g = canvas.getContext('2d')
  g.setTransform(ESCALA, 0, 0, ESCALA, 0, 0)
  return g
}

const aBlob = canvas => new Promise(resolve => canvas.toBlob(resolve, 'image/png'))

export async function descargarCanvas(canvas, nombreArchivo) {
  const url = URL.createObjectURL(await aBlob(canvas))
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// Menú de compartir del sistema (en el móvil: guardar en Fotos, Instagram…).
// Devuelve false si el navegador no deja y se ha descargado en su lugar.
export async function compartirCanvas(canvas, nombreArchivo) {
  const archivo = new File([await aBlob(canvas)], nombreArchivo, { type: 'image/png' })
  if (!navigator.canShare?.({ files: [archivo] })) {
    await descargarCanvas(canvas, nombreArchivo)
    return false
  }
  try { await navigator.share({ files: [archivo] }) } catch { /* cancelado */ }
  return true
}

// Ajuste "cover" de una foto en una zona { x, y, w, h } del gráfico, con el
// zoom y el desplazamiento del usuario, sin dejar huecos.
export function encajeEn(foto, zona, zoom = 1, dx = 0, dy = 0) {
  const s = Math.max(zona.w / foto.naturalWidth, zona.h / foto.naturalHeight) * zoom
  const w = foto.naturalWidth * s
  const h = foto.naturalHeight * s
  const x = Math.min(zona.x, Math.max(zona.x + zona.w - w, zona.x + (zona.w - w) / 2 + dx))
  const y = Math.min(zona.y, Math.max(zona.y + zona.h - h, zona.y + (zona.h - h) / 2 + dy))
  return { x, y, w, h }
}

// Desplazamiento ya recortado a los bordes (para guardarlo tras arrastrar).
export function desplazamientoValido(foto, zona, zoom, dx, dy) {
  const e = encajeEn(foto, zona, zoom, dx, dy)
  return { zoom, dx: e.x - zona.x - (zona.w - e.w) / 2, dy: e.y - zona.y - (zona.h - e.h) / 2 }
}

// Las fotos de otras webs (FotMob, Transfermarkt…) no traen CORS: se piden a
// través de la función imagen-proxy de Supabase para poder exportar el canvas.
const PROXY = 'https://gqslryreaiqmvnyyhwzf.supabase.co/functions/v1/imagen-proxy?url='
export function urlParaCanvas(url) {
  if (!url) return null
  try {
    const host = new URL(url, window.location.href).hostname
    if (host === window.location.hostname || host.endsWith('.supabase.co')) return url
  } catch { return null }
  return PROXY + encodeURIComponent(url)
}
