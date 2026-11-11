// Iconos de línea (cuadrícula de 24×24) para la etiqueta de la plantilla de
// noticia: cada etiqueta (Mercado, Oficial, Rumor…) lleva el suyo.

const ICONOS = {
  // Noticia: periódico.
  noticia: 'M4 5h12v14H6.5A2.5 2.5 0 0 1 4 16.5Z M16 9h4v8a2 2 0 0 1-4 0 M7.5 9h5 M7.5 12.5h5 M7.5 16h3',
  // Última hora: rayo.
  rayo: 'M13 2.5 5 13.5h6l-1 8 8-11h-6Z',
  // Oficial: sello con un check.
  oficial: 'M12 2.8l2.3 1.7 2.9-.1.9 2.7 2.4 1.7-.9 2.7.9 2.7-2.4 1.7-.9 2.7-2.9-.1L12 21.2l-2.3-1.7-2.9.1-.9-2.7-2.4-1.7.9-2.7-.9-2.7 2.4-1.7.9-2.7 2.9.1Z M8.6 12.2l2.3 2.3 4.5-4.6',
  // Mercado: flechas de ida y vuelta.
  mercado: 'M4 8.5h14 M14.5 5l3.5 3.5-3.5 3.5 M20 15.5H6 M9.5 12 6 15.5 9.5 19',
  // Rumor: bocadillo con puntos suspensivos.
  rumor: 'M4 5.5h16v10.5h-9.5L6 19.5V16H4Z M8.5 10.8h.01 M12 10.8h.01 M15.5 10.8h.01',
  // Crónica: lápiz escribiendo.
  cronica: 'M4 20h4.5L19.5 9a2.1 2.1 0 0 0-3-3L5.5 17Z M14.5 8l3 3 M13 20h7',
  // Previa: calendario.
  previa: 'M4 6h16v14H4Z M4 10.5h16 M8.5 3.5v4 M15.5 3.5v4 M8 14h2 M12 14h2 M8 17h2',
  // Comunicado: megáfono.
  comunicado: 'M3.5 10v4h3.5l6.5 4.5V5.5L7 10Z M16.5 9.5a3.5 3.5 0 0 1 0 5 M19 7a7 7 0 0 1 0 10',
}

// Etiqueta escrita a mano → icono (sin tildes ni mayúsculas). Si no
// coincide con ninguna, el del periódico.
const POR_ETIQUETA = {
  'noticia': 'noticia', 'ultima hora': 'rayo', 'oficial': 'oficial', 'mercado': 'mercado', 'fichaje': 'mercado',
  'rumor': 'rumor', 'cronica': 'cronica', 'previa': 'previa', 'comunicado': 'comunicado',
}
const normalizar = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
export const iconoDeEtiqueta = (etiqueta, porDefecto = 'noticia') => POR_ETIQUETA[normalizar(etiqueta)] || porDefecto

const trazos = new Map()

/** Dibuja el icono con su esquina superior izquierda en (x, y) y lado `lado`. */
export function dibujarIcono(g, nombre, x, y, lado, color, grosor = 2.2) {
  const d = ICONOS[nombre] || ICONOS.noticia
  if (!trazos.has(d)) trazos.set(d, new Path2D(d))
  g.save()
  g.translate(x, y)
  g.scale(lado / 24, lado / 24)
  g.strokeStyle = color
  g.lineWidth = grosor
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.stroke(trazos.get(d))
  g.restore()
}
