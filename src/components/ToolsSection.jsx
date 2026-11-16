import { Link } from 'react-router-dom'
import { TOOLS } from '../lib/tools'
import './ToolsSection.css'

// Enlace de verdad (<a href>), no un botón con onClick: así Google sigue el
// enlace y la página de la herramienta recibe autoridad desde aquí.
export function ToolCard({ tool }) {
  return (
    <Link to={tool.href} className="tool-card">
      {tool.badge && <span className="tool-card__badge">{tool.badge}</span>}
      <span className="tool-card__icon">{tool.icon}</span>
      <h3 className="tool-card__title">{tool.title}</h3>
      <p className="tool-card__desc">{tool.description}</p>
      <span className="tool-card__cta">Explorar →</span>
    </Link>
  )
}

export default function ToolsSection() {
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
          {/* Zaragozle se queda fuera del teaser de la Home a
              propósito (pedido explícito) — sigue disponible en
              /herramientas. */}
          {TOOLS.filter(tool => tool.id !== 'zaragozle').slice(0, 5).map(tool => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        <div className="tools-section__footer">
          <Link to="/herramientas" className="hero__btn-primary" style={{ textDecoration: 'none' }}>
            Explorar todas las herramientas →
          </Link>
        </div>
      </div>
    </section>
  )
}
