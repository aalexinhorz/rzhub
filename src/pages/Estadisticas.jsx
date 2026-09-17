import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SEO, { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'
import { supabase } from '../hooks/useAuth'
import './Estadisticas.css'

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/fallback-dark.png'

function normalizar(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g'), '').trim()
}

function formatFecha(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// "Primera Federación · Jornada 3" -> "Primera Federación" (el nombre
// de la competición, sin el número de jornada).
function nombreCompeticion(competicion) {
  return (competicion || '').split('·')[0].trim() || 'Competición'
}

// La plantilla oculta a los canteranos que todavía no han sumado
// ningún minuto con el primer equipo, salvo estas excepciones.
const EXCEPCIONES_SIN_MINUTOS = [85, 388] // Diego Monzón, Laken Torres

export default function Estadisticas() {
  const [filas, setFilas] = useState([])
  const [partidos, setPartidos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const [{ data: jugadores }, { data: partidosData }, { data: porraPartidos }, { data: statsExternas }, { data: mercadoData }] = await Promise.all([
      supabase.from('players').select('id, name, short_name, number, photo, is_cantera').eq('is_zaragoza', true),
      supabase.from('partidos').select('partido_id, rival, fecha, competicion, local, goles_local, goles_visitante').order('fecha', { ascending: true }),
      supabase.from('porra_partidos').select('goleadores').eq('finalizado', true),
      supabase.from('estadisticas_jugadores').select('player_id, dorsal, minutos, asistencias'),
      supabase.from('mercado').select('tipo, nombre, posicion, club_origen, club_destino, fecha').order('fecha', { ascending: false }),
    ])

    // Minutos y asistencias vienen de la tabla estadisticas_jugadores,
    // alimentada por el scraper de AupaZaragoza (fetch-estadisticas-
    // jugadores) — no hay estas columnas en players.
    const statsPorId = {}
    statsExternas?.forEach(s => { statsPorId[s.player_id] = s })

    // Goles: de los goleadores reales guardados al cerrar cada jornada
    // de la porra (texto libre, normalizado para no depender de tildes
    // ni mayúsculas — no hay una columna de goles en `players`).
    const golesPorNombre = {}
    porraPartidos?.forEach(p => {
      ;(p.goleadores || []).forEach(nombre => {
        const key = normalizar(nombre)
        golesPorNombre[key] = (golesPorNombre[key] || 0) + 1
      })
    })

    const construidas = (jugadores || []).map(j => {
      const nombreNorm = normalizar(j.name)
      const shortNorm = normalizar(j.short_name)
      const goles = golesPorNombre[nombreNorm] ?? golesPorNombre[shortNorm] ?? 0
      const externas = statsPorId[j.id]
      return {
        id: j.id,
        nombreCorto: j.short_name || j.name,
        // El dorsal de AupaZaragoza refleja el número real de esta
        // temporada; el guardado en players a veces quedó desfasado
        // de altas/bajas anteriores, así que se prioriza si existe.
        dorsal: externas?.dorsal ?? j.number ?? null,
        foto: j.photo || DEFAULT_PHOTO,
        cantera: j.is_cantera || false,
        minutos: externas?.minutos ?? null,
        goles,
        asistencias: externas?.asistencias ?? null,
      }
    })

    setFilas(construidas)
    setPartidos(partidosData || [])
    setMovimientos(mercadoData || [])
    setLoading(false)
  }

  // Balance de la temporada: goles/resultado siempre vistos desde la
  // perspectiva del Real Zaragoza (según sea local o visitante en
  // cada partido), sólo con los partidos que ya se han disputado.
  const balance = useMemo(() => {
    let v = 0, e = 0, d = 0, gf = 0, gc = 0
    partidos.forEach(p => {
      if (p.goles_local == null || p.goles_visitante == null) return
      const propios = p.local ? p.goles_local : p.goles_visitante
      const rival = p.local ? p.goles_visitante : p.goles_local
      gf += propios
      gc += rival
      if (propios > rival) v++
      else if (propios === rival) e++
      else d++
    })
    const pj = v + e + d
    return { pj, v, e, d, gf, gc, pct: pj ? Math.round((v / pj) * 100) : 0 }
  }, [partidos])

  const resultadosPorCompeticion = useMemo(() => {
    const grupos = {}
    partidos.forEach(p => {
      if (p.goles_local == null || p.goles_visitante == null) return
      const propios = p.local ? p.goles_local : p.goles_visitante
      const rival = p.local ? p.goles_visitante : p.goles_local
      const nombre = nombreCompeticion(p.competicion)
      if (!grupos[nombre]) grupos[nombre] = { v: 0, e: 0, d: 0 }
      if (propios > rival) grupos[nombre].v++
      else if (propios === rival) grupos[nombre].e++
      else grupos[nombre].d++
    })
    return Object.entries(grupos).map(([nombre, r]) => ({ nombre, ...r, pj: r.v + r.e + r.d }))
  }, [partidos])

  const topGoleadores = useMemo(() =>
    [...filas].filter(f => f.goles > 0).sort((a, b) => b.goles - a.goles).slice(0, 4),
  [filas])

  const topAsistentes = useMemo(() =>
    [...filas].filter(f => (f.asistencias || 0) > 0).sort((a, b) => (b.asistencias || 0) - (a.asistencias || 0)).slice(0, 4),
  [filas])

  const plantillaOrdenada = useMemo(() =>
    [...filas]
      .filter(f => !f.cantera || (f.minutos ?? 0) > 0 || EXCEPCIONES_SIN_MINUTOS.includes(f.id))
      .sort((a, b) => (a.dorsal ?? 999) - (b.dorsal ?? 999)),
  [filas])

  const altas = useMemo(() => movimientos.filter(m => m.tipo === 'alta').slice(0, 8), [movimientos])
  const bajas = useMemo(() => movimientos.filter(m => m.tipo === 'baja').slice(0, 8), [movimientos])

  return (
    <div className="estadisticas-page">
      <SEO
        title="Estadísticas de los jugadores del Real Zaragoza | RZ Hub"
        description="Partidos jugados, goles y nota media de la afición de cada jugador de la plantilla del Real Zaragoza en la temporada 26/27."
        keywords="estadísticas Real Zaragoza, goles Real Zaragoza, nota media jugadores Real Zaragoza, plantilla Real Zaragoza 26/27"
        path="/estadisticas"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Estadísticas del Real Zaragoza',
          url: `${SITE_URL}/estadisticas`,
          description: 'Estadísticas de partidos jugados, goles y nota media de la afición de la plantilla del Real Zaragoza.',
          isPartOf: { '@type': 'WebSite', name: 'RZ Hub', url: SITE_URL },
        }}
      />

      <div className="estadisticas-page__hero">
        <p className="rz-eyebrow rz-eyebrow--yellow estadisticas-page__eyebrow">Real Zaragoza · Temporada 26/27</p>
        <h1 className="estadisticas-page__title">Estadísticas</h1>
        <p className="estadisticas-page__subtitle">Radiografía de la temporada: balance, rankings, plantilla y mercado.</p>
      </div>

      <div className="estadisticas-page__body">
        <div className="estadisticas-page__container">

          {!loading && (
            <>
              {/* -------- Balance de la temporada -------- */}
              <section className="estadisticas-balance">
                <div className="estadisticas-balance__celda">
                  <span className="estadisticas-balance__valor">{balance.pj}</span>
                  <span className="estadisticas-balance__label">Partidos</span>
                </div>
                <div className="estadisticas-balance__celda estadisticas-balance__celda--destacada">
                  <span className="estadisticas-balance__valor">{balance.pct}%</span>
                  <span className="estadisticas-balance__label">Victorias</span>
                </div>
                <div className="estadisticas-balance__celda">
                  <span className="estadisticas-balance__ved">
                    <b className="es-v">{balance.v}</b>·<b className="es-e">{balance.e}</b>·<b className="es-d">{balance.d}</b>
                  </span>
                  <span className="estadisticas-balance__label">V · E · D</span>
                </div>
                <div className="estadisticas-balance__celda">
                  <span className="estadisticas-balance__valor">{balance.gf}-{balance.gc}</span>
                  <span className="estadisticas-balance__label">Goles ({balance.gf - balance.gc >= 0 ? '+' : ''}{balance.gf - balance.gc})</span>
                </div>
              </section>

              {/* -------- Resultados por competición -------- */}
              {resultadosPorCompeticion.length > 0 && (
                <section>
                  <div className="estadisticas-section-header">
                    <h2 className="estadisticas-section-title">Resultados por competición</h2>
                    <div className="estadisticas-leyenda">
                      <span><i className="es-v" /> Victorias</span>
                      <span><i className="es-e" /> Empates</span>
                      <span><i className="es-d" /> Derrotas</span>
                    </div>
                  </div>
                  <div className="estadisticas-resultados">
                    {resultadosPorCompeticion.map(r => (
                      <div key={r.nombre} className="estadisticas-resultados__fila">
                        <span className="estadisticas-resultados__nombre">{r.nombre}</span>
                        <div className="estadisticas-resultados__barra">
                          {r.v > 0 && <div className="es-v" style={{ width: `${(r.v / r.pj) * 100}%` }} />}
                          {r.e > 0 && <div className="es-e" style={{ width: `${(r.e / r.pj) * 100}%` }} />}
                          {r.d > 0 && <div className="es-d" style={{ width: `${(r.d / r.pj) * 100}%` }} />}
                        </div>
                        <span className="estadisticas-resultados__pj">{r.pj} PJ</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* -------- Rankings -------- */}
              <section className="estadisticas-rankings">
                <div className="estadisticas-ranking-card">
                  <h2 className="estadisticas-section-title estadisticas-section-title--sm">Máximos goleadores</h2>
                  {topGoleadores.length === 0 ? (
                    <p className="estadisticas-ranking-vacio">Todavía no hay goles registrados esta temporada.</p>
                  ) : (
                    <ol className="estadisticas-ranking-lista">
                      {topGoleadores.map((f, i) => (
                        <li key={f.id}>
                          <span className="estadisticas-ranking-pos">{i + 1}</span>
                          <img src={f.foto} alt="" loading="lazy" onError={e => { e.target.src = DEFAULT_PHOTO }} />
                          <span className="estadisticas-ranking-nombre">{f.nombreCorto}</span>
                          <div className="estadisticas-ranking-barra"><div style={{ width: `${(f.goles / topGoleadores[0].goles) * 100}%` }} /></div>
                          <span className="estadisticas-ranking-valor">{f.goles}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
                <div className="estadisticas-ranking-card">
                  <h2 className="estadisticas-section-title estadisticas-section-title--sm">Máximos asistentes</h2>
                  {topAsistentes.length === 0 ? (
                    <p className="estadisticas-ranking-vacio">Todavía no hay asistencias registradas esta temporada.</p>
                  ) : (
                    <ol className="estadisticas-ranking-lista">
                      {topAsistentes.map((f, i) => (
                        <li key={f.id}>
                          <span className="estadisticas-ranking-pos">{i + 1}</span>
                          <img src={f.foto} alt="" loading="lazy" onError={e => { e.target.src = DEFAULT_PHOTO }} />
                          <span className="estadisticas-ranking-nombre">{f.nombreCorto}</span>
                          <div className="estadisticas-ranking-barra"><div style={{ width: `${(f.asistencias / topAsistentes[0].asistencias) * 100}%` }} /></div>
                          <span className="estadisticas-ranking-valor">{f.asistencias}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </section>

              {/* -------- Plantilla -------- */}
              <section>
                <h2 className="estadisticas-section-title">Plantilla</h2>
                <div className="estadisticas-plantilla-grid">
                  {plantillaOrdenada.map(f => (
                    <Link key={f.id} to={`/jugador/${f.id}`} className="estadisticas-jugador-card">
                      {f.dorsal && <span className="estadisticas-jugador-card__dorsal">{f.dorsal}</span>}
                      {f.cantera && <span className="estadisticas-jugador-card__cantera" title="Cantera">C</span>}
                      <img className="estadisticas-jugador-card__foto" src={f.foto} alt="" loading="lazy" onError={e => { e.target.src = DEFAULT_PHOTO }} />
                      <span className="estadisticas-jugador-card__nombre">{f.nombreCorto}</span>
                    </Link>
                  ))}
                </div>
              </section>

              {/* -------- Altas y bajas -------- */}
              {(altas.length > 0 || bajas.length > 0) && (
                <section>
                  <div className="estadisticas-section-header">
                    <h2 className="estadisticas-section-title">Movimientos de la temporada</h2>
                    <Link to="/mercado" className="estadisticas-ver-todo">Ver todo el mercado →</Link>
                  </div>
                  <div className="estadisticas-mercado">
                    <div className="estadisticas-mercado-col">
                      <h3>Altas</h3>
                      {altas.length === 0 ? <p className="estadisticas-ranking-vacio">Sin altas registradas.</p> : (
                        <ul>
                          {altas.map((m, i) => (
                            <li key={i}>
                              <span className="estadisticas-mercado-icono es-v">↓</span>
                              <div>
                                <span className="estadisticas-mercado-nombre">{m.nombre}</span>
                                <span className="estadisticas-mercado-detalle">desde {m.club_origen} · {formatFecha(m.fecha)}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="estadisticas-mercado-col">
                      <h3>Bajas</h3>
                      {bajas.length === 0 ? <p className="estadisticas-ranking-vacio">Sin bajas registradas.</p> : (
                        <ul>
                          {bajas.map((m, i) => (
                            <li key={i}>
                              <span className="estadisticas-mercado-icono es-d">↑</span>
                              <div>
                                <span className="estadisticas-mercado-nombre">{m.nombre}</span>
                                <span className="estadisticas-mercado-detalle">a {m.club_destino} · {formatFecha(m.fecha)}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </section>
              )}

              <p className="estadisticas-nota-final">
                Balance y resultados: partidos disputados registrados en RZ Hub. Goles y asistencias: goleadores confirmados al cerrar cada jornada de la Porra y datos oficiales de la temporada. No mostramos la clasificación completa de la categoría porque sólo verificamos los datos del Real Zaragoza, no los del resto de equipos.
              </p>
            </>
          )}

          {loading && <p className="estadisticas-page__state">Cargando estadísticas…</p>}
        </div>

        <Footer />
      </div>
    </div>
  )
}
