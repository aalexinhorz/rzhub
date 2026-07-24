import { useEffect, useState } from 'react'
import './LineupCard.css'

// Geometría del rectángulo del mini-campo dentro del viewBox 600x400
// (y=40 arriba, hacia la portería rival; y=360 abajo, portería
// propia). Vive como constante para que pitchPoint() pueda mapear
// cualquier posición porcentual (x%, y%) a coordenadas reales del
// SVG, en vez de listar puntos sueltos a mano.
const PITCH = { x0: 60, x1: 540, y0: 40, y1: 360 }

function pitchPoint(xPct, yPct) {
  const x = PITCH.x0 + (xPct / 100) * (PITCH.x1 - PITCH.x0)
  const y = PITCH.y0 + (yPct / 100) * (PITCH.y1 - PITCH.y0)
  return { x, y }
}

// Posiciones de la previsualización táctica (4-2-3-1) como
// porcentaje del terreno (y=0 portería rival, y=100 portería
// propia). Es decorativo, no una alineación real — esa se construye
// en el Lineup Builder — así que vive como datos, no como elementos
// visuales sueltos.
const FORMATION_POSITIONS = [
  { x: 50, y: 88 },
  { x: 18, y: 70 }, { x: 40, y: 70 }, { x: 60, y: 70 }, { x: 82, y: 70 },
  { x: 40, y: 53 }, { x: 60, y: 53 },
  { x: 20, y: 35 }, { x: 50, y: 35 }, { x: 80, y: 35 },
  { x: 50, y: 16 },
]

function pad(n) {
  return String(n).padStart(2, '0')
}

// Cuenta atrás hasta el cierre del editor de alineación (closesAt).
// Tick propio de 1s — el resto de la información sigue llegando por
// props, esto es el único estado "vivo" del componente. Con más de
// 24h por delante se expresa en días y horas; por debajo, en horas
// y minutos.
function useDeadline(closesAt) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!closesAt) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [closesAt])

  if (!closesAt) return null

  const diffMs = Math.max(0, new Date(closesAt).getTime() - now)
  const totalMinutes = Math.floor(diffMs / 60000)
  const totalHours = Math.floor(totalMinutes / 60)

  if (totalHours >= 24) {
    return {
      value: Math.floor(totalHours / 24), unit: 'd',
      secondaryValue: totalHours % 24, secondaryUnit: 'h',
    }
  }
  return {
    value: totalHours, unit: 'h',
    secondaryValue: totalMinutes % 60, secondaryUnit: 'm',
  }
}

/**
 * LineupCard — "Tu alineación", bloque inferior fijo del Hero Action
 * Card. No es un acceso al Lineup Builder: es una llamada a
 * participar antes de que se cierre el plazo. Toda la información
 * llega por props; la previsualización del mini-campo es decorativa
 * (formación fija), por eso no depende de ningún prop adicional.
 */
export default function LineupCard({ rival, closesAt, onCreateClick }) {
  const deadline = useDeadline(closesAt)

  return (
    <div className="lineup-card">
      <div className="lineup-card__header">
        <span className="lineup-card__icon" aria-hidden="true">
          <img src="/icono_lineup_rzhub.svg" alt="" width="20" height="20" />
        </span>
        <div className="lineup-card__heading">
          <h3 className="lineup-card__title">
            Tu alineación{rival ? ` vs ${rival}` : ''}
          </h3>
          <p className="lineup-card__subtitle">Crea tu once y compártelo con la comunidad.</p>
        </div>
      </div>

      <div className="lineup-card__main">
        <div className="lineup-card__countdown">
          {deadline ? (
            <>
              <span className="lineup-card__countdown-label">Quedan</span>
              <div className="lineup-card__countdown-values">
                <span className="lineup-card__countdown-group">
                  <span key={`a-${deadline.value}`} className="lineup-card__time-value">
                    {pad(deadline.value)}
                  </span>
                  <span className="lineup-card__countdown-unit">{deadline.unit}</span>
                </span>
                <span className="lineup-card__countdown-group">
                  <span key={`b-${deadline.secondaryValue}`} className="lineup-card__time-value">
                    {pad(deadline.secondaryValue)}
                  </span>
                  <span className="lineup-card__countdown-unit">{deadline.secondaryUnit}</span>
                </span>
              </div>
              <span className="lineup-card__countdown-caption">para cerrar tu alineación</span>
            </>
          ) : (
            <span className="lineup-card__countdown-caption">Aún no hay un próximo partido programado.</span>
          )}
        </div>

        <div className="lineup-card__preview">
          <div className="lineup-card__pitch-wrapper">
            <div className="lineup-card__pitch">
              <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <defs>
                  <radialGradient id="pitchGradient" cx="50%" cy="42%" r="75%">
                    <stop offset="0%" stopColor="#10234f" />
                    <stop offset="100%" stopColor="#050f24" />
                  </radialGradient>
                  <filter id="pitchDotGlow" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Límites del terreno: rectángulo con esquinas redondeadas */}
                <rect
                  x="60" y="40" width="480" height="320" rx="24" ry="24"
                  fill="url(#pitchGradient)"
                  stroke="#2d6ed4"
                  strokeOpacity="0.78"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />

                {/* Marcas secundarias: medio campo, círculo, áreas */}
                <g fill="none" stroke="#2d6ed4" strokeOpacity="0.55" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
                  <path d="M60 200 L540 200" />
                  <circle cx="300" cy="200" r="42" />

                  <path d="M150 40 L150 94 L450 94 L450 40" />
                  <path d="M204 40 L204 66 L396 66 L396 40" />
                  <path d="M266 94 A34 34 0 0 0 334 94" />

                  <path d="M150 360 L150 306 L450 306 L450 360" />
                  <path d="M204 360 L204 334 L396 334 L396 360" />
                  <path d="M266 306 A34 34 0 0 1 334 306" />
                </g>
                <circle cx="300" cy="200" r="4" fill="#2d6ed4" fillOpacity="0.55" />

                {FORMATION_POSITIONS.map((p, i) => {
                  const { x, y } = pitchPoint(p.x, p.y)
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="9"
                      fill="#ffc800"
                      stroke="rgba(255,255,255,0.55)"
                      strokeWidth="1"
                      filter="url(#pitchDotGlow)"
                    />
                  )
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>

      <button type="button" className="hero-cta lineup-card__cta" onClick={onCreateClick}>
        Crear mi alineación →
      </button>
    </div>
  )
}
