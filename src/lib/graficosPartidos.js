// Próximos partidos del Real Zaragoza para las plantillas de cartel (La
// Porra, Partido y On Tour): local, visitante, estadio, hora, jornada y
// competición ya resueltos, y los escudos cargados.

import { useEffect, useState } from 'react'
import { supabase } from '../hooks/useAuth'
import { DURACION_PARTIDO_MS } from './reglasPartido'
import { cargarImagen, escudoDe } from './graficosComun'
import { LOGOS_COMPETICION } from './graficoCaraACara'
import { ESTADIO_ZARAGOZA, CIUDAD_RIVAL, fechaLarga, horaMadrid, limpiarEstadio, nombresPartido } from './partidoSeo'

export function useProximosPartidos() {
  const [partidos, setPartidos] = useState([])
  useEffect(() => {
    Promise.all([
      supabase.from('porra_partidos').select('id, rival, sede, jornada, competicion, kickoff')
        .gt('kickoff', new Date(Date.now() - DURACION_PARTIDO_MS).toISOString())
        .order('kickoff', { ascending: true }).limit(12),
      supabase.from('rivales').select('nombre, estadio'),
    ]).then(([{ data }, { data: rivales }]) => {
      const estadios = Object.fromEntries((rivales || []).map(r => [r.nombre, r.estadio]))
      setPartidos((data || []).map(p => {
        const { local, visitante, zaragozaLocal } = nombresPartido(p)
        const competicion = p.competicion ? p.competicion.split(' · ')[0] : 'Primera Federación'
        return {
          ...p, local, visitante, zaragozaLocal, competicion,
          ronda: p.competicion ? p.competicion.split(' · ').slice(1).join(' · ') : `Jornada ${p.jornada}`,
          estadio: zaragozaLocal ? ESTADIO_ZARAGOZA : limpiarEstadio(estadios[p.rival]),
          ciudad: zaragozaLocal ? 'Zaragoza' : CIUDAD_RIVAL[p.rival] || '',
          hora: horaMadrid(p.kickoff),
          fecha: fechaLarga(p.kickoff).replace(/ de \d{4}$/, ''),
        }
      }))
    })
  }, [])
  return partidos
}

export const etiquetaPartido = p => `${p.local} - ${p.visitante} (${p.competicion === 'Primera Federación' ? `J${p.jornada}` : 'Copa'}, ${p.fecha})`

// Escudos de local y visitante y logo de la competición.
export function useImagenesPartido(local, visitante, competicion) {
  const [imgs, setImgs] = useState({})
  useEffect(() => {
    let activo = true
    // Sobre azul, la versión con el texto en blanco.
    const logo = (LOGOS_COMPETICION[competicion] || LOGOS_COMPETICION['Primera Federación']).replace(/(primera-federacion|copa-del-rey)\.svg$/, '$1-blanco.svg')
    Promise.all([
      local ? cargarImagen(encodeURI(escudoDe(local) || '')) : null,
      visitante ? cargarImagen(encodeURI(escudoDe(visitante) || '')) : null,
      cargarImagen(logo),
    ]).then(([escudoLocal, escudoVisitante, logoCompeticion]) => { if (activo) setImgs({ escudoLocal, escudoVisitante, logoCompeticion }) })
    return () => { activo = false }
  }, [local, visitante, competicion])
  return imgs
}
