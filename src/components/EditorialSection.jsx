import './EditorialSection.css'

// Envuelve Mercado + Comunidad en un único bloque editorial: una sola
// imagen panorámica de fondo (estadio/afición) con overlay azul corporativo,
// para que ambas secciones se lean como una misma escena continua.
// El fondo vive únicamente aquí — nunca dentro de MarketCarousel ni
// CommunitySection — así la imagen se pinta una sola vez para todo el bloque.
export default function EditorialSection({ children }) {
  return (
    <section className="editorial-section">
      {children}
    </section>
  )
}
