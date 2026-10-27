import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SEO from '../components/SEO'
import Footer from '../components/Footer'
import './NoEncontrada.css'

// Tiempo hasta que "el VAR" da su decisión (coincide con la animación CSS).
const DECISION_MS = 2400

// Jugada en vista cenital: pase al hueco, el atacante ("Tú") se adelanta a la
// última línea defensiva y el VAR traza las dos líneas. El margen es de
// 404 cm, claro.
function JugadaFueraDeJuego() {
  return (
    // En móvil el CSS le da otra proporción y "slice" recorta el lado
    // izquierdo del campo: solo se ve la jugada, más grande y legible.
    <svg className="nf-campo" viewBox="0 -24 800 494" preserveAspectRatio="xMaxYMid slice" role="img" aria-label="Repetición del VAR: el atacante está en fuera de juego por 404 centímetros">
      <defs>
        <linearGradient id="nf-cesped" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#13305f" />
          <stop offset="1" stopColor="#1d4482" />
        </linearGradient>
        <clipPath id="nf-recorte"><rect x="20" y="40" width="760" height="410" rx="14" /></clipPath>
        <marker id="nf-punta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#f5c400" />
        </marker>
      </defs>

      {/* Césped con franjas de corte */}
      <rect x="20" y="40" width="760" height="410" rx="14" fill="url(#nf-cesped)" />
      <g clipPath="url(#nf-recorte)" fill="#fff" opacity=".035">
        {[0, 2, 4, 6, 8].map(i => <rect key={i} x={20 + i * 84.4} y="40" width="84.4" height="410" />)}
      </g>

      {/* Líneas del campo */}
      <g fill="none" stroke="#f5c400" strokeWidth="3" opacity=".85">
        <rect x="20" y="40" width="760" height="410" rx="14" />
        <path d="M20 170 A75 75 0 0 1 20 320" />
        <rect x="610" y="125" width="170" height="240" />
        <rect x="720" y="190" width="60" height="110" />
        <path d="M610 205 A62 62 0 0 0 610 285" />
      </g>
      <circle cx="680" cy="245" r="4" fill="#f5c400" opacity=".85" />
      <rect x="780" y="215" width="12" height="60" rx="2" fill="none" stroke="#fff" strokeWidth="3" opacity=".7" />

      {/* Líneas del VAR */}
      <g className="nf-var">
        <line className="nf-var__linea nf-var__linea--defensa" x1="520" y1="40" x2="520" y2="450" />
        <line className="nf-var__linea nf-var__linea--ataque" x1="572" y1="40" x2="572" y2="450" />
        <g className="nf-var__medida">
          <line x1="524" y1="64" x2="568" y2="64" stroke="#f5c400" strokeWidth="2.5" markerStart="url(#nf-punta)" markerEnd="url(#nf-punta)" />
          <rect x="500" y="72" width="92" height="30" rx="6" fill="#f5c400" />
          <text x="546" y="93" textAnchor="middle" className="nf-campo__medida">404 cm</text>
        </g>
      </g>

      {/* Pase al hueco */}
      <path className="nf-pase" d="M330 330 Q450 300 560 262" fill="none" stroke="#fff" strokeWidth="2.5" strokeDasharray="8 8" />

      {/* Defensas */}
      {[[520, 160], [500, 245], [470, 370], [430, 120]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="17" fill="#e8eef9" stroke="#0b1f44" strokeWidth="3" />
          <circle cx={x} cy={y} r="6" fill="#1d4482" />
        </g>
      ))}

      {/* Compañero que da el pase, con el balón */}
      <g>
        <circle cx="318" cy="338" r="17" fill="#f5c400" stroke="#0b1f44" strokeWidth="3" />
        <circle cx="342" cy="326" r="7" fill="#fff" stroke="#0b1f44" strokeWidth="2" />
      </g>

      {/* El atacante: tú */}
      <g className="nf-atacante">
        <circle cx="572" cy="262" r="26" fill="#f5c400" opacity=".25" className="nf-atacante__halo" />
        <circle cx="572" cy="262" r="19" fill="#f5c400" stroke="#0b1f44" strokeWidth="3" />
        <text x="572" y="269" textAnchor="middle" className="nf-campo__tu">TÚ</text>
      </g>

      {/* Asistente levantando la bandera en la banda */}
      <g className="nf-juez">
        <circle cx="572" cy="22" r="8" fill="#e8eef9" />
        <g className="nf-juez__bandera">
          <line x1="572" y1="22" x2="572" y2="-8" stroke="#e8eef9" strokeWidth="3" strokeLinecap="round" />
          <path d="M572 -8 h22 l-4 7 l4 7 h-22 z" fill="#ef4444" />
        </g>
      </g>
    </svg>
  )
}

export default function NoEncontrada() {
  const { pathname } = useLocation()
  const [decidido, setDecidido] = useState(false)

  useEffect(() => {
    const reducir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const id = setTimeout(() => setDecidido(true), reducir ? 0 : DECISION_MS)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="nf-pagina">
      <SEO title="Página no encontrada | RZ Hub" description="Esta página no existe." noindex />

      <main className="nf-contenido">
        <div className={`nf-var-chip${decidido ? ' is-decidido' : ''}`} aria-live="polite">
          <span className="nf-var-chip__punto" />
          {decidido ? 'Decisión VAR: fuera de juego' : 'Revisión VAR en curso…'}
        </div>

        <div className="nf-escena">
          <JugadaFueraDeJuego />
        </div>

        <h1 className="nf-titulo">
          <span className="nf-titulo__codigo">404</span>
          <span className="nf-titulo__texto">¡Fuera de juego!</span>
        </h1>
        <p className="nf-texto">
          Te has adelantado a la defensa: la página <code className="nf-ruta">{pathname}</code> no existe o ha cambiado de sitio.
          Vuelve a tu campo y sigue jugando.
        </p>

        <div className="nf-acciones">
          <Link to="/" className="nf-boton nf-boton--amarillo">Volver al inicio</Link>
          <Link to="/proximo-partido" className="nf-boton nf-boton--borde">Próximo partido</Link>
          <Link to="/porra" className="nf-boton nf-boton--borde">Jugar a la Porra</Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
