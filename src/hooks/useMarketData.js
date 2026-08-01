import { useEffect, useState } from 'react'
import { supabase } from './useAuth'
import { ESCUDO_ZARAGOZA } from '../lib/escudos'

const DEFAULT_PHOTO = 'https://www.fotmob.com/img/player-fallback-dark.png'

// Único dato real que existe hoy: la tabla `mercado` de Supabase no
// tiene columna de temporada, solo los movimientos de la temporada en
// curso. El selector de temporada es real y funcional, pero solo esta
// (la que ya está en la tabla) tiene datos — el resto de temporadas
// del desplegable muestran el estado vacío hasta que el histórico se
// cargue en Supabase con una columna que las distinga.
export const CURRENT_SEASON = '26/27'

function normalizar(str) {
  if (!str) return ''
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

// Adapta una fila cruda de Supabase (`tipo`, `club_origen`, `club_destino`...)
// al shape TransferMovement que consume el resto de la página.
function toMovement(row) {
  const isSigning = row.tipo === 'alta' || row.tipo === 'cesion_vuelta'
  const rivalName = isSigning ? row.club_origen : row.club_destino

  const zaragoza = { name: 'Real Zaragoza', crest: ESCUDO_ZARAGOZA }
  const rival = { name: rivalName || 'Libre', crest: null }

  return {
    id: row.id,
    player: { name: row.nombre, position: row.posicion, image: row.foto_url || DEFAULT_PHOTO },
    type: isSigning ? 'signing' : 'departure',
    originClub: isSigning ? rival : zaragoza,
    destinationClub: isSigning ? zaragoza : rival,
    date: row.fecha,
  }
}

/**
 * useMarketData(season) — fetch de movimientos de mercado para la
 * página Mercado. Misma tabla y misma lógica de cruce de fotos con
 * `players` que ya usan MarketCarousel y la Home (evita duplicar la
 * consulta con una forma distinta).
 */
export default function useMarketData(season) {
  const [state, setState] = useState({ loading: true, error: null, movements: [] })
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    if (season !== CURRENT_SEASON) {
      setState({ loading: false, error: null, movements: [] })
      return
    }

    let cancelado = false
    setState(s => ({ ...s, loading: true, error: null }))

    async function load() {
      const { data: movData, error } = await supabase
        .from('mercado')
        .select('*')
        .order('fecha', { ascending: false })

      if (cancelado) return

      if (error) {
        setState({ loading: false, error, movements: [] })
        return
      }

      const sinFoto = movData.filter(m => !m.foto_url)
      if (sinFoto.length > 0) {
        const { data: players } = await supabase.from('players').select('name, photo')
        if (players && !cancelado) {
          movData.forEach(mov => {
            if (!mov.foto_url) {
              const player = players.find(p => normalizar(p.name) === normalizar(mov.nombre))
              if (player) mov.foto_url = player.photo
            }
          })
        }
      }

      if (!cancelado) setState({ loading: false, error: null, movements: movData.map(toMovement) })
    }
    load()

    return () => { cancelado = true }
  }, [season, reloadTick])

  return { ...state, refetch: () => setReloadTick(t => t + 1) }
}
