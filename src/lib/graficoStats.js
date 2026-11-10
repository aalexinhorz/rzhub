// Gráfico de estadísticas de un jugador para redes (1080×1350, 4:5), la
// plantilla que se hacía a mano: foto a la izquierda con los escudos del
// partido y el nombre, y a la derecha el panel azul con el logo y hasta
// cuatro estadísticas. Lo usa /redaccion-graficos.

export const ANCHO = 1080
export const ALTO = 1350
export const PANEL_X = 702
const MARGEN = 42
const AMARILLO = '#ffd500'
const FUENTE_TITULOS = 'Humane'
const FUENTE_TEXTO = 'Archivo'

export async function cargarFuentes() {
  try {
    await Promise.all([
      document.fonts.load(`700 200px ${FUENTE_TITULOS}`),
      document.fonts.load(`600 24px ${FUENTE_TEXTO}`),
      document.fonts.load(`700 24px ${FUENTE_TEXTO}`),
    ])
  } catch { /* se dibuja con la fuente de reserva */ }
}

// Ajuste de la foto: "cover" sobre la zona izquierda, con zoom y
// desplazamiento del usuario, sin dejar huecos.
export function encajeFoto(foto, zoom = 1, dx = 0, dy = 0) {
  const base = Math.max(PANEL_X / foto.naturalWidth, ALTO / foto.naturalHeight)
  const s = base * zoom
  const w = foto.naturalWidth * s
  const h = foto.naturalHeight * s
  const x = Math.min(0, Math.max(PANEL_X - w, (PANEL_X - w) / 2 + dx))
  const y = Math.min(0, Math.max(ALTO - h, (ALTO - h) / 2 + dy))
  return { x, y, w, h }
}

function rectRedondeado(g, x, y, w, h, radios) {
  const [tl, tr, br, bl] = radios
  g.beginPath()
  g.moveTo(x + tl, y)
  g.lineTo(x + w - tr, y)
  g.arcTo(x + w, y, x + w, y + tr, tr)
  g.lineTo(x + w, y + h - br)
  g.arcTo(x + w, y + h, x + w - br, y + h, br)
  g.lineTo(x + bl, y + h)
  g.arcTo(x, y + h, x, y + h - bl, bl)
  g.lineTo(x, y + tl)
  g.arcTo(x, y, x + tl, y, tl)
  g.closePath()
}

function dibujarContenido(g, img, cx, cy, caja) {
  if (!img?.complete || !img.naturalWidth) return
  const s = Math.min(caja / img.naturalWidth, caja / img.naturalHeight)
  const w = img.naturalWidth * s
  const h = img.naturalHeight * s
  g.drawImage(img, cx - w / 2, cy - h / 2, w, h)
}

// Altura de las mayúsculas para colocar el texto por arriba exacto.
function alturaMayus(g, texto) {
  const m = g.measureText(texto || 'H')
  return m.actualBoundingBoxAscent || 0
}

// Ajusta el tamaño de letra para que el texto quepa en el ancho dado.
function tamañoQueCabe(g, texto, fuente, tamaño, anchoMax) {
  let t = tamaño
  g.font = fuente(t)
  while (t > 20 && g.measureText(texto).width > anchoMax) {
    t -= 4
    g.font = fuente(t)
  }
  return t
}

function partirLineas(g, texto, anchoMax) {
  const lineas = []
  for (const parrafo of String(texto || '').toUpperCase().split('\n')) {
    let actual = ''
    for (const palabra of parrafo.split(/\s+/).filter(Boolean)) {
      const prueba = actual ? `${actual} ${palabra}` : palabra
      if (g.measureText(prueba).width > anchoMax && actual) {
        lineas.push(actual)
        actual = palabra
      } else actual = prueba
    }
    if (actual) lineas.push(actual)
  }
  return lineas
}

