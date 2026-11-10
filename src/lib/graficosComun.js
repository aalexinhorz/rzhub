// Utilidades compartidas por las plantillas de /redaccion-graficos.
import { ESCUDO_ZARAGOZA, getEscudo } from './escudos'

// El escudo del Real Zaragoza no está en ESCUDOS_CLUBS (va en su propia
// constante). Todos son locales (/escudos), así el canvas se puede exportar.
export const escudoDe = nombre => {
  const limpio = (nombre || '').replace(/["“”]/g, '').trim()
  return limpio === 'Real Zaragoza' ? ESCUDO_ZARAGOZA : getEscudo(nombre) || getEscudo(limpio)
}

export function cargarImagen(src) {
  return new Promise(resolve => {
    if (!src) { resolve(null); return }
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export const slug = t => (t || 'grafico').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

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
