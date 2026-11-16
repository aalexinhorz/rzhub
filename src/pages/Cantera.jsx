import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import SEO from '../components/SEO'
import Footer from '../components/Footer'
import {
  EQUIPOS_OTROS, equipoPorSlug, escudoOtro, esPropio, fechaCorta, nombreVisible, partidosPropios, resultadoPropio,
  rutaCantera, textoTemporada, useOtroEquipo,
} from '../lib/otrosEquipos'
import { seoCantera } from '../lib/otrosEquiposDatos'
import { migas } from '../lib/seoPaginas'
import './Cantera.css'

// Cantera y femenino: Deportivo Aragón (filial), Juvenil A y Femenino, con
// su próximo partido, el último resultado, todos sus partidos y la
// clasificación de su grupo. Los datos vienen de otros_equipos_* (BeSoccer,
// cada 2 h). Cada equipo tiene su URL (/cantera/deportivo-aragon, /juvenil,
// /femenino) con su título y descripción, para que Google indexe cada uno.

const RESULTADO = { V: 'Victoria', E: 'Empate', D: 'Derrota' }

function Escudo({ id, nombre, tamaño = 'normal' }) {
  const src = escudoOtro(id, nombre)
  return src
    ? <img src={src} alt="" className={`cant-escudo cant-escudo--${tamaño}`} loading="lazy" />
    : <span className={`cant-escudo cant-escudo--${tamaño} cant-escudo--vacio`}>{nombreVisible(nombre)[0]}</span>
}

function TarjetaPartido({ titulo, partido, equipo }) {
  if (!partido) return null
  const jugado = partido.goles_local != null
  const r = resultadoPropio(equipo, partido)
  return (
    <article className="cant-partido">
      <header className="cant-partido__cabecera">
        <span>{titulo}</span>
        {r && <span className={`cant-res cant-res--${r}`}>{RESULTADO[r]}</span>}
      </header>
      <div className="cant-partido__equipos">
        {[['local', partido.local, partido.local_id], ['visitante', partido.visitante, partido.visitante_id]].map(([lado, nombre, id], i) => (
          <div key={lado} className={`cant-partido__equipo${esPropio(equipo, nombre) ? ' is-propio' : ''}`} style={{ order: i * 2 }}>
            <Escudo id={id} nombre={nombre} tamaño="grande" />
            <span>{nombreVisible(nombre)}</span>
          </div>
        ))}
        <div className="cant-partido__marcador" style={{ order: 1 }}>
          {jugado ? `${partido.goles_local} - ${partido.goles_visitante}` : partido.hora || 'vs'}
        </div>
      </div>
      <p className="cant-partido__pie">Jornada {partido.jornada} · {fechaCorta(partido)}</p>
    </article>
  )
}

export default function Cantera() {
  const { equipo: slug } = useParams()
  const equipo = equipoPorSlug(slug)
  if (!equipo) return <Navigate to={rutaCantera(EQUIPOS_OTROS[0])} replace />
  return <PaginaEquipo key={equipo.id} equipo={equipo} />
}

