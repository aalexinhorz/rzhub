import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEO, { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'
import { supabase } from '../hooks/useAuth'
import './Jugador.css'

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/fallback-dark.png'

function grupoPosicion(pos) {
  const p = (pos || '').toUpperCase()
  if (p.startsWith('POR')) return 'Portero'
  if (p === 'LD' || p === 'LI' || p.startsWith('DEF')) return 'Defensa'
  if (p === 'MC' || p.startsWith('MED')) return 'Centrocampista'
  if (p === 'ED' || p === 'EI' || p.startsWith('DEL')) return 'Delantero'
  return 'Sin definir'
}

function normalizar(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g'), '').trim()
}

// "Marco Sangalli" -> "sangalli" — mismo criterio que el resto de la
// web para casar nombres entre tablas que no comparten un id común
// (mercado guarda texto libre, no player_id).
function apellido(nombre) {
  const palabras = normalizar(nombre).split(/\s+/).filter(Boolean)
  return palabras[palabras.length - 1] || ''
}

function formatFecha(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Jugador() {
  const { id } = useParams()
  const [estado, setEstado] = useState('cargando') // cargando | ok | no-encontrado
  const [jugador, setJugador] = useState(null)
  const [stats, setStats] = useState(null)
  const [partidosLog, setPartidosLog] = useState([])
  const [mercadoHistorial, setMercadoHistorial] = useState([])

  useEffect(() => { cargar() }, [id])

  async function cargar() {
    setEstado('cargando')
    const [{ data: j }, { data: partidosData }, { data: porraPartidos }, { data: notasData }, { data: externas }, { data: mercadoData }] = await Promise.all([
      supabase.from('players').select('id, name, short_name, number, position, photo, is_cantera').eq('id', id).maybeSingle(),
      supabase.from('partidos').select('partido_id, rival, fecha, competicion, local, goles_local, goles_visitante, convocatoria').order('fecha', { ascending: false }),
      supabase.from('porra_partidos').select('fecha, goleadores'),
      supabase.from('notas').select('partido_id, puntuacion').eq('player_id', id),
      supabase.from('estadisticas_jugadores').select('dorsal, titular, minutos, asistencias, amarillas, doble_amarilla, rojas').eq('player_id', id).maybeSingle(),
      supabase.from('mercado').select('tipo, nombre, posicion, club_origen, club_destino, fecha'),
    ])

    if (!j) { setEstado('no-encontrado'); return }

    const nombreNorm = normalizar(j.name)
    const shortNorm = normalizar(j.short_name)

    // Log de partidos: para cada partido real se cruza con
    // porra_partidos (por fecha) para saber si marcó, y con notas
    // (por partido_id) para la nota media que recibió ese día.
    const log = (partidosData || []).map(p => {
      const convocado = (p.convocatoria || []).includes(j.id)
      const propios = p.local ? p.goles_local : p.goles_visitante
      const rival = p.local ? p.goles_visitante : p.goles_local
      const jugado = propios != null && rival != null
      const resultado = !jugado ? null : propios > rival ? 'V' : propios === rival ? 'E' : 'D'

      const porraMatch = porraPartidos?.find(pp => pp.fecha === p.fecha)
      const goles = porraMatch?.goleadores
        ? porraMatch.goleadores.filter(g => { const k = normalizar(g); return k === nombreNorm || k === shortNorm }).length
        : 0

      const notasPartido = (notasData || []).filter(n => n.partido_id === p.partido_id)
      const nota = notasPartido.length ? notasPartido.reduce((s, n) => s + n.puntuacion, 0) / notasPartido.length : null

      return { ...p, convocado, jugado, resultado, propios, rivalGoles: rival, goles, nota, votos: notasPartido.length }
    })

    const partidosJugados = log.filter(p => p.convocado).length
    const golesTemporada = log.reduce((s, p) => s + p.goles, 0)
    const notaMediaCareer = notasData?.length ? notasData.reduce((s, n) => s + n.puntuacion, 0) / notasData.length : null

    setJugador(j)
    setStats({
      dorsal: externas?.dorsal ?? j.number ?? null,
      titular: externas?.titular ?? null,
      minutos: externas?.minutos ?? null,
      asistencias: externas?.asistencias ?? null,
      amarillas: externas?.amarillas || 0,
      rojas: (externas?.doble_amarilla || 0) + (externas?.rojas || 0),
      partidosJugados,
      golesTemporada,
      notaMediaCareer,
      votosCareer: notasData?.length || 0,
    })
    setPartidosLog(log)

    const apellidoJugador = apellido(j.name) || apellido(j.short_name)
    setMercadoHistorial(
      (mercadoData || [])
        .filter(m => apellido(m.nombre) === apellidoJugador)
        .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
    )

    setEstado('ok')
  }

  if (estado === 'cargando') {
    return <div className="jugador-page"><p className="jugador-page__state">Cargando jugador…</p></div>
  }
  if (estado === 'no-encontrado') {
    return (
      <div className="jugador-page">
        <p className="jugador-page__state">No hemos encontrado a este jugador.</p>
        <p className="jugador-page__state"><Link to="/estadisticas" className="jugador-volver">‹ Volver a Estadísticas</Link></p>
      </div>
    )
  }

  const posicionLabel = grupoPosicion(jugador.position)

  return (
    <div className="jugador-page">
      <SEO
        title={`${jugador.name} | Estadísticas del Real Zaragoza | RZ Hub`}
        description={`Partidos jugados, minutos, goles y nota media de la afición de ${jugador.name}, ${posicionLabel.toLowerCase()} del Real Zaragoza, en la temporada 26/27.`}
        path={`/jugador/${jugador.id}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          name: jugador.name,
          url: `${SITE_URL}/jugador/${jugador.id}`,
          isPartOf: { '@type': 'WebSite', name: 'RZ Hub', url: SITE_URL },
        }}
      />

      <div className="jugador-page__body">
        <div className="jugador-page__container">
          <Link to="/estadisticas" className="jugador-volver">‹ Volver</Link>

          <div className="jugador-banner">
            <img className="jugador-banner__foto" src={jugador.photo || DEFAULT_PHOTO} alt="" onError={e => { e.target.src = DEFAULT_PHOTO }} />
            <div className="jugador-banner__info">
              <h1 className="jugador-banner__nombre">{jugador.name}</h1>
              <div className="jugador-banner__tags">
                <span className="jugador-tag">{posicionLabel}</span>
                {stats.dorsal && <span className="jugador-tag jugador-tag--dorsal">#{stats.dorsal}</span>}
                {jugador.is_cantera && <span className="jugador-tag jugador-tag--cantera">Cantera</span>}
              </div>
            </div>
          </div>

          <section className="jugador-stats">
            <div className="jugador-stats__celda">
              <span className="jugador-stats__valor">{stats.partidosJugados}</span>
              <span className="jugador-stats__label">Partidos</span>
            </div>
            <div className="jugador-stats__celda">
              <span className="jugador-stats__valor">{stats.minutos ?? '—'}</span>
              <span className="jugador-stats__label">Minutos</span>
            </div>
            <div className="jugador-stats__celda">
              <span className="jugador-stats__valor">{stats.golesTemporada}</span>
              <span className="jugador-stats__label">Goles</span>
            </div>
            <div className="jugador-stats__celda">
              <span className="jugador-stats__valor">{stats.asistencias ?? '—'}</span>
              <span className="jugador-stats__label">Asistencias</span>
            </div>
            <div className="jugador-stats__celda">
              <span className="jugador-stats__valor jugador-stats__valor--amarilla">{stats.amarillas}</span>
              <span className="jugador-stats__label">Amarillas</span>
            </div>
            <div className="jugador-stats__celda">
              <span className="jugador-stats__valor jugador-stats__valor--roja">{stats.rojas}</span>
              <span className="jugador-stats__label">Rojas</span>
            </div>
            <div className="jugador-stats__celda jugador-stats__celda--destacada">
              <span className="jugador-stats__valor">{stats.notaMediaCareer != null ? stats.notaMediaCareer.toFixed(1) : '—'}</span>
              <span className="jugador-stats__label">Nota media</span>
            </div>
          </section>

          <section>
            <h2 className="jugador-section-title">Partidos de la temporada</h2>
            {partidosLog.length === 0 ? (
              <p className="jugador-vacio">Todavía no se ha disputado ningún partido esta temporada.</p>
            ) : (
              <div className="jugador-tabla">
                <div className="jugador-tabla__cabecera">
                  <span>Fecha</span>
                  <span>Rival</span>
                  <span>Resultado</span>
                  <span>Goles</span>
                  <span>Nota</span>
                </div>
                {partidosLog.map(p => (
                  <div key={p.partido_id} className="jugador-tabla__fila">
                    <span>{formatFecha(p.fecha)}</span>
                    <span className="jugador-tabla__rival">{p.rival}</span>
                    <span>
                      {p.resultado
                        ? <span className={`jugador-pill jg-${p.resultado.toLowerCase()}`}>{p.goles_local}-{p.goles_visitante}</span>
                        : <span className="jugador-tabla__muted">Pendiente</span>}
                    </span>
                    <span className="jugador-tabla__num">{p.goles > 0 ? p.goles : '—'}</span>
                    <span className="jugador-tabla__num">{p.nota != null ? p.nota.toFixed(1) : '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="jugador-section-title">Historial en el mercado</h2>
            {mercadoHistorial.length === 0 ? (
              <p className="jugador-vacio">Sin movimientos de mercado registrados.</p>
            ) : (
              <ul className="jugador-mercado-lista">
                {mercadoHistorial.map((m, i) => (
                  <li key={i}>
                    <span className={`jugador-mercado-icono ${m.tipo === 'alta' ? 'jg-v' : 'jg-d'}`}>{m.tipo === 'alta' ? '↓' : '↑'}</span>
                    <div>
                      <span className="jugador-mercado-texto">
                        {m.tipo === 'alta' ? `Llegó desde ${m.club_origen}` : `Salió hacia ${m.club_destino}`}
                      </span>
                      <span className="jugador-mercado-fecha">{formatFecha(m.fecha)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="jugador-nota-final">
            Resultados: reales, verificados contra la ficha de cada partido. Goles: por goleador confirmado al cerrar cada jornada de la Porra. Minutos, asistencias y tarjetas: datos oficiales de la temporada (no desglosados partido a partido, por eso no aparecen en la tabla). Nota: valoración de la afición en Las Notas.
          </p>
        </div>

        <Footer />
      </div>
    </div>
  )
}
