// Gráfico de noticia para redes (1080×1350, 4:5), con el estilo de las
// otras plantillas de RZ Hub: foto arriba, etiqueta amarilla, titular
// grande (las *palabras entre asteriscos* van en amarillo), entradilla,
// fuente y pie con la web. Lo usa /redaccion-graficos.

export const ANCHO = 1080
export const ALTO = 1350
export const ALTO_FOTO = 760
const M = 48
const AMARILLO = '#ffd500'
const AZUL_OSCURO = '#011947'
const TITULOS = "Humane, 'Arial Narrow', sans-serif"
const TEXTO = 'Archivo, sans-serif'
const LIMITE_TEXTO = 1236 // lo escrito no puede bajar de aquí (pie)

// Ajuste "cover" de la foto en la zona de arriba, con zoom y desplazamiento.
export function encajeFoto(foto, zoom = 1, dx = 0, dy = 0) {
  const base = Math.max(ANCHO / foto.naturalWidth, ALTO_FOTO / foto.naturalHeight)
  const s = base * zoom
  const w = foto.naturalWidth * s
  const h = foto.naturalHeight * s
  const x = Math.min(0, Math.max(ANCHO - w, (ANCHO - w) / 2 + dx))
  const y = Math.min(0, Math.max(ALTO_FOTO - h, (ALTO_FOTO - h) / 2 + dy))
  return { x, y, w, h }
}

// "Johnny *vuelve* con el grupo" -> palabras con su color.
function palabras(texto) {
  const out = []
  let amarillo = false
  for (const trozo of String(texto || '').toUpperCase().split(/(\*)/)) {
    if (trozo === '*') { amarillo = !amarillo; continue }
    for (const p of trozo.split(/\s+/).filter(Boolean)) out.push({ p, amarillo })
  }
  return out
}

function partir(g, items, anchoMax, espacio) {
  const lineas = [[]]
  let ancho = 0
  for (const it of items) {
    const w = g.measureText(it.p).width
    const linea = lineas[lineas.length - 1]
    if (linea.length && ancho + espacio + w > anchoMax) { lineas.push([it]); ancho = w } else { linea.push(it); ancho += (linea.length > 1 ? espacio : 0) + w }
  }
  return lineas.filter(l => l.length)
}

function partirTexto(g, texto, anchoMax) {
  return partir(g, String(texto || '').split(/\s+/).filter(Boolean).map(p => ({ p })), anchoMax, g.measureText(' ').width).map(l => l.map(i => i.p).join(' '))
}

function rayo(g, x, y, h, color) {
  g.fillStyle = color
  g.beginPath()
  g.moveTo(x + h * 0.55, y)
  g.lineTo(x + h * 0.08, y + h * 0.58)
  g.lineTo(x + h * 0.4, y + h * 0.58)
  g.lineTo(x + h * 0.22, y + h)
  g.lineTo(x + h * 0.72, y + h * 0.38)
  g.lineTo(x + h * 0.42, y + h * 0.38)
  g.closePath()
  g.fill()
}

/**
 * datos: { etiqueta, titular, entradilla, fuente, ajusteFoto: { zoom, dx, dy } }
 * recursos: { foto, logo }
 */
