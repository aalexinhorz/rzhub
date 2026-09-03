import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import SEO, { SITE_URL } from '../components/SEO'
import useMatchPhotos, { EQUIPOS, useMatchAuthor } from '../hooks/useMatchPhotos'
import Footer from '../components/Footer'
import { ESCUDO_ZARAGOZA, useEscudo } from '../lib/escudos'
import './Fotogaleria.css'

function formatMatchDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function initials(name) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function NotFoundState() {
  return (
    <div className="fotogaleria-page__body">
      <div className="fotogaleria-page__container">
        <div className="fotogaleria-page__state" role="status">
          <p>No hemos encontrado este partido.</p>
          <Link to="/fotogaleria" className="rz-btn rz-btn--primary" style={{ marginTop: 16 }}>
            ← Volver a la fotogalería
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default function FotogaleriaPartido() {
  const { partido } = useParams()
  const navigate = useNavigate()
  const { loading, error, matches } = useMatchPhotos()
  const [activeIndex, setActiveIndex] = useState(0)
  const [vista, setVista] = useState('visor')
  const filmstripRef = useRef(null)

  const match = useMemo(() => matches.find(m => m.key === partido), [matches, partido])
  const rivalCrest = useEscudo(match?.rival)
  const autor = useMatchAuthor(match?.key)

  function navigatePhoto(delta) {
    setActiveIndex(i => (i + delta + match.photos.length) % match.photos.length)
  }

  function irAFoto(i) {
    setActiveIndex(i)
    setVista('visor')
  }

  useEffect(() => {
    const activo = filmstripRef.current?.querySelector('.is-active')
    activo?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [activeIndex])

  useEffect(() => {
    function onKeyDown(e) {
      if (vista !== 'visor') return
      if (e.key === 'ArrowRight') navigatePhoto(1)
      if (e.key === 'ArrowLeft') navigatePhoto(-1)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [vista, match])

  if (loading) return (
    <div className="fotogaleria-page__body" style={{ minHeight: '60vh' }}>
      <div className="fotogaleria-page__container" />
    </div>
  )

  if (!loading && (error || !match)) return <NotFoundState />

  const equipoNombre = EQUIPOS[match.equipo]
  const foto = match.photos[activeIndex]

  return (
    <div className="fotogaleria-page">
      <SEO
        title={`Fotos: ${equipoNombre} vs ${match.rival} | RZ Hub`}
        description={`Fotos del partido ${equipoNombre} vs ${match.rival} del ${formatMatchDate(match.matchDate)}.`}
        keywords={`fotos ${equipoNombre} ${match.rival}, fotogalería Real Zaragoza, imágenes partido Real Zaragoza`}
        path={`/fotogaleria/${match.key}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ImageGallery',
          name: `Fotos: ${equipoNombre} vs ${match.rival}`,
          url: `${SITE_URL}/fotogaleria/${match.key}`,
          isPartOf: { '@type': 'WebSite', name: 'RZ Hub', url: SITE_URL },
        }}
      />

      <div className="fotogaleria-page__body" style={{ paddingTop: 32 }}>
        <div className="fotogaleria-page__container" style={{ gap: 24 }}>

          <button type="button" className="fotogaleria-page__back" onClick={() => navigate('/fotogaleria')} style={{ marginBottom: 0 }}>
            ← Fotogalería
          </button>

          <h1 className="sr-only">Fotos: {equipoNombre} vs {match.rival}</h1>

          <div className="fotogaleria-strip">
            <div className="fotogaleria-strip__cell">
              <span className="fotogaleria-crest"><img src={ESCUDO_ZARAGOZA} alt="" /></span>
              <span className="fotogaleria-strip__name">{equipoNombre}</span>
            </div>
            <div className="fotogaleria-strip__cell fotogaleria-strip__cell--accent">
              <span className="fotogaleria-strip__vs">VS</span>
              <span className="fotogaleria-strip__date">{formatMatchDate(match.matchDate)}</span>
            </div>
            <div className="fotogaleria-strip__cell">
              <span className="fotogaleria-crest">
                {rivalCrest ? <img src={rivalCrest} alt="" /> : <span className="fotogaleria-crest-fallback">{match.rival[0]}</span>}
              </span>
              <span className="fotogaleria-strip__name">{match.rival}</span>
            </div>
          </div>

          <div className="fotogaleria-viewer">
            <div className="fotogaleria-viewer__bar">
              <span className="fotogaleria-viewer__count">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                {match.photos.length} fotos
              </span>
              {autor && <span className="fotogaleria-viewer__author">Fotos por: <strong>{autor}</strong></span>}
            </div>

            {vista === 'visor' ? (
              <>
                <div className="fotogaleria-viewer__stage">
                  <button type="button" className="fotogaleria-viewer__arrow" onClick={() => navigatePhoto(-1)} aria-label="Foto anterior">‹</button>
                  <div className="fotogaleria-viewer__image-wrap">
                    <img src={foto.url} alt={`${equipoNombre} vs ${match.rival}`} className="fotogaleria-viewer__image" />
                  </div>
                  <button type="button" className="fotogaleria-viewer__arrow" onClick={() => navigatePhoto(1)} aria-label="Foto siguiente">›</button>
                </div>

                <div className="fotogaleria-viewer__filmstrip-row">
                  <div className="fotogaleria-viewer__filmstrip" ref={filmstripRef}>
                    {match.photos.map((p, i) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`fotogaleria-viewer__thumb${i === activeIndex ? ' is-active' : ''}`}
                        onClick={() => setActiveIndex(i)}
                      >
                        <img src={p.url} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                  <button type="button" className="fotogaleria-viewer__grid-toggle" onClick={() => setVista('grid')} aria-label="Ver como cuadrícula">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="fotogaleria-grid">
                {match.photos.map((p, i) => (
                  <button key={p.id} type="button" className="fotogaleria-thumb" onClick={() => irAFoto(i)}>
                    <img src={p.url} alt={`${equipoNombre} vs ${match.rival}`} loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {autor && (
            <div className="fotogaleria-credit">
              <span className="fotogaleria-credit__avatar">{initials(autor)}</span>
              <span>
                <span className="fotogaleria-credit__eyebrow">Galería realizada por</span>
                <span className="fotogaleria-credit__name">{autor}</span>
              </span>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  )
}
