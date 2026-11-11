// "El rival" para redes (1080×1350, 4:5): a un lado, el escudo y el nombre
// del rival, su historia (la de su ficha en la web) y los últimos
// enfrentamientos con el Real Zaragoza; al otro, una foto a toda altura.

import { encajeEn } from './graficosComun'
import { AMARILLO, AZUL, AZUL_OSCURO, TEXTO, TITULOS, ajustar, hayImagen, imagen, logoRz, partir, texto } from './graficosTexto'

export const ANCHO = 1080
export const ALTO = 1350
const PANEL = 610
const M = 77
export const zonaFoto = fotoIzquierda => ({ x: fotoIzquierda ? 0 : PANEL, y: 0, w: ANCHO - PANEL, h: ALTO })
const VERDE = '#1fe04a'
const ROJO = '#ff2130'

// "1967-05-09" → "66-67" (la temporada empieza en julio).
export function temporadaDe(fecha) {
  const d = new Date(fecha)
  const año = d.getFullYear() - (d.getMonth() < 6 ? 1 : 0)
  return `${String(año % 100).padStart(2, '0')}-${String((año + 1) % 100).padStart(2, '0')}`
}

// Casilla cuadrada con el escudo: azul la del Real Zaragoza, translúcida la
// del rival. La usan también La Porra y el cartel del partido.
export function casilla(g, escudo, x, y, lado, esZaragoza) {
  g.fillStyle = esZaragoza ? AZUL : 'rgba(255,255,255,0.16)'
  g.beginPath()
  g.roundRect(x, y, lado, lado, [3, 3, 14, 3])
  g.fill()
  imagen(g, escudo, x + lado / 2, y + lado / 2, lado * 0.66)
}

/**
 * datos: { antetitulo, rival, historia, fotoIzquierda, credito, ajusteFoto,
 *          partidos: [{ fecha, competicion, jornada, sede, goles_zaragoza, goles_rival }] }
 * recursos: { foto, logo, escudoRival, escudoZaragoza }
 */
export function dibujarGraficoRival(g, datos, recursos) {
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.save()
  g.textBaseline = 'alphabetic'
  const fondo = g.createLinearGradient(0, 0, 0, ALTO)
  fondo.addColorStop(0, AZUL_OSCURO)
  fondo.addColorStop(0.5, '#002261')
  fondo.addColorStop(1, '#00307f')
  g.fillStyle = fondo
  g.fillRect(0, 0, ANCHO, ALTO)

  // ── Foto ──
  const zona = zonaFoto(datos.fotoIzquierda)
  g.save()
  g.beginPath()
  g.rect(zona.x, zona.y, zona.w, zona.h)
  g.fillStyle = '#0b2a6b'
  g.fill()
  g.clip()
  if (hayImagen(recursos.foto)) {
    const { zoom = 1, dx = 0, dy = 0 } = datos.ajusteFoto || {}
    const e = encajeEn(recursos.foto, zona, zoom, dx, dy)
    g.drawImage(recursos.foto, e.x, e.y, e.w, e.h)
  }
  g.restore()
  if (datos.credito) {
    g.save()
    g.translate(zona.x + zona.w - 22, ALTO - 30)
    g.rotate(-Math.PI / 2)
    texto(g, datos.credito.toUpperCase(), 0, 0, `600 14px ${TEXTO}`, 'rgba(255,255,255,0.85)', 'left', '1px')
    g.restore()
  }

  // ── Panel ──
  g.translate(datos.fotoIzquierda ? ANCHO - PANEL : 0, 0)
  const derecha = PANEL - 50

  // Cabecera: escudo, antetítulo y nombre en amarillo.
  imagen(g, recursos.escudoRival, 110, 160, 108)
  const xNombre = 173
  texto(g, (datos.antetitulo || 'El rival').toUpperCase(), xNombre, 88, `700 21px ${TEXTO}`, '#ffffff')
  const nombre = (datos.rival || '').toUpperCase()
  if (nombre) {
    const t = ajustar(g, nombre, x => `700 ${x}px ${TITULOS}`, 150, derecha - xNombre + 6, 60)
    texto(g, nombre, xNombre - 3, 214, `700 ${t}px ${TITULOS}`, AMARILLO)
  }

  // Historia: baja de tamaño si es larga para no pisar los partidos.
  const partidos = (datos.partidos || []).slice(0, 5)
  const yLista = 510
  let tam = 19
  let lineas = []
  const anchoTexto = derecha - M
  while (tam >= 14) {
    g.font = `400 ${tam}px ${TEXTO}`
    lineas = partir(g, datos.historia || '', anchoTexto)
    if (272 + (lineas.length - 1) * tam * 1.02 < yLista - 50) break
    tam -= 0.5
  }
  lineas.forEach((l, i) => texto(g, l, M, 286 + i * tam * 1.02, `400 ${tam}px ${TEXTO}`, 'rgba(255,255,255,0.92)', 'left', '-0.3px'))

  // ── Últimos enfrentamientos ──
  if (partidos.length) {
    texto(g, 'ÚLTIMOS ENFRENTAMIENTOS', M, yLista, `700 21px ${TEXTO}`, '#ffffff', 'left', '-0.2px')
    const lado = 84
    partidos.forEach((p, i) => {
      const y = yLista + 22 + i * 138
      // Pastilla: TEMPORADA 67-68 | COPA DEL REY · 1/16 [VTA]
      const ligero = 'TEMPORADA '
      const negrita = `${temporadaDe(p.fecha)} | ${[p.competicion, p.jornada].filter(Boolean).join(' · ')}`.toUpperCase()
      g.font = `400 13px ${TEXTO}`
      const w1 = g.measureText(ligero).width
      g.font = `700 13px ${TEXTO}`
      const w2 = g.measureText(negrita).width
      g.fillStyle = AMARILLO
      g.beginPath()
      g.roundRect(M, y, w1 + w2 + 22, 22, 11)
      g.fill()
      texto(g, ligero, M + 11, y + 16, `400 13px ${TEXTO}`, AZUL_OSCURO)
      texto(g, negrita, M + 11 + w1, y + 16, `700 13px ${TEXTO}`, AZUL_OSCURO)

      // Local a la izquierda, visitante a la derecha.
      const local = p.sede === 'local'
      const yFila = y + 30
      casilla(g, local ? recursos.escudoZaragoza : recursos.escudoRival, M, yFila, lado, local)
      casilla(g, local ? recursos.escudoRival : recursos.escudoZaragoza, M + 186, yFila, lado, !local)
      const gl = local ? p.goles_zaragoza : p.goles_rival
      const gv = local ? p.goles_rival : p.goles_zaragoza
      const color = p.goles_zaragoza > p.goles_rival ? VERDE : p.goles_zaragoza < p.goles_rival ? ROJO : AMARILLO
      texto(g, `${gl}-${gv}`, M + lado + 51, yFila + lado - 6, `700 96px ${TITULOS}`, color, 'center', '4px')
    })
  }

  logoRz(g, recursos.logo, 87, 1246, 150)
  g.restore()
}
