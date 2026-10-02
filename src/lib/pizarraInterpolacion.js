// Interpolación entre dos instantáneas de la Pizarra — compartida por
// la reproducción en pantalla (usePizarraPlayback.js) y la grabación
// de vídeo (pizarraVideo.js), para que ambas se muevan exactamente
// igual.

export const DURACION_TRANSICION_MS = 1200

function lerp(a, b, t) { return a + (b - a) * t }

const lerpPunto = (d, h, t) => ({ x: lerp(d.x, h.x, t), y: lerp(d.y, h.y, t) })
const lerpFlecha = (d, h, t) => ({
  x1: lerp(d.x1, h.x1, t), y1: lerp(d.y1, h.y1, t),
  x2: lerp(d.x2, h.x2, t), y2: lerp(d.y2, h.y2, t),
})

// Empareja dos listas por `id` (no cambia al mover un elemento, solo al
// crearlo/quitarlo): los que existen en ambas se interpolan con
// `lerpCampos`, los que solo están en "desde" se quedan quietos
// mientras se desvanecen, y los que solo están en "hasta" aparecen ya
// en su sitio desvaneciéndose hacia dentro. Usado para fichas, fichas
// de oposición y flechas — balón se trata aparte porque es un único
// objeto, no una lista.
function interpolarListaPorId(listaDesde, listaHasta, t, lerpCampos) {
  const porId = new Map()
  listaDesde.forEach(item => porId.set(item.id, { desde: item, hasta: null }))
  listaHasta.forEach(item => {
    const actual = porId.get(item.id)
    if (actual) actual.hasta = item
    else porId.set(item.id, { desde: null, hasta: item })
  })

  return [...porId.values()].map(({ desde: d, hasta: h }) => {
    if (d && h) return { ...h, ...lerpCampos(d, h, t), opacity: 1 }
    if (d && !h) return { ...d, opacity: 1 - t }
    return { ...h, opacity: t }
  })
}

export function interpolarInstantaneas(desde, hasta, t) {
  const fichas = interpolarListaPorId(desde.fichas, hasta.fichas, t, lerpPunto)
  const oposicion = interpolarListaPorId(desde.oposicion || [], hasta.oposicion || [], t, lerpPunto)
  const flechas = interpolarListaPorId(desde.flechas || [], hasta.flechas || [], t, lerpFlecha)

  let balon = null
  if (desde.balon && hasta.balon) {
    balon = { ...lerpPunto(desde.balon, hasta.balon, t), opacity: 1 }
  } else if (desde.balon && !hasta.balon) {
    balon = { ...desde.balon, opacity: 1 - t }
  } else if (!desde.balon && hasta.balon) {
    balon = { ...hasta.balon, opacity: t }
  }

  return { fichas, oposicion, flechas, balon }
}
