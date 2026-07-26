import { useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'
import { TOOLS } from '../lib/tools'
import { ToolCard } from '../components/ToolsSection'
import '../components/ToolsSection.css'
import './Tools.css'

/**
 * Tools — página de entrada única: el botón "Explorar todas las
 * herramientas →" de ToolsSection. Reutiliza el lenguaje visual de
 * .tools-section__container (misma cabecera, mismo .tool-card) para
 * que se sienta como una extensión de esa sección, no una página
 * aparte — solo cambia a una grid propia para las 8 herramientas en
 * vez del teaser de 5 con su hueco especial para tablet.
 */
export default function Tools() {
  const navigate = useNavigate()

  return (
    <>
      <SEO
        title="Todas las Herramientas | RZ Hub"
        description="Todas las herramientas de RZ Hub para seguir al Real Zaragoza: alineación, mercado, calendario, porra, noticias, tier list y comunidad."
        keywords="herramientas RZ Hub, herramientas Real Zaragoza, apps Real Zaragoza"
        path="/herramientas"
      />

      <section className="tools-page">
        <div className="tools-section__container">
          <div className="tools-section__head">
            <p className="tools-section__eyebrow">Todo en un único lugar</p>
            <h1 className="tools-section__title">Todas las herramientas</h1>
            <p className="tools-page__desc">
              Todo lo que necesitas para vivir al Real Zaragoza, reunido en un solo sitio.
            </p>
          </div>

          <div className="tools-page__grid">
            {TOOLS.map(tool => (
              <ToolCard key={tool.id} tool={tool} onClick={() => navigate(tool.href)} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
