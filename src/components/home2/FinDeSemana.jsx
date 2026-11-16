import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cargarPartidosFinde, diaCorto, diaLargo, soloFinDeSemana } from '../../lib/finDeSemana'

// "Este fin de semana" en la home: el próximo partido de cada equipo del
// Real Zaragoza (primer equipo, filial, juvenil y femenino) de los próximos
// días, agrupados por día (datos: lib/finDeSemana.js). Si nadie juega esta
// semana, no sale.

function Tarjeta({ p }) {
  return (
    <Link to={p.enlace} className={`h2-finde__tarjeta${p.clave === 'primer' ? ' is-primer' : ''}`}>
      <span className="h2-finde__escudo">
        {p.escudo ? <img src={encodeURI(p.escudo)} alt="" loading="lazy" /> : <span>{p.rival[0]}</span>}
      </span>
      <span className="h2-finde__texto">
        <span className="h2-finde__equipo">{p.equipo}</span>
        <span className="h2-finde__rival">vs {p.rival}</span>
        <span className="h2-finde__sede">
          {p.local ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" fill="currentColor" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 19h19v2h-19zM21.4 9.6c-.2-.8-1-1.3-1.8-1.1l-5.3 1.4L7.4 3.5l-1.9.5 4.1 7.2-5 1.3-2-1.6-1.4.4 2.6 4.6 17.5-4.7c.8-.2 1.3-1 1.1-1.6z" fill="currentColor" /></svg>
          )}
          {p.local ? 'Local' : 'Visitante'}
        </span>
      </span>
      <span className="h2-finde__cuando">
        <span className="h2-finde__dia">{diaCorto(p.fecha)}</span>
        <span className={`h2-finde__hora${p.hora ? '' : ' is-sin-hora'}`}>{p.hora || 'Sin hora'}</span>
      </span>
    </Link>
  )
}

export default function FinDeSemana() {
  const [partidos, setPartidos] = useState(null)
  useEffect(() => {
    let activo = true
    cargarPartidosFinde().then(l => { if (activo) setPartidos(l) })
    return () => { activo = false }
  }, [])
  if (!partidos?.length) return null

  // Agrupados por día.
  const dias = []
  for (const p of partidos) {
    const ultimo = dias.at(-1)
    if (ultimo?.fecha === p.fecha) ultimo.lista.push(p)
    else dias.push({ fecha: p.fecha, lista: [p] })
  }
  const soloFinde = soloFinDeSemana(partidos)

  return (
    <section className="h2-seccion h2-finde" aria-labelledby="h2-finde-titulo">
      <div className="h2-contenedor">
        <div className="h2-seccion__cabecera">
          <div>
            <p className="h2-seccion__eyebrow">Primer equipo, filial, juvenil y femenino</p>
            <h2 className="h2-seccion__titulo" id="h2-finde-titulo">{soloFinde ? 'Este fin de semana' : 'Esta semana'}</h2>
          </div>
          <Link to="/cantera/deportivo-aragon" className="h2-boton h2-boton--borde">Cantera y femenino →</Link>
        </div>
        <div className="h2-finde__dias">
          {dias.map(d => (
            <div key={d.fecha} className="h2-finde__grupo">
              <p className="h2-finde__fecha">{diaLargo(d.fecha)}</p>
              <div className="h2-finde__lista">
                {d.lista.map(p => <Tarjeta key={p.clave} p={p} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