function medalla(g, cx, cy, r) {
  g.save()
  g.strokeStyle = AMARILLO
  g.fillStyle = AMARILLO
  g.lineWidth = r * 0.16
  g.lineJoin = 'round'
  // Cintas.
  g.beginPath()
  g.moveTo(cx - r * 0.55, cy + r * 0.55)
  g.lineTo(cx - r * 0.75, cy + r * 1.55)
  g.lineTo(cx - r * 0.2, cy + r * 1.3)
  g.lineTo(cx, cy + r * 0.95)
  g.lineTo(cx + r * 0.2, cy + r * 1.3)
  g.lineTo(cx + r * 0.75, cy + r * 1.55)
  g.lineTo(cx + r * 0.55, cy + r * 0.55)
  g.stroke()
  // Círculo y estrella.
  g.beginPath()
  g.arc(cx, cy, r, 0, Math.PI * 2)
  g.stroke()
  g.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    const rr = i % 2 ? r * 0.24 : r * 0.55
    const x = cx + Math.cos(a) * rr
    const y = cy + Math.sin(a) * rr
    if (i) g.lineTo(x, y)
    else g.moveTo(x, y)
  }
  g.closePath()
  g.lineWidth = r * 0.12
  g.stroke()
  g.restore()
}

/**
 * datos: { nombre, apellido, credito, colorLocal, colorVisitante,
 *          ajusteFoto: { zoom, dx, dy }, stats: [{ valor, etiqueta, destacado, textoDestacado }] }
 * recursos: { foto, escudoLocal, escudoVisitante, logo } (Image ya cargadas o null)
 */
