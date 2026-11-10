import { supabase } from '../hooks/useAuth'
import { ESCUDO_ZARAGOZA, getEscudo } from './escudos'

// Equipos y jugadores con foto para las plantillas de /redaccion-graficos:
// el Real Zaragoza (players) y los rivales con plantilla (rivales_plantilla).

export const ID_ZARAGOZA = 'real-zaragoza'

export async function cargarEquiposGraficos() {
  const { data } = await supabase.from('rivales').select('id, nombre').order('nombre')
  return [
    { id: ID_ZARAGOZA, nombre: 'Real Zaragoza', escudo: ESCUDO_ZARAGOZA },
    ...(data || []).map(r => ({ id: r.id, nombre: r.nombre, escudo: getEscudo(r.nombre) })),
  ]
}

const corto = nombre => {
  const p = (nombre || '').trim().split(/\s+/)
  return p.length > 1 ? p.slice(1).join(' ') : p[0]
}

export async function cargarJugadoresGraficos(equipoId) {
  if (equipoId === ID_ZARAGOZA) {
    const { data } = await supabase.from('players').select('id, name, short_name, photo').eq('is_zaragoza', true).order('name')
    return (data || []).filter(p => p.photo && !p.photo.includes('fallback'))
      .map(p => ({ id: `z${p.id}`, nombre: p.name, corto: p.short_name || corto(p.name), foto: p.photo }))
  }
  const { data } = await supabase.from('rivales_plantilla').select('id, nombre, foto_url').eq('rival_id', equipoId).order('nombre')
  return (data || []).map(j => ({ id: `r${j.id}`, nombre: j.nombre, corto: corto(j.nombre), foto: j.foto_url }))
}
