import { Link } from 'react-router-dom'
import SEO, { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'
import usePartidos from '../hooks/usePartidos'
import { ESCUDO_ZARAGOZA, useEscudo } from '../lib/escudos'
import './Notas.css'

function formatFecha(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function PartidoCard({ partido }) {
  const rivalCrest = useEscudo(partido.rival)
  const zaragozaCrest = <img src={ESCUDO_ZARAGOZA} alt="" />
  const rivalCrestEl = rivalCrest
    ? <img src={rivalCrest} alt="" />
    : <span className="notas-marcador__crest-fallback">{partido.rival[0]}</span>

  return (
    <Link to={`/notas/${partido.partido_id}`} className="notas-index-card">
      <div className="notas-index-card__competicion">{partido.competicion}</div>
      <div className="notas-index-card__strip">
        <span className="notas-marcador__crest">{partido.local ? zaragozaCrest : rivalCrestEl}</span>
        <span className="notas-index-card__score">{partido.goles_local} - {partido.goles_visitante}</span>
        <span className="notas-marcador__crest">{partido.local ? rivalCrestEl : zaragozaCrest}</span>
      </div>
      <div className="notas-index-card__footer">
        <span>{partido.local ? 'Real Zaragoza' : partido.rival} vs {partido.local ? partido.rival : 'Real Zaragoza'}</span>
        <span>{formatFecha(partido.fecha)}</span>
      </div>
      <span className={`notas-index-card__badge${partido.estado === 'abierta' ? ' is-abierta' : ''}`}>
        {partido.estado === 'futuro' ? 'Aún no jugado' : partido.estado === 'abierta' ? 'Votación abierta' : 'Votación cerrada'}
      </span>
    </Link>
  )
}

export default function Notas() {
  const { partidos, loading } = usePartidos()

  return (
    <div className="notas-page">
      <SEO
        title="Las Notas | RZ Hub"
        description="Puntúa a los jugadores del Real Zaragoza después de cada partido."
        path="/notas"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Las Notas',
          url: `${SITE_URL}/notas`,
          isPartOf: { '@type': 'WebSite', name: 'RZ Hub', url: SITE_URL },
        }}
      />

      <div className="notas-page__hero">
        <p className="rz-eyebrow rz-eyebrow--yellow notas-page__eyebrow">Real Zaragoza · Temporada 26/27</p>
        <h1 className="notas-page__title">Las Notas</h1>
        <p className="notas-page__subtitle">Puntúa la actuación de cada jugador tras el partido.</p>
      </div>

      <div className="notas-page__body">
        <div className="notas-page__container">
          {loading ? (
            <p className="notas-page__state">Cargando partidos…</p>
          ) : partidos.length === 0 ? (
            <p className="notas-page__state">Todavía no hay partidos para puntuar.</p>
          ) : (
            <div className="notas-index-grid">
              {partidos.map(p => <PartidoCard key={p.partido_id} partido={p} />)}
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  )
}