function PaginaEquipo({ equipo }) {
  const { partidos, clasificacion, temporada } = useOtroEquipo(equipo.id)

  const propios = useMemo(() => partidosPropios(equipo, partidos), [equipo, partidos])
  const jugados = propios.filter(p => p.goles_local != null)
  const ultimo = jugados.at(-1) || null
  // El próximo es el primero sin jugar desde hoy (un aplazado antiguo no cuenta).
  const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' })
  const proximo = propios.find(p => p.goles_local == null && p.estado !== 'finalizado' && (!p.fecha || p.fecha >= hoy)) || null
  const fila = (clasificacion || []).find(f => f.nombre === equipo.propio)
  const zonas = Object.entries(equipo.zonas || {}).filter(([z]) => (clasificacion || []).some(f => f.zona === z))
  const actualizado = (clasificacion || [])[0]?.updated_at
  const seo = seoCantera(equipo, clasificacion)

  return (
    <div className="cant-page">
      <SEO
        title={seo.title}
        description={seo.description}
        path={rutaCantera(equipo)}
        jsonLd={migas([['Cantera y femenino', rutaCantera(EQUIPOS_OTROS[0])], [equipo.nombre, rutaCantera(equipo)]])}
      />
      <div className="cant-contenedor">
        <header className="cant-cabecera">
          <p className="cant-eyebrow">Cantera y femenino del Real Zaragoza</p>
          <h1 className="cant-titulo">{seo.h1}</h1>
          <p className="cant-intro">Resultados, próximo partido y clasificación de {equipo.nombre}, {equipo.quien}, en {equipo.competicion} ({equipo.grupo}). Se actualiza sola varias veces al día.</p>
        </header>

        <nav className="cant-pestanas" aria-label="Equipo">
          {EQUIPOS_OTROS.map(e => (
            <Link key={e.id} to={rutaCantera(e)} className={`cant-pestana${e.id === equipo.id ? ' is-activa' : ''}`}
              aria-current={e.id === equipo.id ? 'page' : undefined}>
              <span className="cant-pestana__nombre">{e.pestaña}</span>
              <span className="cant-pestana__comp">{e.competicion}</span>
            </Link>
          ))}
        </nav>

        <section className="cant-equipo">
          <Escudo id={fila?.equipo_id} nombre={equipo.propio} tamaño="grande" />
          <div>
            <h2 className="cant-equipo__nombre">{equipo.competicion}</h2>
            <p className="cant-equipo__comp">{equipo.grupo}{temporada ? ` · Temporada ${textoTemporada(temporada)}` : ''}</p>
          </div>
          {fila && (
            <div className="cant-equipo__datos">
              <span><b>{fila.pos}º</b> puesto</span>
              <span><b>{fila.pts}</b> puntos</span>
              <span><b>{fila.g}-{fila.e}-{fila.p}</b> V-E-D</span>
            </div>
          )}
        </section>

        {!partidos ? (
          <p className="cant-estado">Cargando…</p>
        ) : !propios.length ? (
          <p className="cant-estado">Todavía no hay partidos de este equipo. Vuelve en un rato.</p>
        ) : (
          <>
            <div className="cant-destacados">
              <TarjetaPartido titulo="Próximo partido" partido={proximo} equipo={equipo} />
              <TarjetaPartido titulo="Último resultado" partido={ultimo} equipo={equipo} />
            </div>

            <div className="cant-columnas">
              <section className="cant-tarjeta">
                <h2 className="cant-tarjeta__titulo">Partidos</h2>
                <ul className="cant-lista">
                  {propios.map(p => {
                    const r = resultadoPropio(equipo, p)
                    const jugado = p.goles_local != null
                    return (
                      <li key={p.id} className={`cant-fila${p === proximo ? ' is-proximo' : ''}`}>
                        <span className="cant-fila__j">J{p.jornada}</span>
                        <span className="cant-fila__fecha">{fechaCorta(p)}</span>
                        <span className={`cant-fila__eq cant-fila__eq--local${esPropio(equipo, p.local) ? ' is-propio' : ''}`}>
                          <span className="cant-fila__nombre">{nombreVisible(p.local)}</span><Escudo id={p.local_id} nombre={p.local} />
                        </span>
                        <span className={`cant-fila__marcador${r ? ` cant-fila__marcador--${r}` : ''}`}>
                          {jugado ? `${p.goles_local}-${p.goles_visitante}` : p.estado && p.estado !== 'por jugar' ? p.estado : '–'}
                        </span>
                        <span className={`cant-fila__eq${esPropio(equipo, p.visitante) ? ' is-propio' : ''}`}>
                          <Escudo id={p.visitante_id} nombre={p.visitante} /><span className="cant-fila__nombre">{nombreVisible(p.visitante)}</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </section>

              <section className="cant-tarjeta">
                <h2 className="cant-tarjeta__titulo">Clasificación</h2>
                {!clasificacion?.length ? <p className="cant-estado">Sin clasificación todavía.</p> : (
                  <>
                    <table className="cant-tabla">
                      <thead>
                        <tr><th>#</th><th className="cant-tabla__equipo">Equipo</th><th>PJ</th><th className="cant-ocultable">G</th><th className="cant-ocultable">E</th><th className="cant-ocultable">P</th><th>DG</th><th>Pts</th></tr>
                      </thead>
                      <tbody>
                        {clasificacion.map(f => (
                          <tr key={f.pos} className={`cant-tabla__fila${f.zona && equipo.zonas?.[f.zona] ? ` cant-zona--${f.zona}` : ''}${f.nombre === equipo.propio ? ' is-propio' : ''}`}>
                            <td className="cant-tabla__pos">{f.pos}</td>
                            <td className="cant-tabla__equipo"><span><Escudo id={f.equipo_id} nombre={f.nombre} />{nombreVisible(f.nombre)}</span></td>
                            <td>{f.pj}</td>
                            <td className="cant-ocultable">{f.g}</td>
                            <td className="cant-ocultable">{f.e}</td>
                            <td className="cant-ocultable">{f.p}</td>
                            <td>{f.gf - f.gc > 0 ? `+${f.gf - f.gc}` : f.gf - f.gc}</td>
                            <td className="cant-tabla__pts">{f.pts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {zonas.length > 0 && (
                      <div className="cant-leyenda">
                        {zonas.map(([z, texto]) => <span key={z}><i className={`cant-punto cant-zona--${z}`} />{texto}</span>)}
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          </>
        )}

        <p className="cant-fuente">
          Datos: BeSoccer.
          {actualizado && ` Última actualización: ${new Date(actualizado).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.`}
        </p>

        <nav className="cant-enlaces" aria-label="Más sobre el Real Zaragoza">
          <Link to="/clasificacion">Clasificación del primer equipo →</Link>
          <Link to="/calendario">Calendario del Real Zaragoza →</Link>
        </nav>
      </div>
      <Footer />
    </div>
  )
}