export function dibujarGraficoStats(g, datos, recursos) {
  g.save()
  g.clearRect(0, 0, ANCHO, ALTO)

  // ── Foto ──
  g.fillStyle = '#002261'
  g.fillRect(0, 0, PANEL_X, ALTO)
  const { foto } = recursos
  if (foto?.complete && foto.naturalWidth) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeFoto(foto, zoom, dx, dy)
    g.save()
    g.beginPath()
    g.rect(0, 0, PANEL_X, ALTO)
    g.clip()
    g.drawImage(foto, e.x, e.y, e.w, e.h)
    g.restore()
  }
  // Degradado azul abajo para que se lea el nombre.
  const sombra = g.createLinearGradient(0, ALTO * 0.5, 0, ALTO)
  sombra.addColorStop(0, 'rgba(0,34,97,0)')
  sombra.addColorStop(0.55, 'rgba(0,34,97,0.55)')
  sombra.addColorStop(1, 'rgba(0,34,97,0.95)')
  g.fillStyle = sombra
  g.fillRect(0, 0, PANEL_X, ALTO)

  // ── Escudos del partido ──
  const T = 122
  g.fillStyle = datos.colorLocal || '#0045bf'
  g.fillRect(MARGEN, 0, T, T)
  g.fillStyle = datos.colorVisitante || '#ffe667'
  rectRedondeado(g, MARGEN + T, 0, T, T, [0, 0, 18, 0])
  g.fill()
  dibujarContenido(g, recursos.escudoLocal, MARGEN + T / 2, T / 2, 88)
  dibujarContenido(g, recursos.escudoVisitante, MARGEN + T * 1.5, T / 2, 88)

  // ── Nombre ──
  const anchoNombre = PANEL_X - MARGEN * 2
  const apellido = (datos.apellido || '').toUpperCase()
  const nombre = (datos.nombre || '').toUpperCase()
  const fuenteTitulo = t => `700 ${t}px ${FUENTE_TITULOS}, 'Arial Narrow', sans-serif`
  g.textBaseline = 'alphabetic'
  g.textAlign = 'left'
  // Apellido grande en blanco y, encima, el nombre en amarillo; los dos
  // se encogen si no caben.
  const baseApellido = 1230
  let altoApellido = 0
  if (apellido) {
    tamañoQueCabe(g, apellido, fuenteTitulo, 250, anchoNombre)
    altoApellido = alturaMayus(g, apellido)
    g.fillStyle = '#ffffff'
    g.fillText(apellido, MARGEN, baseApellido)
  }
  if (nombre) {
    tamañoQueCabe(g, nombre, fuenteTitulo, 78, anchoNombre)
    g.fillStyle = AMARILLO
    g.fillText(nombre, MARGEN, baseApellido - altoApellido - 14)
  }
  if (datos.credito) {
    g.font = `600 13px ${FUENTE_TEXTO}, sans-serif`
    g.fillStyle = 'rgba(255,255,255,0.85)'
    if ('letterSpacing' in g) g.letterSpacing = '1px'
    g.fillText(datos.credito.toUpperCase(), MARGEN, 1274)
    if ('letterSpacing' in g) g.letterSpacing = '0px'
  }

  // ── Panel derecho ──
  const panel = g.createLinearGradient(0, 0, 0, ALTO)
  panel.addColorStop(0, '#011947')
  panel.addColorStop(0.5, '#002261')
  panel.addColorStop(1, '#002978')
  g.fillStyle = panel
  g.fillRect(PANEL_X, 0, ANCHO - PANEL_X, ALTO)

  const logo = recursos.logo
  if (logo?.complete && logo.naturalWidth) {
    const w = 108
    const h = w * logo.naturalHeight / logo.naturalWidth
    g.drawImage(logo, (PANEL_X + ANCHO) / 2 - w / 2, 62, w, h)
  }

  const stats = (datos.stats || []).filter(s => s.valor || s.etiqueta).slice(0, 4)
  const X = 768
  const ANCHO_TEXTO = 1026 - X
  const arriba = 158
  const abajo = 1300
  const alto = (abajo - arriba) / Math.max(stats.length, 4)
  stats.forEach((s, i) => {
    const y0 = arriba + i * alto
    // Número grande.
    const valor = String(s.valor || '').toUpperCase()
    tamañoQueCabe(g, valor, fuenteTitulo, 212, ANCHO_TEXTO)
    const cap = alturaMayus(g, valor || '0')
    g.fillStyle = '#ffffff'
    g.fillText(valor, X, y0 + cap)
    const anchoValor = g.measureText(valor).width
    // Etiqueta.
    g.font = `600 25px ${FUENTE_TEXTO}, sans-serif`
    g.fillStyle = AMARILLO
    // Como en el diseño original: columna estrecha, casi una palabra por línea.
    const lineas = partirLineas(g, s.etiqueta, 170).slice(0, 3)
    const capEtiqueta = alturaMayus(g, 'H')
    lineas.forEach((l, j) => g.fillText(l, X, y0 + cap + 30 + capEtiqueta + j * 26))
    // Distintivo "Top 1 del equipo".
    if (s.destacado) {
      const cx = X + anchoValor + 58
      const cy = y0 + cap * 0.4
      medalla(g, cx, cy, 25)
      const [l1, ...resto] = (s.textoDestacado || 'TOP 1\nDEL EQUIPO').toUpperCase().split('\n')
      g.textAlign = 'center'
      g.fillStyle = '#ffffff'
      g.font = `700 13px ${FUENTE_TEXTO}, sans-serif`
      g.fillText(l1, cx, cy + 56)
      g.font = `600 11px ${FUENTE_TEXTO}, sans-serif`
      resto.forEach((l, j) => g.fillText(l, cx, cy + 70 + j * 13))
      g.textAlign = 'left'
    }
    // Separador (no tras el último).
    if (i < stats.length - 1) {
      g.fillStyle = 'rgba(255,213,0,0.85)'
      g.fillRect(X, y0 + alto - 26, ANCHO_TEXTO, 1.5)
    }
  })

  // Web, abajo a la derecha, a la altura del crédito de la foto.
  g.font = `700 15px ${FUENTE_TEXTO}, sans-serif`
  g.fillStyle = 'rgba(255,255,255,0.85)'
  g.textAlign = 'right'
  if ('letterSpacing' in g) g.letterSpacing = '1px'
  g.fillText('rzhub.es', 1026, 1274)
  if ('letterSpacing' in g) g.letterSpacing = '0px'
  g.textAlign = 'left'
  g.restore()
}
