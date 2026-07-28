import './Footer.css'

/* ============================================================
   FOOTER — compartido por toda la landing (y cualquier página que
   quiera sentirse parte del mismo Design System, como Mercado).
   ============================================================ */
export default function Footer() {
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
              {['𝕏', 'IG', 'YT', 'DC'].map((s, i) => (
                <div key={i} style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--rz-bg-2)', border: '1px solid var(--rz-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--rz-text-muted)', cursor: 'pointer' }}>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Herramientas */}
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--rz-text-muted)', marginBottom: 'var(--space-4)' }}>Herramientas</div>
            {['Lineup Builder', 'Mercado', 'On Tour', 'Calendario', 'La Porra', 'Fotogalería'].map((l, i) => (
              <div key={i} style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.40)', padding: '3px 0', cursor: 'pointer' }}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.75)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.40)'}
              >
                {l}
              </div>
            ))}
          </div>

          {/* Comunidad */}
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--rz-text-muted)', marginBottom: 'var(--space-4)' }}>Comunidad</div>
            {['Noticias', 'Foros', 'Eventos', 'Ranking', 'Miembros'].map((l, i) => (
              <div key={i} style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.40)', padding: '3px 0', cursor: 'pointer' }}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.75)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.40)'}
              >
                {l}
              </div>
            ))}
          </div>

          {/* Info */}
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--rz-text-muted)', marginBottom: 'var(--space-4)' }}>Información</div>
            {['Sobre RZ Hub', 'Contacto', 'Ayuda', 'Términos', 'Privacidad'].map((l, i) => (
              <div key={i} style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.40)', padding: '3px 0', cursor: 'pointer' }}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.75)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.40)'}
              >
                {l}
              </div>
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
