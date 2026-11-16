import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import Footer from '../components/Footer'
import { supabase } from '../hooks/useAuth'
import { escudoDe } from '../lib/graficosComun'
import { faqPrediccion, migas, ordenPrediccion, porcentaje as pct, preguntasPrediccion, probabilidadesEquipo, seoPrediccion } from '../lib/seoPaginas'
import './Prediccion.css'

// Predicción de la liga (Primera Federación, Grupo 2): probabilidades de
// cada equipo según 50.000 simulaciones del resto de la temporada (modelo
// de Poisson + Monte Carlo, función prediccion-liga, tabla prediccion_liga).
// Una fila por jornada, así que también se enseña la evolución.

const EQUIPO = 'Real Zaragoza'
const sinComillas = n => (n || '').replace(/["“”]/g, '').trim()
const directo = e => probabilidadesEquipo(e).directo
const playoff = e => probabilidadesEquipo(e).playoff
const descenso = e => probabilidadesEquipo(e).descenso
const num = (x, d = 1) => x.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d })

function Escudo({ nombre }) {
  const src = escudoDe(sinComillas(nombre))
  return src ? <img src={encodeURI(src)} alt="" className="pred-escudo" loading="lazy" /> : <span className="pred-escudo pred-escudo--vacio">{sinComillas(nombre)[0]}</span>
}

