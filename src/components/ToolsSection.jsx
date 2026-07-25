import { useNavigate } from 'react-router-dom'
import { TOOLS } from '../lib/tools'
import './ToolsSection.css'

export function ToolCard({ tool, onClick }) {
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
          {TOOLS.slice(0, 5).map(tool => (
            <ToolCard key={tool.id} tool={tool} onClick={() => navigate(tool.href)} />
          ))}
        </div>

        <div className="tools-section__footer">
          <button type="button" className="hero__btn-primary" onClick={() => navigate('/herramientas')}>
            Explorar todas las herramientas →
          </button>
        </div>
      </div>
    </section>
  )
}
