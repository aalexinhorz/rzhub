// Interpolación entre dos instantáneas de la Pizarra — compartida por
// la reproducción en pantalla (usePizarraPlayback.js) y la grabación
// de vídeo (pizarraVideo.js), para que ambas se muevan exactamente
// igual.

export const DURACION_TRANSICION_MS = 1200

function lerp(a, b, t) { return a + (b - a) * t }

// Las fichas que existen en ambas instantáneas se deslizan en línea
// recta (match por ficha.id, que no cambia al moverla — solo al
// crearla/quitarla), las que solo están en "desde" se quedan quietas
// mientras se desvanecen (se van del tablero), y las que solo están
// en "hasta" aparecen ya en su sitio desvaneciéndose hacia dentro
// (entran al tablero a mitad de la jugada).
export function interpolarInstantaneas(desde, hasta, t) {
  const porId = new Map()
  desde.fichas.forEach(f => porId.set(f.id, { desde: f, hasta: null }))
  hasta.fichas.forEach(f => {
    const actual = porId.get(f.id)
    if (actual) actual.hasta = f
    else porId.set(f.id, { desde: null, hasta: f })
  })

  const fichas = [...porId.values()].map(({ desde: d, hasta: h }) => {
    if (d && h) return { ...h, x: lerp(d.x, h.x, t), y: lerp(d.y, h.y, t), opacity: 1 }
    if (d && !h) return { ...d, opacity: 1 - t }
    return { ...h, opacity: t }
  })

  let balon = null
  if (desde.balon && hasta.balon) {
    balon = { x: lerp(desde.balon.x, hasta.balon.x, t), y: lerp(desde.balon.y, hasta.balon.y, t), opacity: 1 }
  } else if (desde.balon && !hasta.balon) {
    balon = { ...desde.balon, opacity: 1 - t }
  } else if (!desde.balon && hasta.balon) {
    balon = { ...hasta.balon, opacity: t }
  }

  return { fichas, balon }
}
