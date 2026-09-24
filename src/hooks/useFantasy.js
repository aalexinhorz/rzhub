import { useCallback, useEffect, useState } from 'react'
import { supabase } from './useAuth'

const BUDGET_INICIAL = 100000000

// Centraliza los datos del Fantasy: precios de mercado, plantilla y saldo
// del usuario, y la próxima alineación. Compra/venta van por las RPC
// (fantasy_comprar_jugador/fantasy_vender_jugador) para que el saldo nunca
// pueda quedar inconsistente por una condición de carrera en el cliente.
export default function useFantasy(userId) {
  const [precios, setPrecios] = useState([])
  const [plantilla, setPlantilla] = useState([])
  const [clasificacion, setClasificacion] = useState(null)
  const [mercadoHoy, setMercadoHoy] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    const hoy = new Date().toISOString().slice(0, 10)
    const [{ data: preciosData }, { data: plantillaData }, { data: clasifData }, { data: mercadoData }] = await Promise.all([
      supabase.from('fantasy_precios').select('player_id, precio, precio_anterior'),
      userId
        ? supabase.from('fantasy_plantillas').select('player_id, precio_compra, comprado_at').eq('user_id', userId)
        : Promise.resolve({ data: [] }),
      userId
        ? supabase.from('fantasy_clasificacion').select('saldo, puntos_total').eq('user_id', userId).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from('fantasy_mercado_diario').select('player_id').eq('fecha', hoy),
    ])
    setPrecios(preciosData || [])
    setPlantilla(plantillaData || [])
    setMercadoHoy((mercadoData || []).map(m => m.player_id))

    // Primera vez que este usuario entra al Fantasy: se le regala un
    // equipo inicial balanceado (2 POR, 5 DEF, 5 MED, 3 DEL) dentro del
    // presupuesto, en vez de dejarle con la plantilla vacía.
    if (userId && !clasifData) {
      const { error: errInicio } = await supabase.rpc('fantasy_iniciar_equipo')
      if (!errInicio) {
        const [{ data: plantillaNueva }, { data: clasifNueva }] = await Promise.all([
          supabase.from('fantasy_plantillas').select('player_id, precio_compra, comprado_at').eq('user_id', userId),
          supabase.from('fantasy_clasificacion').select('saldo, puntos_total').eq('user_id', userId).maybeSingle(),
        ])
        setPlantilla(plantillaNueva || [])
        setClasificacion(clasifNueva || { saldo: BUDGET_INICIAL, puntos_total: 0 })
        setLoading(false)
        return
      }
    }
    setClasificacion(clasifData || (userId ? { saldo: BUDGET_INICIAL, puntos_total: 0 } : null))
    setLoading(false)
  }, [userId])

  useEffect(() => { cargar() }, [cargar])

  async function comprar(playerId) {
    setError(null)
    const { error: err } = await supabase.rpc('fantasy_comprar_jugador', { p_player_id: playerId })
    if (err) { setError(err.message); return false }
    await cargar()
    return true
  }

  async function vender(playerId) {
    setError(null)
    const { error: err } = await supabase.rpc('fantasy_vender_jugador', { p_player_id: playerId })
    if (err) { setError(err.message); return false }
    await cargar()
    return true
  }

  return { precios, plantilla, clasificacion, mercadoHoy, loading, error, recargar: cargar, comprar, vender }
}

export function usePrecioPorJugador(precios) {
  const mapa = new Map()
  precios.forEach(p => mapa.set(p.player_id, p))
  return mapa
}