export function dibujarGraficoNoticia(g, datos, recursos) {
  g.save()
  g.textBaseline = 'alphabetic'
  g.textAlign = 'left'

  // Fondo y foto.
  const fondo = g.createLinearGradient(0, 0, 0, ALTO)
  fondo.addColorStop(0, AZUL_OSCURO)
  fondo.addColorStop(ALTO_FOTO / ALTO, '#002261')
  fondo.addColorStop(1, '#002978')
  g.fillStyle = fondo
  g.fillRect(0, 0, ANCHO, ALTO)
  const { foto, logo } = recursos
  if (foto?.complete && foto.naturalWidth) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeFoto(foto, zoom, dx, dy)
    g.save()
    g.beginPath()
    g.rect(0, 0, ANCHO, ALTO_FOTO)
    g.clip()
    g.drawImage(foto, e.x, e.y, e.w, e.h)
    g.restore()
  }
  // Fundido de la foto al azul y oscurecido arriba para el logo.
  const fundido = g.createLinearGradient(0, ALTO_FOTO * 0.55, 0, ALTO_FOTO)
  // Termina justo en el color que tiene el fondo a esa altura (sin corte).
  fundido.addColorStop(0, 'rgba(0,34,97,0)')
  fundido.addColorStop(1, 'rgba(0,34,97,1)')
  g.fillStyle = fundido
  g.fillRect(0, 0, ANCHO, ALTO_FOTO + 1)
  const arriba = g.createLinearGradient(0, 0, 0, 200)
  arriba.addColorStop(0, 'rgba(1,25,71,0.55)')
  arriba.addColorStop(1, 'rgba(1,25,71,0)')
  g.fillStyle = arriba
  g.fillRect(0, 0, ANCHO, 200)
  if (logo?.complete && logo.naturalWidth) g.drawImage(logo, M, 44, 128, 128 * logo.naturalHeight / logo.naturalWidth)

  // Etiqueta.
  const etiqueta = (datos.etiqueta || 'NOTICIA').toUpperCase()
  g.font = `800 26px ${TEXTO}`
  if ('letterSpacing' in g) g.letterSpacing = '2px'
  const anchoEtiqueta = g.measureText(etiqueta).width + 92
  const yEtiqueta = ALTO_FOTO - 92
  g.fillStyle = AMARILLO
  g.beginPath()
  g.roundRect(M, yEtiqueta, anchoEtiqueta, 58, 10)
  g.fill()
  rayo(g, M + 24, yEtiqueta + 14, 30, AZUL_OSCURO)
  g.fillStyle = AZUL_OSCURO
  g.fillText(etiqueta, M + 66, yEtiqueta + 39)
  if ('letterSpacing' in g) g.letterSpacing = '0px'

  // Titular + entradilla + fuente: se busca el mayor tamaño que quepa.
  const ancho = ANCHO - M * 2
  const items = palabras(datos.titular)
  let tam = 180
  let lineas = []

  let bloque = null
  for (; tam >= 64; tam -= 4) {
    g.font = `700 ${tam}px ${TITULOS}`
    lineas = partir(g, items, ancho, tam * 0.1)
    if (lineas.length > 3) continue
    const alturaCap = g.measureText('H').actualBoundingBoxAscent || tam * 0.75
    const interlinea = alturaCap * 1.28
    const y = yEtiqueta + 58 + 44 + alturaCap // primera línea
    const fin = y + (lineas.length - 1) * interlinea
    g.font = `600 30px ${TEXTO}`
    const lineasEntradilla = partirTexto(g, datos.entradilla, ancho).slice(0, 4)
    const yEntradilla = fin + 58
    const yFuente = yEntradilla + Math.max(0, lineasEntradilla.length - 1) * 40 + (lineasEntradilla.length ? 44 : 0)
    bloque = { interlinea, y, lineasEntradilla, yEntradilla, yFuente }
    if (yFuente <= LIMITE_TEXTO) break
  }
  if (bloque) {
    // Si sobra sitio, el bloque de texto se centra entre la etiqueta y el pie.
    const sobra = Math.max(0, (LIMITE_TEXTO - bloque.yFuente) / 2)
    bloque.y += sobra
    bloque.yEntradilla += sobra
    bloque.yFuente += sobra
    g.font = `700 ${tam}px ${TITULOS}`
    const espacio = tam * 0.1
    lineas.forEach((linea, i) => {
      let x = M
      for (const it of linea) {
        g.fillStyle = it.amarillo ? AMARILLO : '#ffffff'
        g.fillText(it.p, x, bloque.y + i * bloque.interlinea)
        x += g.measureText(it.p).width + espacio
      }
    })
    g.font = `600 30px ${TEXTO}`
    g.fillStyle = 'rgba(255,255,255,0.9)'
    bloque.lineasEntradilla.forEach((l, i) => g.fillText(l, M, bloque.yEntradilla + i * 40))
    if (datos.fuente) {
      g.font = `700 19px ${TEXTO}`
      g.fillStyle = AMARILLO
      if ('letterSpacing' in g) g.letterSpacing = '1.5px'
      g.fillText(`FUENTE: ${datos.fuente}`.toUpperCase(), M, bloque.yFuente)
      if ('letterSpacing' in g) g.letterSpacing = '0px'
    }
  }

  // Pie: línea, enlace a la web y logo.
  g.fillStyle = 'rgba(255,213,0,0.6)'
  g.fillRect(M, 1262, ANCHO - M * 2, 2)
  g.font = `600 22px ${TEXTO}`
  g.fillStyle = 'rgba(255,255,255,0.85)'
  const previo = 'Noticia completa en '
  g.fillText(previo, M, 1312)
  const xWeb = M + g.measureText(previo).width
  g.font = `800 22px ${TEXTO}`
  g.fillStyle = AMARILLO
  g.fillText('rzhub.es', xWeb, 1312)
  if (logo?.complete && logo.naturalWidth) {
    const w = 96
    g.drawImage(logo, ANCHO - M - w, 1312 - 32, w, w * logo.naturalHeight / logo.naturalWidth)
  }
  g.restore()
}
