// Color dominante de un escudo (sin blancos ni grises), para fondos y
// equipaciones que tienen que ir a juego con el club. Lo usan Cabezones y
// la herramienta de gráficos de Redacción.

// Los escudos están en /escudos (mismo origen): se pueden leer los píxeles.
export function colorDeEscudo(img) {
  try {
    const c = document.createElement('canvas')
    c.width = 40
    c.height = 40
    const g = c.getContext('2d', { willReadFrequently: true })
    g.drawImage(img, 0, 0, 40, 40)
    const { data } = g.getImageData(0, 0, 40, 40)
    const cubos = new Map()
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]; const gr = data[i + 1]; const b = data[i + 2]
      if (data[i + 3] < 200) continue
      const max = Math.max(r, gr, b)
      const min = Math.min(r, gr, b)
      if (max > 215 && min > 190) continue
      if (max - min < 28 && max > 60) continue
      const clave = `${r >> 5},${gr >> 5},${b >> 5}`
      const cubo = cubos.get(clave) || { n: 0, r: 0, g: 0, b: 0 }
      cubo.n++; cubo.r += r; cubo.g += gr; cubo.b += b
      cubos.set(clave, cubo)
    }
    let mejor = null
    for (const cubo of cubos.values()) if (!mejor || cubo.n > mejor.n) mejor = cubo
    if (!mejor || mejor.n < 20) return null
    const hex = v => Math.round(v).toString(16).padStart(2, '0')
    return `#${hex(mejor.r / mejor.n)}${hex(mejor.g / mejor.n)}${hex(mejor.b / mejor.n)}`
  } catch {
    return null
  }
}
