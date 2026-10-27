import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { calcularRacha } from '../../lib/zaragozleRacha'
import { cargarProximoYUltimo } from '../../lib/partidoActual'

const fechaMadrid = d => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })

function etiquetaPartido(kickoff) {
  if (!kickoff) return null
  const inicio = new Date(kickoff).getTime()
  if (Date.now() >= inicio) return 'En juego'
  const hoy = fechaMadrid(Date.now())
  const manana = fechaMadrid(Date.now() + 86400000)
  const dia = fechaMadrid(kickoff)
  const hora = new Date(kickoff).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })
  if (dia === hoy) return `Hoy ${hora}`
  if (dia === manana) return `Mañana`
  return new Date(kickoff).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', timeZone: 'Europe/Madrid' })
}

function irA(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' })
}

// Fila de accesos tipo app, pensada para el pulgar en móvil (el 80% de las
// visitas): todo lo importante a un toque, con insignias en vivo.
export default function AccesosRapidos() {
  const [racha] = useState(() => calcularRacha())
  const [proximo, setProximo] = useState(null)

  useEffect(() => {
    let activo = true
    cargarProximoYUltimo('kickoff, abierto').then(d => { if (activo) setProximo(d.proximo) })
    return () => { activo = false }
  }, [])

  const items = [
    { to: '/proximo-partido', icono: '🦁', label: 'Vestuario', badge: etiquetaPartido(proximo?.kickoff), destacado: true },
    { to: '/porra', icono: '🔮', label: 'Porra', badge: '👕 Premio' },
    { to: '/lineup', icono: '📋', label: 'Lineup' },
    { to: '/notas', icono: '⭐', label: 'Notas' },
    { to: '/zaragozle', icono: '🧩', label: 'Zaragozle', badge: racha.actual > 0 ? `🔥 ${racha.actual}` : null },
    { to: '/pizarra', icono: '✏️', label: 'Pizarra' },
    { ancla: 'h2-clasificacion', icono: '📊', label: 'Tabla' },
    { ancla: 'h2-videos', icono: '▶️', label: 'Vídeos' },
    { to: '/calendario', icono: '📅', label: 'Calendario' },
  ]

  return (
    <nav className="h2-accesos" aria-label="Accesos rápidos">
      {items.map(it => {
        const contenido = (
          <>
            <span className={`h2-acceso__icono${it.destacado ? ' is-destacado' : ''}`} aria-hidden="true">{it.icono}</span>
            <span className="h2-acceso__label">{it.label}</span>
            {it.badge && <span className="h2-acceso__badge">{it.badge}</span>}
          </>
        )
        return it.to
          ? <Link key={it.label} to={it.to} className="h2-acceso">{contenido}</Link>
          : <button key={it.label} type="button" className="h2-acceso" onClick={() => irA(it.ancla)}>{contenido}</button>
      })}
    </nav>
  )
}
