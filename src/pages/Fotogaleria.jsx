import { useEffect, useMemo, useState } from 'react'
import SEO, { SITE_URL } from '../components/SEO'
import useMatchPhotos from '../hooks/useMatchPhotos'
import Footer from '../components/Footer'
import './Fotogaleria.css'

function formatMatchDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function GallerySkeleton() {
  return (
    <div className="fotogaleria-page__skeleton" aria-hidden="true">
      <div className="rz-skeleton fotogaleria-page__skeleton-heading" />
      <div className="fotogaleria-page__skeleton-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rz-skeleton fotogaleria-page__skeleton-thumb" />
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="fotogaleria-page__state" role="status">
      <p>Todavía no hay fotos publicadas. Vuelve pronto.</p>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="fotogaleria-page__state fotogaleria-page__state--error" role="alert">
      <p>No hemos podido cargar la fotogalería. Inténtalo de nuevo.</p>
    </div>
  )
}

function Lightbox({ photos, index, onClose, onNavigate }) {
  const photo = photos[index]

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNavigate(1)
      if (e.key === 'ArrowLeft') onNavigate(-1)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, onNavigate])

  if (!photo) return null

  return (
    <div className="fotogaleria-lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <button type="button" className="fotogaleria-lightbox__close" onClick={onClose} aria-label="Cerrar">
        ✕
      </button>

      <button
        type="button"
        className="fotogaleria-lightbox__nav fotogaleria-lightbox__nav--prev"
        onClick={e => { e.stopPropagation(); onNavigate(-1) }}
        aria-label="Foto anterior"
      >
        ‹
      </button>

      <figure className="fotogaleria-lightbox__figure" onClick={e => e.stopPropagation()}>
        <img src={photo.url} alt={`Real Zaragoza vs ${photo.rival}`} />
        <figcaption>
          Real Zaragoza vs {photo.rival} · {formatMatchDate(photo.matchDate)}
        </figcaption>
      </figure>

      <button
        type="button"
        className="fotogaleria-lightbox__nav fotogaleria-lightbox__nav--next"
        onClick={e => { e.stopPropagation(); onNavigate(1) }}
        aria-label="Foto siguiente"
      >
        ›
      </button>
    </div>
  )
}

export default function Fotogaleria() {
  const { loading, error, matches } = useMatchPhotos()
  const [activeIndex, setActiveIndex] = useState(null)

  const allPhotos = useMemo(
    () => matches.flatMap(m => m.photos.map(p => ({ ...p, rival: m.rival, matchDate: m.matchDate }))),
    [matches]
  )

  function openLightbox(photo) {
    setActiveIndex(allPhotos.findIndex(p => p.id === photo.id))
  }

  function navigate(delta) {
    setActiveIndex(i => (i + delta + allPhotos.length) % allPhotos.length)
  }

  return (
    <div className="fotogaleria-page">
      <SEO
        title="Fotogalería del Real Zaragoza | RZ Hub"
        description="Fotos de los partidos del Real Zaragoza: ambiente, afición y jugadores en cada desplazamiento y jornada en La Romareda."
        keywords="fotos Real Zaragoza, fotogalería Real Zaragoza, imágenes Real Zaragoza, afición Real Zaragoza, La Romareda fotos"
        path="/fotogaleria"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ImageGallery',
          name: 'Fotogalería del Real Zaragoza',
          url: `${SITE_URL}/fotogaleria`,
          description: 'Fotos de los partidos del Real Zaragoza, organizadas por partido.',
          isPartOf: { '@type': 'WebSite', name: 'RZ Hub', url: SITE_URL },
        }}
      />

      <div className="fotogaleria-page__hero">
        <p className="rz-eyebrow rz-eyebrow--yellow fotogaleria-page__eyebrow">Real Zaragoza · Temporada 26/27</p>
        <h1 className="fotogaleria-page__title">Fotogalería</h1>
        <p className="fotogaleria-page__subtitle">Ambiente, afición y jugadores en cada partido del Real Zaragoza.</p>
      </div>

      <div className="fotogaleria-page__body">
        <div className="fotogaleria-page__container">
          {loading && <GallerySkeleton />}
          {!loading && error && <ErrorState />}
          {!loading && !error && matches.length === 0 && <EmptyState />}

          {!loading && !error && matches.map(match => (
            <section key={`${match.rival}-${match.matchDate}`} className="fotogaleria-match">
              <div className="fotogaleria-match__header">
                <h2 className="fotogaleria-match__title">Real Zaragoza vs {match.rival}</h2>
                <div className="fotogaleria-match__meta">
                  <span>{formatMatchDate(match.matchDate)}</span>
                  <span className={`rz-badge ${match.sede === 'local' ? 'rz-badge--green' : 'rz-badge--red'}`}>
                    {match.sede === 'local' ? 'Casa' : 'Fuera'}
                  </span>
                </div>
              </div>

              <div className="fotogaleria-grid">
                {match.photos.map(photo => (
                  <button
                    key={photo.id}
                    type="button"
                    className="fotogaleria-thumb"
                    onClick={() => openLightbox(photo)}
                  >
                    <img src={photo.url} alt={`Real Zaragoza vs ${match.rival}`} loading="lazy" />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <Footer />
      </div>

      {activeIndex !== null && (
        <Lightbox
          photos={allPhotos}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onNavigate={navigate}
        />
      )}
    </div>
  )
}
