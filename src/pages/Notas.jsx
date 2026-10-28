import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO, { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'
import PorraCTA from '../components/PorraCTA'
import usePartidos from '../hooks/usePartidos'
import { supabase } from '../hooks/useAuth'
import { ESCUDO_ZARAGOZA, useEscudo } from '../lib/escudos'
import { rankingTemporada, formatoNota, SEO_NOTAS_INDEX } from '../lib/notasSeo'
import './Notas.css'

const MAX_RANKING = 10

// Nota media de la temporada según la afición, solo con votaciones ya
// cerradas (public.notas_cerradas): las abiertas no se publican hasta que
// terminan para no condicionar el voto.
function RankingTemporada() {
  const [filas, setFilas] = useState(null)
  useEffect(() => {
    let activo = true
    supabase.rpc('notas_cerradas').then(({ data }) => { if (activo) setFilas(data || []) })
    return () => { activo = false }
  }, [])
  if (!filas) return null
  const ranking = rankingTemporada(filas).slice(0, MAX_RANKING)
  if (ranking.length === 0) return null
  const partidos = new Set(filas.map(f => f.partido_id)).size

  return (
    <section className="notas-ranking" aria-labelledby="notas-ranking-titulo">
      <h2 id="notas-ranking-titulo" className="notas-ranking__titulo">Los mejor valorados de la temporada</h2>
      <p className="notas-ranking__sub">Nota media de la afición en {partidos} partidos con la votación cerrada (mínimo 3 partidos puntuados).</p>
      <ol className="notas-ranking__lista">
        {ranking.map((j, i) => (
          <li key={j.player_id}>
            <Link to={`/jugador/${j.player_id}`} className="notas-ranking__fila">
              <span className="notas-ranking__pos">{i + 1}</span>
              <span className="notas-ranking__nombre">{j.nombre}</span>
              <span className="notas-ranking__partidos">{j.partidos} partidos</span>
              <span className="notas-ranking__nota">{formatoNota(j.media)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

function formatFecha(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatMes(dateStr) {
  const texto = new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function useMvpDelMes() {
  const [mvp, setMvp] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let activo = true
    supabase.rpc('mvp_del_mes').then(({ data }) => {
      if (activo) { setMvp(data?.[0] || null); setLoading(false) }
    })
    return () => { activo = false }
  }, [])

  return { mvp, loading }
}

// Se enseña solo en los últimos días del mes: mientras va de mitad
// hacia el principio todavía hay pocos partidos votados y el "MVP del
// mes" cambiaría de cara varias veces sin que signifique nada todavía.
function esFinalDeMes() {
  const hoy = new Date()
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
  return hoy.getDate() >= ultimoDia - 4
}

function MvpDelMes() {
  const { mvp, loading } = useMvpDelMes()
  if (loading || !mvp || !esFinalDeMes()) return null

  return (
    <div className="notas-mvp">
      <div className="notas-mvp__foto">
        <img src={mvp.photo} alt="" />
      </div>
      <div className="notas-mvp__info">
        <p className="rz-eyebrow rz-eyebrow--yellow notas-mvp__eyebrow">MVP de {formatMes(mvp.mes)}</p>
        <p className="notas-mvp__nombre">{mvp.nombre}</p>
        <p className="notas-mvp__detalle">Elegido por la afición de RZ Hub · {mvp.num_votos} votos en {mvp.partidos_votados} partidos</p>
      </div>
      <div className="notas-mvp__nota">{mvp.media}</div>
    </div>
  )
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
        title="Notas de los jugadores del Real Zaragoza 26/27: el uno a uno | RZ Hub"
        description="Las notas de la afición a los jugadores del Real Zaragoza en cada partido de la temporada 2026/27: el uno a uno, la nota media y el ranking de los mejor valorados. Puntúa tú también."
        keywords="notas Real Zaragoza, notas jugadores Real Zaragoza, uno a uno Real Zaragoza, puntuaciones Real Zaragoza, valoración jugadores Real Zaragoza, mejor jugador Real Zaragoza temporada, nota media Real Zaragoza"
        path="/notas"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Las Notas',
          description: 'Puntúa a los jugadores del Real Zaragoza después de cada partido.',
          url: `${SITE_URL}/notas`,
          isPartOf: { '@type': 'WebSite', name: 'RZ Hub', url: SITE_URL },
        }}
      />

      <div className="notas-page__hero">
        <p className="rz-eyebrow rz-eyebrow--yellow notas-page__eyebrow">Real Zaragoza · Temporada 26/27</p>
        <p className="notas-page__title">Las Notas</p>
        <h1 className="notas-page__h1">{SEO_NOTAS_INDEX.h1}</h1>
        <p className="notas-page__subtitle">{SEO_NOTAS_INDEX.intro}</p>
      </div>

      <div className="notas-page__body">
        <div className="notas-page__container">
          <MvpDelMes />

          {loading ? (
            <p className="notas-page__state">Cargando partidos…</p>
          ) : partidos.length === 0 ? (
            <p className="notas-page__state">Todavía no hay partidos para puntuar.</p>
          ) : (
            <div className="notas-index-grid">
              {partidos.map(p => <PartidoCard key={p.partido_id} partido={p} />)}
            </div>
          )}

          <RankingTemporada />
        </div>

        <PorraCTA />
        <Footer />
      </div>
    </div>
  )
}
