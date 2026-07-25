import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth, { supabase } from '../hooks/useAuth'
import useLiveStream from '../hooks/useLiveStream'
import useNextMatch from '../hooks/useNextMatch'
import { ESCUDO_ZARAGOZA, getEscudo } from '../lib/escudos'
import PredictionCard from './PredictionCard'
import LineupCard from './LineupCard'
import './HeroSection.css'

const PORRA_REWARD_POINTS = 250

const CHECKS = [
  'Crea tu alineación y compártela con la comunidad',
  'Sigue la última hora del mercado de fichajes',
  'Calendario, desplazamientos y más información',
  'Compite en la porra y gana premios',
  'Únete a la comunidad zaragocista',
]

const AVATARS = ['JG', 'MR', 'AB', 'PL', '+']

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

      if (!proximo) { setLoading(false); return }

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

function PorraCard({ navigate, loading, partido, participants, prediction }) {
  if (loading) {
    return (
      <div className="porra-card">
        <div className="rz-skeleton" style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-xl)' }} />
      </div>
    )
  }

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

function LineupSlot({ navigate, partido, nextMatch }) {
  const kickoff = nextMatch?.date
    ? nextMatch.date.toISOString()
    : partido?.kickoff || null

  const rival = nextMatch?.summary
    ? nextMatch.summary.replace(/Real Zaragoza\s*[-vs]+\s*/i, '').replace(/\s*[-vs]+\s*Real Zaragoza/i, '').trim()
    : partido?.rival || null

  const closesAt = kickoff
    ? new Date(new Date(kickoff).getTime() - 60 * 60 * 1000).toISOString()
    : null

  console.log('nextMatch:', nextMatch)
  console.log('closesAt:', closesAt)

  return (
    <div className="lineup-teaser">
      <LineupCard
        rival={rival}
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
  const { nextMatch } = useNextMatch()

  return (
    <section className="hero">
      <div className="hero__container">
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
          <LineupSlot navigate={navigate} partido={partido} nextMatch={nextMatch} />
        </div>
      </div>
    </section>
  )
}