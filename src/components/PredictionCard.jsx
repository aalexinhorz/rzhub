import './PredictionCard.css'

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
  rewardPoints,
  state = 'open',
  onPlay,
}) {
  const isClosed = state === 'closed'
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
          <p className="prediction-card__subtitle">Compite con la comunidad y gana premios</p>
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
        <div className="prediction-card__metric">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="12 2 15.09 8.63 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.63 12 2" />
          </svg>
          <span className="prediction-card__metric-text">
            <span className="prediction-card__metric-value">{rewardPoints}</span>
            <span className="prediction-card__metric-label">Puntos en juego</span>
          </span>
        </div>
      </div>

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
