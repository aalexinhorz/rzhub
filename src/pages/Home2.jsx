import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SEO, { SITE_URL, DEFAULT_OG_IMAGE } from '../components/SEO'
import useAuth from '../hooks/useAuth'
import HomeBanners from '../components/HomeBanners'
import HeroSection from '../components/HeroSection'
import CommunityStats from '../components/CommunityStats'
import ToolsSection from '../components/ToolsSection'
import NoticiasHome from '../components/NoticiasHome'
import CommunitySection from '../components/CommunitySection'
import EditorialSection from '../components/EditorialSection'
import CalendarSection from '../components/CalendarSection'
import DevlogSection from '../components/DevlogSection'
import Footer from '../components/Footer'
import VestuarioDestacado from '../components/home2/VestuarioDestacado'
import ZaragozleCard from '../components/home2/ZaragozleCard'
import PizarraMini from '../components/home2/PizarraMini'
import ClasificacionWidget from '../components/home2/ClasificacionWidget'
import VideosCanales from '../components/home2/VideosCanales'
import AccesosRapidos from '../components/home2/AccesosRapidos'
import '../components/home2/Home2.css'

const STAT_ICON_PROPS = { width: 32, height: 32, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }

const STATS = [
  {
    icon: (
      <svg {...STAT_ICON_PROPS}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M12 8.3l1.2 2.3 2.6.4-1.9 1.8.4 2.6-2.3-1.2-2.3 1.2.4-2.6-1.9-1.8 2.6-.4z" />
      </svg>
    ),
    value: 'Todo', label: 'sobre el Real Zaragoza, en un solo sitio',
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

function FinalCTA() {
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
          <img src="/LOGO_RZHUB.webp" alt="RZ Hub" style={{ height: 40 }} />
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

function CabeceraSeccion({ eyebrow, titulo, accion }) {
  return (
    <div className="h2-seccion__cabecera">
      <div>
        <p className="h2-seccion__eyebrow">{eyebrow}</p>
        <h2 className="h2-seccion__titulo">{titulo}</h2>
      </div>
      {accion}
    </div>
  )
}

const PESTANAS_JUEGA = [
  { id: 'h2-zaragozle', label: 'Zaragozle' },
  { id: 'h2-pizarra', label: 'Pizarra' },
  { id: 'h2-clasificacion', label: 'Clasificación' },
]

// En móvil las tres tarjetas van en un carrusel deslizable con pestañas
// arriba (en vez de apiladas, que alargaba muchísimo la página); en
// escritorio es una rejilla normal y las pestañas no se ven.
function JuegaCarrusel() {
  const pista = useRef(null)
  const [activa, setActiva] = useState(PESTANAS_JUEGA[0].id)

  function alDeslizar() {
    const el = pista.current
    if (!el) return
    const centro = el.scrollLeft + el.clientWidth / 2
    let mejor = PESTANAS_JUEGA[0].id
    let distancia = Infinity
    for (const { id } of PESTANAS_JUEGA) {
      const item = document.getElementById(id)
      if (!item) continue
      const d = Math.abs(item.offsetLeft + item.offsetWidth / 2 - centro)
      if (d < distancia) { distancia = d; mejor = id }
    }
    setActiva(mejor)
  }

  function ir(id) {
    const item = document.getElementById(id)
    if (item && pista.current) pista.current.scrollTo({ left: item.offsetLeft - pista.current.offsetLeft, behavior: 'smooth' })
    setActiva(id)
  }

  return (
    <>
      <div className="h2-chips" role="tablist" aria-label="Juega y sigue la liga">
        {PESTANAS_JUEGA.map(t => (
          <button key={t.id} type="button" role="tab" aria-selected={activa === t.id} className={`h2-chip${activa === t.id ? ' is-active' : ''}`} onClick={() => ir(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="h2-rejilla" ref={pista} onScroll={alDeslizar}>
        <div className="h2-rejilla__item" id="h2-zaragozle"><ZaragozleCard /></div>
        <div className="h2-rejilla__item" id="h2-pizarra"><PizarraMini /></div>
        <div className="h2-rejilla__item h2-rejilla__item--tabla" id="h2-clasificacion"><ClasificacionWidget /></div>
      </div>
    </>
  )
}

// Home nueva, más interactiva: Vestuario Blanquillo como protagonista,
// portada con Lineup y Porra (sin cambios), juegos y clasificación, vídeos
// de los canales y, debajo, todo lo que ya tenía la home anterior.
export default function Home2() {
  const navigate = useNavigate()

  return (
    <div className="h2-pagina">
      <SEO
        title="RZ Hub | La plataforma fan del Real Zaragoza 26/27"
        description="Todo sobre el Real Zaragoza en un solo sitio: Vestuario Blanquillo, alineación, porra, clasificación de Primera Federación, Zaragozle, vídeos y noticias."
        path="/home2"
        noindex
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'RZ Hub',
          url: SITE_URL,
          publisher: { '@type': 'Organization', name: 'RZ Hub', logo: { '@type': 'ImageObject', url: DEFAULT_OG_IMAGE } },
        }}
      />

      <HomeBanners />

      <div className="h2-banda h2-banda--azul">
        <div className="h2-contenedor">
          <VestuarioDestacado />
          <AccesosRapidos />
        </div>
      </div>

      <HeroSection compacto />

      <section className="h2-seccion">
        <div className="h2-contenedor">
          <CabeceraSeccion eyebrow="Cada día, algo nuevo" titulo="Juega y sigue la liga" />
          <JuegaCarrusel />
        </div>
      </section>

      <section className="h2-seccion h2-seccion--oscura" id="h2-videos">
        <div className="h2-contenedor">
          <CabeceraSeccion
            eyebrow="Previas, post partidos y directos"
            titulo="Vídeos zaragocistas"
            accion={<button type="button" className="h2-boton h2-boton--texto" onClick={() => navigate('/videos')}>Todos los vídeos →</button>}
          />
          <VideosCanales />
        </div>
      </section>

      <CommunityStats stats={STATS} />

      <ToolsSection />

      <EditorialSection>
        <NoticiasHome />
        <CommunitySection />
        <CalendarSection />
      </EditorialSection>

      <FinalCTA />

      <DevlogSection />

      <Footer />
    </div>
  )
}
