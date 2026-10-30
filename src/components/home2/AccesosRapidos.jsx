import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { calcularRacha } from '../../lib/zaragozleRacha'
import { cargarProximoYUltimo } from '../../lib/partidoActual'
import { TOOLS } from '../../lib/tools'

// Mismos iconos de línea que /herramientas (lib/tools.jsx); aquí solo los
// que no tienen herramienta propia.
const ICONO = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }
const iconoTool = id => TOOLS.find(t => t.id === id)?.icon
const ICONOS = {
  vestuario: (
    <svg {...ICONO}>
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </svg>
  ),
  notas: (
    <svg {...ICONO}>
      <path d="M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.49l-5.87 3.09 1.12-6.54L2.5 9.41l6.56-.95z" />
    </svg>
  ),
  lineup: (
    <svg {...ICONO}>
      <rect x="4" y="2.5" width="16" height="19" rx="2" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M8.5 2.5v3h7v-3M8.5 21.5v-3h7v3" />
    </svg>
  ),
  zaragozle: (
    <svg {...ICONO}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" fill="currentColor" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" fill="currentColor" />
    </svg>
  ),
  pizarra: (
    <svg {...ICONO}>
      <circle cx="5.5" cy="18" r="2.5" />
      <path d="M16 3.5l4.5 4.5M20.5 3.5L16 8" />
      <path d="M7.5 15.5C9 10 11 9 15.5 10.5" strokeDasharray="2.2 2.2" />
      <path d="M13.7 8l1.8 2.5-2.95.9" />
    </svg>
  ),
  tabla: (
    <svg {...ICONO}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="3" y1="9.33" x2="21" y2="9.33" />
      <line x1="3" y1="14.67" x2="21" y2="14.67" />
      <line x1="8" y1="4" x2="8" y2="20" />
    </svg>
  ),
}
const LLAMA = (
  <svg {...ICONO} strokeWidth={2} className="h2-acceso__badge-icono" aria-hidden="true">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
)

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
    { to: '/proximo-partido', icono: ICONOS.vestuario, label: 'Vestuario', badge: etiquetaPartido(proximo?.kickoff), destacado: true },
    { to: '/porra', icono: iconoTool('porra'), label: 'Porra', badge: 'Premio' },
    { to: '/lineup', icono: ICONOS.lineup, label: 'Lineup' },
    { to: '/notas', icono: ICONOS.notas, label: 'Notas' },
    { to: '/zaragozle', icono: ICONOS.zaragozle, label: 'Zaragozle', badge: racha.actual > 0 ? <>{LLAMA}{racha.actual}</> : null },
    { to: '/pizarra', icono: ICONOS.pizarra, label: 'Pizarra' },
    { ancla: 'h2-clasificacion', icono: ICONOS.tabla, label: 'Tabla' },
    { ancla: 'h2-videos', icono: iconoTool('videos'), label: 'Vídeos' },
    { to: '/calendario', icono: iconoTool('calendario'), label: 'Calendario' },
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
