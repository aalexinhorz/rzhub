import { useEffect, useState } from 'react'
import './PredictionCard.css'

const HORA_MS = 3600 * 1000
const DIA_MS = 24 * HORA_MS

/** Texto de cuenta atrás: "2 d 14 h", "5 h 32 min" o "32 min". */
function formatearCuentaAtras(ms) {
  const totalMin = Math.max(1, Math.ceil(ms / 60000))
  const dias = Math.floor(totalMin / 1440)
  const horas = Math.floor((totalMin % 1440) / 60)
  const min = totalMin % 60
  if (dias >= 1) return `${dias} d ${horas} h`
  if (horas >= 1) return `${horas} h ${min} min`
  return `${min} min`
}

/**
 * PredictionCard — bloque de conversión para "La Porra". Estado
 * PRE_MATCH del componente dinámico superior del Hero. Puramente
 * presentacional: toda la información llega por props, sin datos
 * hardcodeados ni fetch propio.
 *
 * state: 'open' (se puede jugar) | 'closed' (porra cerrada, CTA
 * deshabilitado). El estado post-partido ("Ya puedes puntuar") es un
 * componente distinto — este nunca intenta representarlo.
 */
export default function PredictionCard({
  homeTeam,
  awayTeam,
  prediction,
  participants,
  kickoff,
  state = 'open',
  onPlay,
}) {
  // La porra cierra al empezar el partido: cuenta atrás viva, refresco cada 30 s.
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])
  const restante = kickoff ? new Date(kickoff).getTime() - ahora : null
  const isClosed = state === 'closed' || (restante !== null && restante <= 0)
  const isUrgent = !isClosed && restante !== null && restante < DIA_MS
  const home = prediction?.home ?? null
  const away = prediction?.away ?? null

  return (
    <div className="prediction-card">
      <div className="prediction-card__header">
        <span className="prediction-card__icon" aria-hidden="true">
          <img src="/icono_porra_rzhub.svg" alt="" width="28" height="28" />
        </span>
        <div className="prediction-card__heading">
          <h3 className="prediction-card__title">La Porra</h3>
          <p className="prediction-card__subtitle">Juégate la camiseta oficial del Real Zaragoza</p>
        </div>
      </div>

      <div className="prediction-card__matchup">
        <div className="prediction-card__team">
          {homeTeam?.crest ? (
            <img src={homeTeam.crest} alt="" aria-hidden="true" onError={e => { e.target.style.visibility = 'hidden' }} />
          ) : (
            <span className="prediction-card__team-fallback" aria-hidden="true">{homeTeam?.name?.[0]}</span>
          )}
          <span className="prediction-card__team-name">{homeTeam?.name}</span>
        </div>

        <div className="prediction-card__score">
          <span className="prediction-card__score-label">Tu pronóstico</span>
          <div className="prediction-card__score-box">
            <span>{home ?? '–'}</span>
            <span className="prediction-card__score-sep">-</span>
            <span>{away ?? '–'}</span>
          </div>
        </div>

        <div className="prediction-card__team">
          {awayTeam?.crest ? (
            <img src={awayTeam.crest} alt="" aria-hidden="true" onError={e => { e.target.style.visibility = 'hidden' }} />
          ) : (
            <span className="prediction-card__team-fallback" aria-hidden="true">{awayTeam?.name?.[0]}</span>
          )}
          <span className="prediction-card__team-name">{awayTeam?.name}</span>
        </div>
      </div>

      <div className="prediction-card__metrics">
        <div className="prediction-card__metric">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="10" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span className="prediction-card__metric-text">
            <span className="prediction-card__metric-value">{participants.toLocaleString('es-ES')}</span>
            <span className="prediction-card__metric-label">Participantes</span>
          </span>
        </div>
        <div className={`prediction-card__metric${isUrgent ? ' prediction-card__metric--urgent' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15.5 14" />
          </svg>
          <span className="prediction-card__metric-text">
            <span className="prediction-card__metric-value">
              {isClosed ? 'Cerrada' : restante !== null ? formatearCuentaAtras(restante) : '–'}
            </span>
            <span className="prediction-card__metric-label">{isClosed ? 'Porra' : 'Cierra en'}</span>
          </span>
        </div>
      </div>

      <p className="prediction-card__rules">
        Hasta <strong>8 puntos</strong> por partido: <strong>5</strong> por el resultado exacto y <strong>3</strong> más si clavas los goleadores
      </p>

      <button
        type="button"
        className="hero-cta"
        disabled={isClosed}
        onClick={isClosed ? undefined : onPlay}
      >
        {isClosed ? 'Porra cerrada' : 'Jugar ahora →'}
      </button>
    </div>
  )
}
