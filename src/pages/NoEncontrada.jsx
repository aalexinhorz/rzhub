import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import Footer from '../components/Footer'

export default function NoEncontrada() {
  return (
    <div style={{ minHeight: '100vh', background: '#03101f', display: 'flex', flexDirection: 'column' }}>
      <SEO title="Página no encontrada | RZ Hub" description="Esta página no existe." noindex />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '80px 20px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(56px, 12vw, 120px)', lineHeight: 0.9, margin: 0 }}>404</h1>
        <p style={{ color: 'var(--rz-text-secondary)', margin: 0 }}>Esta página no existe.</p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/" className="rz-btn rz-btn--primary">Ir al inicio</Link>
          <Link to="/porra" className="rz-btn rz-btn--outline-yellow">Jugar a la Porra</Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
