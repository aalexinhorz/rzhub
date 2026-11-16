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

/** Color más oscuro (mezclado con negro) para degradados. */
export function oscurecer(color, cuanto = 0.35) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color || '')
  if (!m) return color
  return `#${[m[1], m[2], m[3]].map(x => Math.round(parseInt(x, 16) * (1 - cuanto)).toString(16).padStart(2, '0')).join('')}`
}

// Color de un equipo para cajas y columnas: como colorDeEscudo, pero sin
// los dorados y amarillos (las coronas de tantos escudos españoles se
// llevaban el color: el Murcia salía dorado en vez de rojo). Si el escudo
// solo tiene dorado, se usa ese.
export function colorEquipo(img) {
  try {
    const c = document.createElement('canvas')
    c.width = 48
    c.height = 48
    const g = c.getContext('2d', { willReadFrequently: true })
    g.drawImage(img, 0, 0, 48, 48)
    const { data } = g.getImageData(0, 0, 48, 48)
    const cubos = new Map()
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]; const gr = data[i + 1]; const b = data[i + 2]
      if (data[i + 3] < 200) continue
      const max = Math.max(r, gr, b)
      const min = Math.min(r, gr, b)
      if (max - min < 50) continue // blancos, negros y grises
      // Tono: dorado/amarillo entre ~35º y ~65º.
      const d = max - min
      let h = max === r ? ((gr - b) / d) % 6 : max === gr ? (b - r) / d + 2 : (r - gr) / d + 4
      h = (h * 60 + 360) % 360
      if (h >= 35 && h <= 65) continue
      const clave = `${r >> 5},${gr >> 5},${b >> 5}`
      const cubo = cubos.get(clave) || { n: 0, r: 0, g: 0, b: 0 }
      cubo.n++; cubo.r += r; cubo.g += gr; cubo.b += b
      cubos.set(clave, cubo)
    }
    let mejor = null
    for (const cubo of cubos.values()) if (!mejor || cubo.n > mejor.n) mejor = cubo
    if (!mejor || mejor.n < 25) return colorDeEscudo(img)
    const hex = v => Math.round(v).toString(16).padStart(2, '0')
    return `#${hex(mejor.r / mejor.n)}${hex(mejor.g / mejor.n)}${hex(mejor.b / mejor.n)}`
  } catch {
    return null
  }
}
