import { useEffect, useState } from 'react'
import { cargarOpinionAficion, marcadorEnOrden } from '../lib/porraStats'
import './OpinionAficion.css'

// `partido`: fila de porra_partidos (id, rival, sede).
export default function OpinionAficion({ partido, titulo = 'Qué piensa la afición', minimo = 3 }) {
  const [opinion, setOpinion] = useState(null)

  useEffect(() => {
    let activo = true
    cargarOpinionAficion(partido.id).then(o => { if (activo) setOpinion(o) })
    return () => { activo = false }
  }, [partido.id])

  if (!opinion || opinion.total < minimo) return null

  const zaragozaLocal = partido.sede === 'local'
  const local = zaragozaLocal ? 'Real Zaragoza' : partido.rival
  const visitante = zaragozaLocal ? partido.rival : 'Real Zaragoza'
  const filas = [
    { etiqueta: 'Gana el Real Zaragoza', pct: opinion.gana, destacada: true },
    { etiqueta: 'Empate', pct: opinion.empata },
    { etiqueta: `Gana el ${partido.rival}`, pct: opinion.pierde },
  ]
  const top = opinion.marcadores[0]

  return (
    <section className="opinion-aficion" aria-labelledby={`opinion-${partido.id}`}>
      <h2 id={`opinion-${partido.id}`} className="opinion-aficion__titulo">{titulo}</h2>
      <p className="opinion-aficion__subtitulo">
        {local} - {visitante} · {opinion.total.toLocaleString('es-ES')} pronósticos en la porra
      </p>

      <div className="opinion-aficion__barras">
        {filas.map(f => (
          <div key={f.etiqueta} className="opinion-aficion__fila">
            <span className="opinion-aficion__etiqueta">{f.etiqueta}</span>
            <span className="opinion-aficion__barra">
              <span className={`opinion-aficion__relleno${f.destacada ? ' is-destacada' : ''}`} style={{ width: `${f.pct}%` }} />
            </span>
            <span className="opinion-aficion__pct">{f.pct}%</span>
          </div>
        ))}
      </div>

      <div className="opinion-aficion__datos">
        {top && (
          <p>
            <strong>Resultado más votado:</strong> {local} {marcadorEnOrden(top.marcador, zaragozaLocal)} {visitante} ({top.pct}%)
          </p>
        )}
        {opinion.goleadores.length > 0 && (
          <p>
            <strong>Goleadores favoritos:</strong> {opinion.goleadores.map(g => `${g.nombre} (${g.pct}%)`).join(', ')}
          </p>
        )}
      </div>
    </section>
  )
}
