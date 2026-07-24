import { useNavigate } from 'react-router-dom'
import './ToolsSection.css'

const ICON_PROPS = { width: 36, height: 36, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }

// badge: opcional (ej. 'Nuevo', 'Popular', 'Beta', 'Próximamente') — ninguna
// herramienta lo usa todavía, pero ToolCard ya sabe pintarlo.
const TOOLS = [
  {
    id: 'lineup',
    title: 'Lineup Builder',
    description: 'Crea tu alineación ideal y compártela con la comunidad.',
    href: '/lineup',
    badge: null,
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="16" cy="8" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="8" cy="16" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="16" cy="16" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'mercado',
    title: 'Mercado',
    description: 'Sigue los fichajes, rumores y valoraciones de los jugadores.',
    href: '/mercado',
    badge: null,
    icon: (
      <svg {...ICON_PROPS} strokeWidth={1.8}>
        <polyline points="3 17 9 11 13 15 21 6" />
        <polyline points="15 6 21 6 21 12" />
      </svg>
    ),
  },
  {
    id: 'on-tour',
    title: 'On Tour',
    description: 'Información de desplazamientos, entradas y rutas.',
    href: '/on-tour',
    badge: null,
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3 16V8a2 2 0 0 1 2-2h9l4 4v6" />
        <path d="M3 16h15" />
        <path d="M14 6v6h6" />
        <circle cx="7" cy="17.5" r="1.6" />
        <circle cx="17" cy="17.5" r="1.6" />
      </svg>
    ),
  },
  {
    id: 'calendario',
    title: 'Calendario',
    description: 'Todos los partidos, horarios y sincroniza con tu calendario.',
    href: '/calendario',
    badge: null,
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="3" x2="8" y2="7" />
        <line x1="16" y1="3" x2="16" y2="7" />
      </svg>
    ),
  },
  {
    id: 'porra',
    title: 'La Porra',
    description: 'Predice resultados y compite con otros zaragocistas.',
    href: '/porra',
    badge: null,
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
        <path d="M7 5H4a3 3 0 0 0 3 4" />
        <path d="M17 5h3a3 3 0 0 1-3 4" />
        <path d="M12 13v3" />
        <path d="M9 20h6" />
        <path d="M10 16h4l.4 4H9.6z" />
      </svg>
    ),
  },
]

function ToolCard({ tool, onClick }) {
  return (
    <button type="button" className="tool-card" onClick={onClick}>
      {tool.badge && <span className="tool-card__badge">{tool.badge}</span>}
      <span className="tool-card__icon">{tool.icon}</span>
      <h3 className="tool-card__title">{tool.title}</h3>
      <p className="tool-card__desc">{tool.description}</p>
      <span className="tool-card__cta">Explorar →</span>
    </button>
  )
}

export default function ToolsSection() {
  const navigate = useNavigate()

  return (
    <section
      className="tools-section"
      style={{ background: '#050c13', marginTop: '-59px', paddingTop: 'calc(40px + 59px)' }}
    >
      <div className="tools-section__container">
        <div className="tools-section__head">
          <p className="tools-section__eyebrow">Todo en un único lugar</p>
          <h2 className="tools-section__title">Herramientas diseñadas para cada zaragocista</h2>
        </div>

        <div className="tools-grid">
          {TOOLS.map(tool => (
            <ToolCard key={tool.id} tool={tool} onClick={() => navigate(tool.href)} />
          ))}
        </div>

        <div className="tools-section__footer">
          <button type="button" className="hero__btn-primary" onClick={() => navigate('/lineup')}>
            Explorar todas las herramientas →
          </button>
        </div>
      </div>
    </section>
  )
}
