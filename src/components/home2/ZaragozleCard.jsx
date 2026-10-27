import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fechaHoyMadrid, numeroPuzzle, leerPartida, calcularRacha } from '../../lib/zaragozleRacha'

// Tarjeta del Zaragozle en la home: reto de hoy, tu partida en cuadritos y
// la racha de días seguidos (todo leído del localStorage del juego).
export default function ZaragozleCard() {
  const [{ hoy, partida, racha }] = useState(() => {
    const fecha = fechaHoyMadrid()
    return { hoy: fecha, partida: leerPartida(fecha), racha: calcularRacha(fecha) }
  })
  const estado = partida?.estado || 'jugando'
  const intentos = partida?.intentos || []
  const terminada = estado === 'ganado' || estado === 'perdido'

  return (
    <Link to="/zaragozle" className="h2-card h2-zgl">
      <div className="h2-card__cabecera">
        <span className="h2-card__eyebrow">Juego diario</span>
        <span className="h2-pill">#{numeroPuzzle(hoy)}</span>
      </div>
      <h3 className="h2-card__titulo">Zaragozle</h3>
      <p className="h2-card__texto">Adivina el jugador del Real Zaragoza del día.</p>

      <div className="h2-zgl__racha">
        <span className={`h2-zgl__fuego${racha.actual > 0 ? ' is-activa' : ''}`} aria-hidden="true">🔥</span>
        <span className="h2-zgl__num">{racha.actual}</span>
        <span className="h2-zgl__etq">{racha.actual === 1 ? 'día seguido' : 'días seguidos'}</span>
        <span className="h2-zgl__mejor">Mejor: {racha.mejor}</span>
      </div>

      {intentos.length > 0 ? (
        <div className="h2-zgl__tablero" aria-label="Tu partida de hoy">
          {intentos.map((f, i) => (
            <div key={i} className="h2-zgl__fila">
              {f.resultado.map((r, j) => <span key={j} className={`h2-zgl__casilla is-${r}`} />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="h2-zgl__tablero h2-zgl__tablero--vacio" aria-hidden="true">
          {[0, 1, 2].map(i => (
            <div key={i} className="h2-zgl__fila">
              {[0, 1, 2, 3, 4, 5].map(j => <span key={j} className="h2-zgl__casilla" />)}
            </div>
          ))}
        </div>
      )}

      <span className="h2-boton h2-boton--amarillo h2-boton--bloque">
        {estado === 'ganado' ? `¡Acertado en ${intentos.length}! Ver resultado` : terminada ? 'Ver la palabra de hoy' : intentos.length ? 'Seguir jugando →' : racha.actual > 0 ? 'Jugar y mantener la racha →' : 'Jugar el reto de hoy →'}
      </span>
    </Link>
  )
}
