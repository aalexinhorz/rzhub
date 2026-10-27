// Fecha y número del reto del Zaragozle, y rachas de días seguidos jugando.
// Las partidas viven solo en este navegador (localStorage "zaragozle_AAAA-MM-DD"
// con { intentos, estado }), así que la racha también es por dispositivo.

export const LANZAMIENTO = '2026-09-14'

export function fechaHoyMadrid() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })
}

export function numeroPuzzle(fechaStr) {
  const dias = Math.round((new Date(`${fechaStr}T00:00:00Z`) - new Date(`${LANZAMIENTO}T00:00:00Z`)) / 86400000)
  return Math.max(1, dias + 1)
}

function diaAnterior(ymd) {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function leerPartida(fecha) {
  try {
    const datos = JSON.parse(localStorage.getItem(`zaragozle_${fecha}`) || 'null')
    return datos && Array.isArray(datos.intentos) ? datos : null
  } catch {
    return null
  }
}

const terminada = p => p && (p.estado === 'ganado' || p.estado === 'perdido')

// Racha actual: días seguidos con la partida terminada (ganada o perdida),
// contando hasta hoy, o hasta ayer si hoy aún no se ha jugado (como el
// Wordle: no se pierde la racha hasta que acaba el día). Mejor racha: la
// tirada más larga de días seguidos jugados que quede en el navegador.
export function calcularRacha(hoy = fechaHoyMadrid()) {
  let actual = 0
  let dia = terminada(leerPartida(hoy)) ? hoy : diaAnterior(hoy)
  while (terminada(leerPartida(dia))) {
    actual++
    dia = diaAnterior(dia)
  }

  let fechas = []
  try {
    fechas = Object.keys(localStorage)
      .filter(k => /^zaragozle_\d{4}-\d{2}-\d{2}$/.test(k))
      .map(k => k.slice('zaragozle_'.length))
      .filter(f => terminada(leerPartida(f)))
      .sort()
  } catch { /* sin localStorage */ }

  let mejor = 0
  let tirada = 0
  let previa = null
  for (const f of fechas) {
    tirada = previa && diaAnterior(f) === previa ? tirada + 1 : 1
    mejor = Math.max(mejor, tirada)
    previa = f
  }

  const ganadas = fechas.filter(f => leerPartida(f)?.estado === 'ganado').length
  return { actual, mejor: Math.max(mejor, actual), jugadas: fechas.length, ganadas }
}
