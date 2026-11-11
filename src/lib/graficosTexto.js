// Utilidades de texto e imagen para dibujar las plantillas de
// /redaccion-graficos en canvas.

export function texto(g, t, x, y, fuente, color, alinear = 'left', espaciado = '0px') {
  g.font = fuente
  g.fillStyle = color
  g.textAlign = alinear
  if ('letterSpacing' in g) g.letterSpacing = espaciado
  g.fillText(t, x, y)
  if ('letterSpacing' in g) g.letterSpacing = '0px'
}

// Tamaño (de mayor a menor) con el que el texto cabe en el ancho dado.
export function ajustar(g, t, fuente, max, ancho, min = 20) {
  let tam = max
  g.font = fuente(tam)
  while (tam > min && g.measureText(t).width > ancho) { tam -= 2; g.font = fuente(tam) }
  return tam
}

export function partir(g, t, ancho) {
  const lineas = []
  for (const parrafo of String(t || '').split('\n')) {
    let actual = ''
    for (const p of parrafo.split(/\s+/).filter(Boolean)) {
      const prueba = actual ? `${actual} ${p}` : p
      if (g.measureText(prueba).width > ancho && actual) { lineas.push(actual); actual = p } else actual = prueba
    }
    if (actual) lineas.push(actual)
  }
  return lineas
}

// Imagen entera dentro de una caja cuadrada, centrada en (cx, cy).
export function imagen(g, img, cx, cy, caja) {
  if (!img?.complete || !img.naturalWidth) return false
  const s = Math.min(caja / img.naturalWidth, caja / img.naturalHeight)
  g.drawImage(img, cx - img.naturalWidth * s / 2, cy - img.naturalHeight * s / 2, img.naturalWidth * s, img.naturalHeight * s)
  return true
}

export const hayImagen = img => !!(img?.complete && img.naturalWidth)

export function fondoAzul(g, ancho, alto) {
  const f = g.createLinearGradient(0, 0, 0, alto)
  f.addColorStop(0, '#011947')
  f.addColorStop(0.5, '#002261')
  f.addColorStop(1, '#002978')
  g.fillStyle = f
  g.fillRect(0, 0, ancho, alto)
}

export function creditoVertical(g, credito, x, yAbajo) {
  if (!credito) return
  g.save()
  g.translate(x, yAbajo)
  g.rotate(-Math.PI / 2)
  texto(g, credito.toUpperCase(), 0, 0, '600 14px Archivo, sans-serif', 'rgba(255,255,255,0.8)', 'left', '1px')
  g.restore()
}

export function logoRz(g, logo, x, y, w, sombra = false) {
  if (!hayImagen(logo)) return
  g.save()
  if (sombra) { g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 18 }
  g.drawImage(logo, x, y, w, w * logo.naturalHeight / logo.naturalWidth)
  g.restore()
}

export const AMARILLO = '#ffd500'
export const AZUL = '#0045bf'
export const AZUL_OSCURO = '#011947'
export const TITULOS = "Humane, 'Arial Narrow', sans-serif"
export const TEXTO = 'Archivo, sans-serif'
