import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import './Footer.css'

/* ============================================================
   FOOTER — compartido por toda la landing (y cualquier página que
   quiera sentirse parte del mismo Design System, como Mercado).
   ============================================================ */
export default function Footer() {
  const { signInWithGoogle } = useAuth()

  return (
    <footer style={{ background: 'var(--rz-bg-0)', borderTop: '1px solid var(--rz-border)', padding: 'var(--space-12) 0 var(--space-6)' }}>
      <div className="rz-container">
        <div className="home-footer-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.2fr)', gap: 'var(--space-8)', marginBottom: 'var(--space-10)' }}>
          {/* Marca */}
          <div>
            <img src="/LOGO_RZHUB.png" alt="RZ Hub" style={{ height: 28, marginBottom: 'var(--space-3)' }} />
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--rz-text-muted)', lineHeight: 1.7, marginBottom: 'var(--space-4)' }}>
              La plataforma definitiva para todos los zaragocistas. Herramientas, datos y comunidad en un único lugar.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {[
                { s: '𝕏', href: 'https://x.com/rzhub_' },
                { s: 'IG', href: 'https://www.instagram.com/_rzhub?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==' },
                { s: 'YT', href: 'https://www.youtube.com/@AlexinhoRZ' },
                { s: 'DC', href: 'https://linktr.ee/rzhub1932' },
              ].map(({ s, href }, i) => (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer" style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--rz-bg-2)', border: '1px solid var(--rz-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--rz-text-muted)', cursor: 'pointer', textDecoration: 'none' }}>
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Herramientas */}
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--rz-text-muted)', marginBottom: 'var(--space-4)' }}>Herramientas</div>
            {[
              { l: 'Lineup Builder', href: '/lineup' },
              { l: 'Mercado', href: '/mercado' },
              { l: 'On Tour', href: '/on-tour' },
              { l: 'Calendario', href: '/calendario' },
              { l: 'La Porra', href: '/porra' },
              { l: 'Fotogalería', href: '/fotogaleria' },
            ].map(({ l, href }, i) => (
              <Link key={i} to={href} style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.40)', padding: '3px 0', cursor: 'pointer', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.75)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.40)'}
              >
                {l}
              </Link>
            ))}
          </div>

          {/* Comunidad */}
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--rz-text-muted)', marginBottom: 'var(--space-4)' }}>Comunidad</div>
            {[
              { l: 'Noticias', href: '/noticias' },
              { l: 'Eventos', href: '/calendario' },
              { l: 'Ranking', href: '/tierlist' },
            ].map(({ l, href }, i) => (
              <Link key={i} to={href} style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.40)', padding: '3px 0', cursor: 'pointer', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.75)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.40)'}
              >
                {l}
              </Link>
            ))}
            <div
              onClick={signInWithGoogle}
              style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.40)', padding: '3px 0', cursor: 'pointer' }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.75)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.40)'}
            >
              Miembros
            </div>
          </div>

          {/* Info */}
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--rz-text-muted)', marginBottom: 'var(--space-4)' }}>Información</div>
            <Link to="/sobre-rz-hub" style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.40)', padding: '3px 0', cursor: 'pointer', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.75)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.40)'}
            >
              Sobre RZ Hub
            </Link>
            <a href="https://linktr.ee/rzhub1932" target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.40)', padding: '3px 0', cursor: 'pointer', textDecoration: 'none' }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.75)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.40)'}
            >
              Contacto
            </a>
            {[
              { l: 'Ayuda', href: '/ayuda' },
              { l: 'Términos', href: '/terminos' },
              { l: 'Privacidad', href: '/privacidad' },
            ].map(({ l, href }, i) => (
              <Link key={i} to={href} style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.40)', padding: '3px 0', cursor: 'pointer', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.75)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.40)'}
              >
                {l}
              </Link>
            ))}
          </div>

          {/* Newsletter */}
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--rz-text-muted)', marginBottom: 'var(--space-4)' }}>Únete a la comunidad</div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--rz-text-muted)', lineHeight: 1.6, marginBottom: 'var(--space-3)' }}>
              Recibe noticias y novedades exclusivas del Real Zaragoza.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                type="email"
                placeholder="Tu email"
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: 'var(--rz-bg-2)',
                  border: '1px solid var(--rz-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--rz-text-primary)',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                }}
              />
              <button className="rz-btn rz-btn--primary" style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)' }}>→</button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid var(--rz-border)', paddingTop: 'var(--space-5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.20)' }}>© 2026 RZ Hub. Todos los derechos reservados.</span>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            {['Privacidad', 'Términos', 'Cookies'].map((l, i) => (
              <span key={i} style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.20)', cursor: 'pointer' }}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
