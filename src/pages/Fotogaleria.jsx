import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO, { SITE_URL } from '../components/SEO'
import useMatchPhotos, { EQUIPOS } from '../hooks/useMatchPhotos'
import Footer from '../components/Footer'
import { ESCUDO_ZARAGOZA, useEscudo } from '../lib/escudos'
import './Fotogaleria.css'

const TABS = [{ id: 'todos', label: 'Todos' }, ...Object.entries(EQUIPOS).map(([id, label]) => ({ id, label }))]

function formatShortDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function GallerySkeleton() {
  return (
    <div className="fotogaleria-page__skeleton-grid" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rz-skeleton fotogaleria-page__skeleton-card" />
      ))}
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

function MatchCard({ match }) {
  const rivalCrest = useEscudo(match.rival)

  return (
    <Link to={`/fotogaleria/${encodeURIComponent(match.key)}`} className="fotogaleria-card">
      <div className="fotogaleria-card__cover">
        <img src={match.photos[0].url} alt={`${EQUIPOS[match.equipo]} vs ${match.rival}`} loading="lazy" />
        <span className="fotogaleria-card__count">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          {match.photos.length}
        </span>
      </div>

      <div className="fotogaleria-card__boxes">
        {match.sede === 'visitante' && (
          <span className="fotogaleria-card__box">
            <span className="fotogaleria-crest">
              {rivalCrest ? <img src={rivalCrest} alt="" /> : <span className="fotogaleria-crest-fallback">{match.rival[0]}</span>}
            </span>
            <span className="fotogaleria-card__box-label">{match.rival}</span>
          </span>
        )}
        <span className="fotogaleria-card__box">
          <span className="fotogaleria-crest"><img src={ESCUDO_ZARAGOZA} alt="" /></span>
          <span className="fotogaleria-card__box-label">{EQUIPOS[match.equipo]}</span>
        </span>
        <span className="fotogaleria-card__box">
          <span className="fotogaleria-crest fotogaleria-crest--icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M3 10h18M8 2v4M16 2v4" />
            </svg>
          </span>
          <span className="fotogaleria-card__box-label">{formatShortDate(match.matchDate)}</span>
        </span>
        {match.sede !== 'visitante' && (
          <span className="fotogaleria-card__box">
            <span className="fotogaleria-crest">
              {rivalCrest ? <img src={rivalCrest} alt="" /> : <span className="fotogaleria-crest-fallback">{match.rival[0]}</span>}
            </span>
            <span className="fotogaleria-card__box-label">{match.rival}</span>
          </span>
        )}
      </div>
    </Link>
  )
}

export default function Fotogaleria() {
  const { loading, error, matches } = useMatchPhotos()
  const [tab, setTab] = useState('primer-equipo')

  const filtered = useMemo(
    () => (tab === 'todos' ? matches : matches.filter(m => m.equipo === tab)),
    [matches, tab]
  )

  return (
    <div className="fotogaleria-page">
      <SEO
        title="Fotogalería del Real Zaragoza | RZ Hub"
        description="Fotos de los partidos del Real Zaragoza y el Deportivo Aragón: ambiente, afición y jugadores en cada desplazamiento y jornada."
        keywords="fotos Real Zaragoza, fotogalería Real Zaragoza, imágenes Real Zaragoza, afición Real Zaragoza, Deportivo Aragón fotos"
        path="/fotogaleria"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ImageGallery',
          name: 'Fotogalería del Real Zaragoza',
          url: `${SITE_URL}/fotogaleria`,
          description: 'Fotos de los partidos del Real Zaragoza y el Deportivo Aragón, organizadas por partido.',
          isPartOf: { '@type': 'WebSite', name: 'RZ Hub', url: SITE_URL },
        }}
      />

      <div className="fotogaleria-page__hero">
        <p className="rz-eyebrow rz-eyebrow--yellow fotogaleria-page__eyebrow">Real Zaragoza · Temporada 26/27</p>
        <h1 className="fotogaleria-page__title">Fotogalería</h1>
        <p className="fotogaleria-page__subtitle">Ambiente, afición y jugadores en cada partido del Real Zaragoza y el Deportivo Aragón.</p>
      </div>

      <div className="fotogaleria-page__body">
        <div className="fotogaleria-page__container">
          <div className="fotogaleria-tabs" role="tablist">
            {TABS.map(t => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`fotogaleria-tabs__item${tab === t.id ? ' is-active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading && <GallerySkeleton />}
          {!loading && error && <ErrorState />}
          {!loading && !error && filtered.length === 0 && <EmptyState />}

          {!loading && !error && filtered.length > 0 && (
            <div className="fotogaleria-page__cards">
              {filtered.map(match => (
                <MatchCard key={match.key} match={match} />
              ))}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  )
}
