import { useEffect, useState } from 'react'
import { supabase } from '../hooks/useAuth'
import { ESCUDO_ZARAGOZA } from './escudos'

// Filial, juvenil y femenino del Real Zaragoza (páginas /cantera/<slug> y
// gráficos). Los datos los rellena cada 2 h la función fetch-otros-equipos
// desde los widgets de BeSoccer de la web del club; los escudos los copia a
// Storage. Los datos fijos de cada equipo y los textos SEO están en
// otrosEquiposDatos.js (JS puro, también lo usa el prerender).
import { esPropio } from './otrosEquiposDatos'

export { EQUIPOS_OTROS, equipoOtro, equipoPorSlug, esPropio, nombreVisible, partidosPropiosDe, rutaCantera } from './otrosEquiposDatos'

const BASE_ESCUDOS = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/photoplayers/otros-equipos/escudos`
export function escudoOtro(id, nombre) {
  if (/^Real Zaragoza( U19| W)?$/.test(nombre || '')) return ESCUDO_ZARAGOZA
  return id ? `${BASE_ESCUDOS}/${id}.png` : null
}


/** Victoria / empate / derrota del equipo propio en un partido jugado. */
export function resultadoPropio(equipo, p) {
  if (p.goles_local == null || p.goles_visitante == null) return null
  const local = esPropio(equipo, p.local)
  if (!local && !esPropio(equipo, p.visitante)) return null
  const a = local ? p.goles_local : p.goles_visitante
  const b = local ? p.goles_visitante : p.goles_local
  return a > b ? 'V' : a < b ? 'D' : 'E'
}

const temporadaActual = () => {
  const d = new Date()
  return d.getMonth() >= 6 ? d.getFullYear() + 1 : d.getFullYear()
}
export const textoTemporada = t => `${t - 1}/${String(t).slice(2)}`

/** Partidos (de todo el grupo) y clasificación de un equipo, temporada actual. */
export function useOtroEquipo(id) {
  const [datos, setDatos] = useState({ id: null, partidos: null, clasificacion: null })
  useEffect(() => {
    let activo = true
    const temporada = temporadaActual()
    Promise.all([
      supabase.from('otros_equipos_partidos').select('*').eq('equipo', id).eq('temporada', temporada)
        .order('jornada').order('fecha').order('hora', { nullsFirst: false }),
      supabase.from('otros_equipos_clasificacion').select('*').eq('equipo', id).eq('temporada', temporada).order('pos'),
    ]).then(([p, c]) => {
      if (activo) setDatos({ id, temporada, partidos: p.data || [], clasificacion: c.data || [] })
    })
    return () => { activo = false }
  }, [id])
  // Mientras llegan los del equipo nuevo, no se enseñan los del anterior.
  return datos.id === id ? datos : { id, partidos: null, clasificacion: null }
}

/** Solo los partidos del equipo propio, en orden. */
export const partidosPropios = (equipo, partidos) =>
  (partidos || []).filter(p => esPropio(equipo, p.local) || esPropio(equipo, p.visitante))

/** Fecha corta: "sáb 21 nov" (+ hora si la hay). */
export function fechaCorta(p) {
  if (!p.fecha) return 'Por fijar'
  const d = new Date(`${p.fecha}T12:00:00`)
  const t = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')
  return p.hora ? `${t} · ${p.hora}` : t
}
