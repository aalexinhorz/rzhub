import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../hooks/useAuth'
import './PorraCTA.css'

let cache = null

async function cargarPorraAbierta() {
  if (cache) return cache
  const { data } = await supabase
    .from('porra_partidos')
    .select('id, rival, sede, kickoff, jornada, competicion')
    .eq('abierto', true)
    .eq('finalizado', false)
    .gt('kickoff', new Date().toISOString())
    .order('kickoff', { ascending: true })
    .limit(1)
  cache = data?.[0] || null
  return cache
}

// Enlace contextual a la porra con el partido abierto, para repartir
// enlaces internos hacia /porra desde las páginas que más entran por Google.
export default function PorraCTA() {
  const [partido, setPartido] = useState(cache)

  useEffect(() => {
    let activo = true
    cargarPorraAbierta().then(p => { if (activo) setPartido(p) })
    return () => { activo = false }
  }, [])

  if (!partido) return null

  const local = partido.sede === 'local'
  const nombreLocal = local ? 'Real Zaragoza' : partido.rival
  const nombreVisitante = local ? partido.rival : 'Real Zaragoza'
  const competicion = partido.competicion ? partido.competicion.split(' · ')[0] : `Primera Federación · Jornada ${partido.jornada}`
  const fecha = new Date(partido.kickoff).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' })

  return (
    <div className="porra-cta-bloque">
      <Link to="/porra" className="porra-cta-bloque__card">
        <img
          className="porra-cta-bloque__camiseta"
          src="/images/porra-camiseta-recorte.webp"
          alt="Camiseta oficial del Real Zaragoza, premio de la Porra"
          width="64"
          height="64"
          loading="lazy"
        />
        <span className="porra-cta-bloque__texto">
          <span className="porra-cta-bloque__eyebrow">Porra abierta · {competicion} · {fecha}</span>
          <span className="porra-cta-bloque__titulo">Pronóstico {nombreLocal} - {nombreVisitante}</span>
          <span className="porra-cta-bloque__sub">
            <strong>Gana una camiseta oficial del Real Zaragoza:</strong> el 1.º de la clasificación al final de la temporada se la lleva. Participar es gratis.
          </span>
        </span>
        <span className="porra-cta-bloque__pill">Pronosticar →</span>
      </Link>
    </div>
  )
}
