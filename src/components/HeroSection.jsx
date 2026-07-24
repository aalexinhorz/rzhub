import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth, { supabase } from '../hooks/useAuth'
import useLiveStream from '../hooks/useLiveStream'
import { ESCUDO_ZARAGOZA, getEscudo } from '../lib/escudos'
import PredictionCard from './PredictionCard'
import LineupCard from './LineupCard'
import './HeroSection.css'

// Editable a mano por jornada: todavía no existe un campo en Supabase
// para "puntos en juego", así que se ajusta aquí directamente.
const PORRA_REWARD_POINTS = 250

const CHECKS = [
  'Crea tu alineación y compártela con la comunidad',
  'Sigue la última hora del mercado de fichajes',
  'Calendario, desplazamientos y más información',
  'Compite en la porra y gana premios',
  'Únete a la comunidad zaragocista',
]

const AVATARS = ['JG', 'MR', 'AB', 'PL', '+']

// Misma tabla de Supabase que ya usa la página Porra.jsx para este
// mismo propósito — evita depender de la API externa (sportapi7),
// cuya cuota mensual está agotada y no vuelve a resetearse sola.
// "Próximo/en curso" = el partido no finalizado con el kickoff más
// cercano. Trae de paso los participantes (nº de predicciones para
// ese partido) y, si hay usuario logueado, su propio pronóstico.
function usePorraData() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [partido, setPartido] = useState(null)
  const [participants, setParticipants] = useState(0)
  const [prediction, setPrediction] = useState(null)

  useEffect(() => {
    let cancelado = false

    async function load() {
      const { data: partidos, error } = await supabase
        .from('porra_partidos')
        .select('*')
        .eq('finalizado', false)
        .order('kickoff', { ascending: true })
        .limit(1)
      if (error) console.error('Error fetching partido:', error)
      const proximo = partidos?.[0] || null
      if (cancelado) return
      setPartido(proximo)

      if (!proximo) {
        setLoading(false)
        return
      }

      const { count } = await supabase
        .from('porra_predicciones')
        .select('*', { count: 'exact', head: true })
        .eq('partido_id', proximo.id)
      if (cancelado) return
      setParticipants(count || 0)

      if (user) {
        const { data: pred } = await supabase
          .from('porra_predicciones')
          .select('goles_zaragoza, goles_rival')
          .eq('partido_id', proximo.id)
          .eq('user_id', user.id)
          .maybeSingle()
        if (!cancelado && pred) setPrediction({ home: pred.goles_zaragoza, away: pred.goles_rival })
      }

      if (!cancelado) setLoading(false)
    }
    load()

    return () => { cancelado = true }
  }, [user])

  return { loading, partido, participants, prediction }
}

/* ============================================================
   PORRA CARD — wrapper de datos del componente dinámico superior
   del Hero Action Card. Estado PRE_MATCH: <PredictionCard>, ver
   ese componente para la UI. El estado post-partido ("Ya puedes
   puntuar") es un componente distinto que no vive aquí — como la
   query ya excluye partidos finalizados, esta card simplemente
   pasa al siguiente partido en cuanto uno se marca finalizado.
   ============================================================ */
function PorraCard({ navigate, loading, partido, participants, prediction }) {
  if (loading) {
    return (
      <div className="porra-card">
        <div className="rz-skeleton" style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-xl)' }} />
      </div>
    )
  }

  // No hay ningún partido pendiente en la tabla (fin de temporada,
  // o aún no se ha cargado el calendario): mostramos una alternativa
  // útil en vez de dejar la card vacía.
  if (!partido) {
    return (
      <div className="porra-card">
        <div className="prediction-card prediction-card--empty">
          <div>
            <h3 className="prediction-card__title">La Porra</h3>
            <p className="prediction-card__subtitle" style={{ whiteSpace: 'normal', margin: '8px 0 20px' }}>
              Ahora mismo no hay ningún partido programado.
            </p>
            <button type="button" className="hero-cta" onClick={() => navigate('/calendario')}>
              Ver calendario →
            </button>
          </div>
        </div>
      </div>
    )
  }

  const esLocal = partido.sede === 'local'
  const rivalNombre = partido.rival
  const rivalEscudo = getEscudo(rivalNombre)
  const isClosed = new Date(partido.kickoff) <= new Date()

  const zaragoza = { name: 'Real Zaragoza', crest: ESCUDO_ZARAGOZA }
  const rival = { name: rivalNombre, crest: rivalEscudo }

  return (
    <div className="porra-card">
      <PredictionCard
        homeTeam={esLocal ? zaragoza : rival}
        awayTeam={esLocal ? rival : zaragoza}
        prediction={prediction}
        participants={participants}
        rewardPoints={PORRA_REWARD_POINTS}
        state={isClosed ? 'closed' : 'open'}
        onPlay={() => navigate('/porra')}
      />
    </div>
  )
}