// Evolución jornada a jornada (dos series, un solo eje 0-100 %).
const SERIES = [
  { clave: 'directo', nombre: 'Acabar 1º (ascenso directo)', color: '#b88a00', valor: directo },
  { clave: 'top5', nombre: 'Acabar entre los 5 primeros', color: '#3a74d9', valor: e => directo(e) + playoff(e) },
]
function Evolucion({ historial }) {
  const [hover, setHover] = useState(null)
  const caja = useRef(null)
  // Se dibuja al ancho real (en el móvil, reducir un SVG ancho deja el texto diminuto).
  const [W, setW] = useState(720)
  useEffect(() => {
    const el = caja.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const estrecho = W < 520
  const H = estrecho ? 230 : 280, M = { t: 16, r: estrecho ? 48 : 64, b: 34, l: 40 }
  const jornadas = historial.map(h => h.jornada)
  const x = j => M.l + (jornadas.length > 1 ? (j - jornadas[0]) / (jornadas.at(-1) - jornadas[0]) : 0.5) * (W - M.l - M.r)
  const y = v => M.t + (1 - v) * (H - M.t - M.b)
  const puntos = SERIES.map(s => historial.map(h => [x(h.jornada), y(s.valor(h.rz)), s.valor(h.rz)]))

  const mover = e => {
    const r = caja.current.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    let mejor = 0
    historial.forEach((h, i) => { if (Math.abs(x(h.jornada) - px) < Math.abs(x(historial[mejor].jornada) - px)) mejor = i })
    setHover(mejor)
  }
  const h = hover != null ? historial[hover] : null

  return (
    <div className="pred-evolucion">
      <div className="pred-leyenda" aria-hidden="true">
        {SERIES.map(s => <span key={s.clave}><i style={{ background: s.color }} />{s.nombre}</span>)}
      </div>
      <div className="pred-grafica" ref={caja} onPointerMove={mover} onPointerLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Evolución de la probabilidad del Real Zaragoza por jornada">
          {[0, 0.25, 0.5, 0.75, 1].map(v => (
            <g key={v}>
              <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} className="pred-grafica__rejilla" />
              <text x={M.l - 8} y={y(v) + 4} className="pred-grafica__eje" textAnchor="end">{v * 100}%</text>
            </g>
          ))}
          {jornadas.filter((j, i) => !estrecho || i % 2 === (jornadas.length - 1) % 2).map(j => (
            <text key={j} x={x(j)} y={H - 10} className="pred-grafica__eje" textAnchor="middle">J{j}</text>
          ))}
          {h && <line x1={x(h.jornada)} x2={x(h.jornada)} y1={M.t} y2={H - M.b} className="pred-grafica__cruz" />}
          {SERIES.map((s, si) => (
            <g key={s.clave}>
              <polyline points={puntos[si].map(p => `${p[0]},${p[1]}`).join(' ')} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {puntos[si].map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r={hover === i || i === puntos[si].length - 1 ? 5 : 0} fill={s.color} stroke="#0a1730" strokeWidth="2" />
              ))}
              <text x={puntos[si].at(-1)[0] + 10} y={puntos[si].at(-1)[1] + 4} className="pred-grafica__etiqueta">{pct(puntos[si].at(-1)[2], 0)}</text>
            </g>
          ))}
        </svg>
        {h && (
          <div className="pred-tooltip" style={{ left: `${(x(h.jornada) / W) * 100}%` }}>
            <b>Tras la jornada {h.jornada}</b>
            {SERIES.map(s => <span key={s.clave}><i style={{ background: s.color }} />{s.nombre}: <b>{pct(s.valor(h.rz))}</b></span>)}
            <span>Puntos esperados: <b>{num(h.rz.pts_esperados)}</b></span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Prediccion() {
  const [filas, setFilas] = useState(null)

  useEffect(() => {
    let activo = true
    supabase.from('prediccion_liga').select('*').order('temporada', { ascending: false }).order('jornada')
      .then(({ data }) => {
        if (!activo) return
        const temporada = data?.at(-1)?.temporada
        setFilas((data || []).filter(f => f.temporada === temporada).sort((a, b) => a.jornada - b.jornada))
      })
    return () => { activo = false }
  }, [])

  const actual = filas?.at(-1) || null
  const equipos = useMemo(
    () => (actual ? ordenPrediccion(actual) : []),
    [actual],
  )
  const rz = equipos.find(e => sinComillas(e.equipo) === EQUIPO)
  const historial = useMemo(
    () => (filas || []).map(f => ({ jornada: f.jornada, rz: f.equipos.find(e => sinComillas(e.equipo) === EQUIPO) })).filter(h => h.rz),
    [filas],
  )

  const seo = seoPrediccion(actual)

  return (
    <div className="pred-page">
      <SEO
        title={seo.title}
        description={seo.description}
        path="/prediccion"
        jsonLd={[
          migas([['Clasificación', '/clasificacion'], ['Predicción', '/prediccion']]),
          ...(actual ? [faqPrediccion(actual)] : []),
        ]}
      />
      <div className="pred-contenedor">
        <header className="pred-cabecera">
          <p className="pred-eyebrow">Predicción · Primera Federación · Grupo 2{actual ? ` · ${actual.temporada.replace('-', '/')}` : ''}</p>
          <h1 className="pred-titulo">Probabilidad de ascenso</h1>
          <p className="pred-intro">
            {actual ? `Tras la jornada ${actual.jornada}. ` : ''}Simulamos {actual ? actual.simulaciones.toLocaleString('es-ES') : '50.000'} veces lo que queda de liga, partido a partido, con la fuerza en ataque y en defensa de cada equipo según sus resultados. Se actualiza sola tras cada jornada.
          </p>
        </header>

        {!filas ? <p className="pred-estado">Cargando predicción…</p> : !actual ? <p className="pred-estado">Todavía no hay predicción.</p> : (
          <>
            {rz && (
              <section className="pred-rz" aria-label="Real Zaragoza">
                <div className="pred-rz__equipo"><Escudo nombre={EQUIPO} /><span>Real Zaragoza</span></div>
                <div className="pred-rz__datos">
                  <div className="pred-dato pred-dato--grande"><b>{pct(directo(rz))}</b><span>Ascenso directo (1º)</span></div>
                  <div className="pred-dato"><b>{pct(playoff(rz))}</b><span>Play-off (2º-5º)</span></div>
                  <div className="pred-dato"><b>{pct(descenso(rz))}</b><span>Descenso</span></div>
                  <div className="pred-dato"><b>{num(rz.pts_esperados)}</b><span>Puntos esperados (ahora {rz.pts_actuales})</span></div>
                </div>
              </section>
            )}

            {historial.length > 1 && (
              <section className="pred-tarjeta">
                <h2 className="pred-tarjeta__titulo">Evolución del Real Zaragoza</h2>
                <Evolucion historial={historial} />
              </section>
            )}

            <section className="pred-tarjeta">
              <h2 className="pred-tarjeta__titulo">Probabilidades de todos los equipos</h2>
              <div className="pred-scroll">
                <table className="pred-tabla">
                  <thead>
                    <tr>
                      <th>#</th><th className="pred-tabla__equipo">Equipo</th><th>Pts</th><th>Pts esperados</th>
                      <th>1º</th><th>Play-off</th><th>Descenso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipos.map((e, i) => (
                      <tr key={e.equipo} className={sinComillas(e.equipo) === EQUIPO ? 'is-rz' : ''}>
                        <td className="pred-tabla__pos">{i + 1}</td>
                        <td className="pred-tabla__equipo"><span><Escudo nombre={e.equipo} />{sinComillas(e.equipo)}</span></td>
                        <td>{e.pts_actuales}</td>
                        <td className="pred-tabla__fuerte">{num(e.pts_esperados)}</td>
                        <td><span className="pred-barra" style={{ '--p': directo(e), '--c': '#b88a00' }}>{pct(directo(e))}</span></td>
                        <td><span className="pred-barra" style={{ '--p': playoff(e), '--c': '#3a74d9' }}>{pct(playoff(e))}</span></td>
                        <td><span className="pred-barra" style={{ '--p': descenso(e), '--c': '#c0392b' }}>{pct(descenso(e))}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="pred-tarjeta">
              <h2 className="pred-tarjeta__titulo">Puesto final: probabilidad de cada equipo</h2>
              <p className="pred-nota">Cuanto más intenso el color, más probable. Pasa el ratón (o toca) una casilla para ver el porcentaje.</p>
              <div className="pred-scroll">
                <table className="pred-mapa">
                  <thead>
                    <tr><th className="pred-tabla__equipo">Equipo</th>{equipos.map((_, i) => <th key={i} className={i === 0 ? 'z-asc' : i < 5 ? 'z-play' : i >= 15 ? 'z-desc' : ''}>{i + 1}</th>)}</tr>
                  </thead>
                  <tbody>
                    {equipos.map(e => (
                      <tr key={e.equipo} className={sinComillas(e.equipo) === EQUIPO ? 'is-rz' : ''}>
                        <td className="pred-tabla__equipo"><span><Escudo nombre={e.equipo} />{sinComillas(e.equipo)}</span></td>
                        {e.puestos.map((p, i) => {
                          // Raíz cuadrada: así también se ven los equipos con
                          // la probabilidad repartida entre muchos puestos.
                          const intensidad = Math.min(1, Math.sqrt(p) * 1.5)
                          return (
                            <td key={i} title={`${sinComillas(e.equipo)}, ${i + 1}º: ${pct(p)}`} style={{ '--p': intensidad }} className={intensidad > 0.55 ? 'is-fuerte' : ''}>
                              {p >= 0.045 ? Math.round(p * 100) : ''}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {actual.proxima?.partidos?.length > 0 && (
              <section className="pred-tarjeta">
                <h2 className="pred-tarjeta__titulo">Jornada {actual.proxima.jornada}: quién gana</h2>
                <ul className="pred-partidos">
                  {actual.proxima.partidos.map(p => (
                    <li key={`${p.local}-${p.visitante}`} className={[p.local, p.visitante].some(n => sinComillas(n) === EQUIPO) ? 'is-rz' : ''}>
                      <div className="pred-partido__equipos">
                        <span className="pred-partido__local"><span className="pred-partido__nombre">{sinComillas(p.local)}</span><Escudo nombre={p.local} /></span>
                        <span className="pred-partido__vs">vs</span>
                        <span><Escudo nombre={p.visitante} /><span className="pred-partido__nombre">{sinComillas(p.visitante)}</span></span>
                      </div>
                      <div className="pred-1x2" role="img" aria-label={`Gana ${sinComillas(p.local)} ${pct(p.p1, 0)}, empate ${pct(p.px, 0)}, gana ${sinComillas(p.visitante)} ${pct(p.p2, 0)}`}>
                        <span style={{ flexGrow: p.p1 }} className="pred-1x2--1">{pct(p.p1, 0)}</span>
                        <span style={{ flexGrow: p.px }} className="pred-1x2--x">{pct(p.px, 0)}</span>
                        <span style={{ flexGrow: p.p2 }} className="pred-1x2--2">{pct(p.p2, 0)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="pred-nota">Las barras: gana el local, empate y gana el visitante.</p>
              </section>
            )}

            <section className="pred-tarjeta pred-como">
              <h2 className="pred-tarjeta__titulo">Preguntas frecuentes</h2>
              {preguntasPrediccion(actual).map(q => (
                <div key={q.pregunta} className="pred-faq">
                  <h3>{q.pregunta}</h3>
                  <p>{q.respuesta}</p>
                </div>
              ))}
            </section>
          </>
        )}

        <nav className="pred-enlaces" aria-label="Más sobre la liga">
          <Link to="/clasificacion">Clasificación →</Link>
          <Link to="/simulador">Simula tú el final de liga →</Link>
          <Link to="/proximo-partido">Próximo partido →</Link>
        </nav>
      </div>
      <Footer />
    </div>
  )
}
