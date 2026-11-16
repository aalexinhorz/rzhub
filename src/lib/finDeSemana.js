import { supabase } from '../hooks/useAuth'
import { escudoDe } from './graficosComun'
import { ESCUDO_ZARAGOZA } from './escudos'
import { EQUIPOS_OTROS, escudoOtro, esPropio, nombreVisible, rutaCantera } from './otrosEquipos'

// Próximo partido de cada equipo del Real Zaragoza (primer equipo, filial,
// juvenil y femenino) en los próximos días, en orden de fecha y hora. Lo usan
// la sección "Este fin de semana" de la home y el gráfico "Fin de semana".
// Primer equipo: porra_partidos; el resto: otros_equipos_partidos (BeSoccer).

export const DIAS_VISTA = 8
export const hoyMadrid = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' })
const sumarDias = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export const diaLargo = iso => new Date(`${iso}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }).replace(/\./g, '')
export const diaCorto = iso => new Date(`${iso}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/[.,]/g, '')
/** ¿Caen todos entre viernes y domingo? (para titular "fin de semana" o "semana"). */
export const soloFinDeSemana = partidos => partidos.every(p => [0, 5, 6].includes(new Date(`${p.fecha}T12:00:00`).getDay()))

/**
 * Cada partido: { clave, equipo, rival, escudo (del rival), local (¿juega en
 * casa el nuestro?), fecha, hora, enlace, nombreLocal, nombreVisitante,
 * escudoLocal, escudoVisitante, competicion, jornada }.
 */
export async function cargarPartidosFinde({ dias = DIAS_VISTA } = {}) {
  const hoy = hoyMadrid()
  const hasta = sumarDias(hoy, dias)
  const desde = new Date(Date.now() - 2 * 3600_000).toISOString()

  const primer = supabase.from('porra_partidos').select('id, rival, sede, kickoff, jornada, competicion')
    .eq('finalizado', false).gte('kickoff', desde).order('kickoff').limit(1)
    .then(({ data }) => {
      const p = data?.[0]
      if (!p) return null
      const k = new Date(p.kickoff)
      const fecha = k.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' })
      // Sin hora fijada, el kickoff se guarda a medianoche UTC.
      const conHora = !(k.getUTCHours() === 0 && k.getUTCMinutes() === 0)
      const local = p.sede === 'local'
      const escudo = escudoDe(p.rival)
      return {
        clave: 'primer', equipo: 'Primer equipo', rival: p.rival, escudo, local,
        fecha, hora: conHora ? k.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }) : null,
        enlace: '/proximo-partido',
        nombreLocal: local ? 'Real Zaragoza' : p.rival, nombreVisitante: local ? p.rival : 'Real Zaragoza',
        escudoLocal: local ? ESCUDO_ZARAGOZA : escudo, escudoVisitante: local ? escudo : ESCUDO_ZARAGOZA,
        competicion: p.competicion ? p.competicion.split('·')[0].trim() : 'Primera Federación',
        jornada: p.competicion ? (p.competicion.split('·')[1] || '').trim() : `Jornada ${p.jornada}`,
      }
    })

  const otros = EQUIPOS_OTROS.map(eq => supabase.from('otros_equipos_partidos').select('*')
    .eq('equipo', eq.id).is('goles_local', null).gte('fecha', hoy)
    .or(`local.eq."${eq.propio}",visitante.eq."${eq.propio}"`)
    .order('fecha').order('hora', { nullsFirst: false }).limit(1)
    .then(({ data }) => {
      const p = data?.[0]
      if (!p) return null
      const local = esPropio(eq, p.local)
      const rival = local ? p.visitante : p.local
      return {
        clave: eq.id, equipo: eq.id === 'filial' ? 'Deportivo Aragón' : eq.pestaña, rival: nombreVisible(rival),
        escudo: escudoOtro(local ? p.visitante_id : p.local_id, rival), local, fecha: p.fecha, hora: p.hora,
        enlace: rutaCantera(eq),
        nombreLocal: nombreVisible(p.local), nombreVisitante: nombreVisible(p.visitante),
        escudoLocal: escudoOtro(p.local_id, p.local), escudoVisitante: escudoOtro(p.visitante_id, p.visitante),
        competicion: eq.competicion, jornada: `Jornada ${p.jornada}`,
      }
    }))

  const todos = (await Promise.all([primer, ...otros])).filter(p => p && p.fecha && p.fecha >= hoy && p.fecha <= hasta)
  return todos.sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora || '99').localeCompare(b.hora || '99'))
}