/* ============================================================
   LINEUP SLOT — wrapper de layout del segundo bloque del Hero
   Action Card (ver .lineup-teaser en HeroSection.css). El diseño
   vive en LineupCard.css. Comparte el mismo partido que la Porra:
   el plazo del editor cierra 1h antes del kickoff.
   ============================================================ */
function LineupSlot({ navigate, partido }) {
  const closesAt = partido
    ? new Date(new Date(partido.kickoff).getTime() - 60 * 60 * 1000).toISOString()
    : null

  return (
    <div className="lineup-teaser">
      <LineupCard
        rival={partido?.rival ?? null}
        closesAt={closesAt}
        onCreateClick={() => navigate('/lineup')}
      />
    </div>
  )
}

export default function HeroSection() {
  const navigate = useNavigate()
  const { user, signInWithGoogle } = useAuth()
  const live = useLiveStream()
  const { loading, partido, participants, prediction } = usePorraData()

  return (
    <section className="hero">
      <div className="hero__container">
        {/* Columna izquierda */}
        <div className="hero__left">
          <p className="hero__eyebrow">La web del zaragocista</p>

          <h1 className="hero__title">
            Vive el Real Zaragoza<br />Como Nunca Antes
          </h1>

          <p className="hero__desc">
            Todas las herramientas, datos y comunidad que necesitas para seguir al Real Zaragoza allá donde vayas.
          </p>

          <ul className="hero__benefits">
            {CHECKS.map(item => (
              <li key={item} className="hero__benefit">
                <span className="hero__benefit-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="hero__cta">
            {user ? (
              <button className="hero__btn-primary" onClick={() => navigate('/lineup')}>
                Crear alineación →
              </button>
            ) : (
              <>
                <button className="hero__btn-primary" onClick={signInWithGoogle}>
                  Crea tu cuenta gratis →
                </button>
                <a className="hero__btn-secondary" href="https://linktr.ee/rzhub1932" target="_blank" rel="noopener noreferrer">
                  <span className="hero__play-circle">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#ffffff"><polygon points="6,6 18,12 6,18" /></svg>
                  </span>
                  Descubre nuestras redes
                </a>
              </>
            )}
          </div>

          <div className="hero__social-proof">
            <div className="hero__avatars">
              {AVATARS.map((av, i) => (
                <div key={i} className="hero__avatar" style={{ background: i === AVATARS.length - 1 ? 'var(--rz-bg-blue)' : 'var(--rz-bg-3)', zIndex: AVATARS.length - i }}>
                  {av}
                </div>
              ))}
            </div>
            <span className="hero__social-text">
              <strong>+100</strong> zaragocistas ya forman parte
            </span>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="hero__panel">
          {live && (
            <a href={live.url} target="_blank" rel="noopener noreferrer" className="hero__card hero__live-banner" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
              <span className="rz-live-dot" style={{ background: 'var(--rz-red)' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: '#ffffff' }}>RZ Hub en directo — {live.titulo}</span>
            </a>
          )}

          <PorraCard
            navigate={navigate}
            loading={loading}
            partido={partido}
            participants={participants}
            prediction={prediction}
          />
          <LineupSlot navigate={navigate} partido={partido} />
        </div>
      </div>
    </section>
  )
}
