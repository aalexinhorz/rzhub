import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SEO, { SITE_URL, DEFAULT_OG_IMAGE } from '../components/SEO'
import useAuth from '../hooks/useAuth'
import { ESCUDOS_CLUBS, fetchEscudoFallback } from '../lib/escudos'
import PostPartidoBanner from '../components/PostPartidoBanner'
import HeroSection from '../components/HeroSection'
import CommunityStats from '../components/CommunityStats'
import ToolsSection from '../components/ToolsSection'
import MarketCarousel from '../components/MarketCarousel'
import CommunitySection from '../components/CommunitySection'
import EditorialSection from '../components/EditorialSection'
import CalendarSection from '../components/CalendarSection'
import Footer from '../components/Footer'

const STAT_ICON_PROPS = { width: 32, height: 32, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }

const STATS = [
  {
    icon: (
      <svg {...STAT_ICON_PROPS}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M12 8.3l1.2 2.3 2.6.4-1.9 1.8.4 2.6-2.3-1.2-2.3 1.2.4-2.6-1.9-1.8 2.6-.4z" />
      </svg>
    ),
    value: 'Todo', label: 'sobre el Zaragoza, en un solo sitio',
  },
  {
    icon: (
      <svg {...STAT_ICON_PROPS}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" />
      </svg>
    ),
    value: 'XI', label: 'Crea tu once ideal y compártelo',
  },
  {
    icon: (
      <svg {...STAT_ICON_PROPS}>
        <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
        <path d="M7 5H4a3 3 0 0 0 3 4" />
        <path d="M17 5h3a3 3 0 0 1-3 4" />
        <path d="M12 13v3" />
        <path d="M9 20h6" />
        <path d="M10 16h4l.4 4H9.6z" />
      </svg>
    ),
    value: '100%', label: 'Gratis, sin anuncios',
  },
]

/* ============================================================
   COMPONENTES PEQUEÑOS
   ============================================================ */
function EscudoImg({ nombre, fallback, size = 36 }) {
  const [src, setSrc] = useState(ESCUDOS_CLUBS[nombre] || fallback || null)

  useEffect(() => {
    if (ESCUDOS_CLUBS[nombre]) { setSrc(ESCUDOS_CLUBS[nombre]); return }
    fetchEscudoFallback(nombre).then(url => setSrc(url || fallback))
  }, [nombre, fallback])

  if (!src) return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--rz-bg-3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, color: 'var(--rz-text-muted)', fontWeight: 700,
    }}>
      {nombre?.[0] || '?'}
    </div>
  )

  return (
    <img
      src={src}
      alt={nombre}
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      onError={e => { e.target.style.display = 'none' }}
    />
  )
}

/* ============================================================
   FINAL CTA
   ============================================================ */
function FinalCTA() {
  const navigate = useNavigate()
  const { user, signInWithGoogle } = useAuth()

  if (user) return null

  return (
    <section style={{
      background: "linear-gradient(180deg, rgba(4, 18, 46, .94) 0%, rgba(7, 35, 88, .90) 35%, rgba(10, 68, 145, .82) 65%, rgba(4, 18, 46, .95) 100%), url('/images/estadio-comunidad.webp') center center / cover no-repeat",
      padding: 'var(--space-20) 0',
      textAlign: 'center',
    }}>
      <div className="rz-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <img src="/LOGO_RZHUB.png" alt="RZ Hub" style={{ height: 40 }} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: 0.95, marginBottom: 'var(--space-4)' }}>
          ¿Listo para vivir la<br />temporada como nunca?
        </h2>
        <p style={{ fontSize: 'var(--text-md)', color: 'rgba(255,255,255,0.60)', marginBottom: 'var(--space-8)' }}>
          Crea tu cuenta gratis y únete a cientos de zaragocistas.
        </p>
        <button onClick={signInWithGoogle} className="rz-btn rz-btn--primary rz-btn--lg">
          Regístrate gratis →
        </button>
      </div>
    </section>
  )
}

/* ============================================================
   HOME — PÁGINA PRINCIPAL
   ============================================================ */
export default function Home() {
  return (
    <>
      <SEO
        title="RZ Hub | La plataforma fan del Real Zaragoza 26/27"
        description="Todo sobre el Real Zaragoza en un solo sitio: crea tu alineación, sigue el mercado de fichajes, el calendario, la porra y las últimas noticias. La comunidad zaragocista online."
        keywords="Real Zaragoza, RZ Hub, noticias Real Zaragoza, mercado de fichajes Real Zaragoza, alineación Real Zaragoza, calendario Real Zaragoza, La Romareda, 1ª RFEF"
        path="/"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'RZ Hub',
          alternateName: 'RZ Hub | Real Zaragoza',
          url: SITE_URL,
          description: 'La plataforma fan del Real Zaragoza: alineaciones, mercado de fichajes, calendario, porra, noticias y comunidad zaragocista.',
          inLanguage: 'es-ES',
          publisher: {
            '@type': 'Organization',
            name: 'RZ Hub',
            logo: { '@type': 'ImageObject', url: DEFAULT_OG_IMAGE },
          },
        }}
      />

      {/* ── AVISO POST PARTIDO (temporal, se oculta solo) ───────── */}
      <PostPartidoBanner />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── COMMUNITY STATS ──────────────────────────────────── */}
      <CommunityStats stats={STATS} />

      {/* ── TOOLS ────────────────────────────────────────────── */}
      <ToolsSection />

      {/* ── MERCADO + COMUNIDAD + CALENDARIO (bloque editorial, mismo fondo) ─ */}
      <EditorialSection>
        <MarketCarousel />
        <CommunitySection />
        <CalendarSection />
      </EditorialSection>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <FinalCTA />

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <Footer />

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 1024px) {
          .home-footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .home-footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
