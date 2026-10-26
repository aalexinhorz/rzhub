// Reglas puras de "qué partido toca" (sin Supabase ni Vite): las usan la
// web (partidoActual.js) y scripts/prerender-seo.mjs.

export const DURACION_PARTIDO_MS = 2.5 * 3600_000
// El Vestuario Blanquillo sigue mostrando el último resultado hasta que
// faltan exactamente 72 horas para el siguiente saque inicial (pedido expreso).
export const HORAS_ANTES_SIGUIENTE = 72

export const fechaMadrid = d => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })

export function diaAnterior(ymd) {
  const d = new Date(`${ymd}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

// Primer partido que aún no ha terminado (puede estar en juego), de una
// lista de porra_partidos ordenada por kickoff.
export function proximoDeLista(lista, ahora = Date.now()) {
  return lista.find(p => p.kickoff && new Date(p.kickoff).getTime() > ahora - DURACION_PARTIDO_MS) || null
}

// Banners: desde el día anterior al partido (hora de Madrid) hasta que acaba.
export function enVisperaOPartido(proximo, ahora = Date.now()) {
  return !!proximo && fechaMadrid(ahora) >= diaAnterior(fechaMadrid(proximo.kickoff))
}

// Vestuario Blanquillo: el partido en juego; si no, el último jugado (con su
// resultado) hasta que falten 72 h para el siguiente; luego, el siguiente.
export function elegirPartidoActual({ proximo, ultimo }, ahora = Date.now()) {
  if (!proximo) return ultimo || null
  const saqueProximo = new Date(proximo.kickoff).getTime()
  if (ahora >= saqueProximo) return proximo
  if (ultimo && ultimo.kickoff !== proximo.kickoff && ahora < saqueProximo - HORAS_ANTES_SIGUIENTE * 3600_000) return ultimo
  return proximo
}
