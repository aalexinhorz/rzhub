import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SEO, { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'
import usePlayers from '../hooks/usePlayers'
import usePartidos, { usePartido } from '../hooks/usePartidos'
import useAuth, { supabase } from '../hooks/useAuth'
import { ESCUDO_ZARAGOZA, useEscudo } from '../lib/escudos'
import './Notas.css'

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/fallback-dark.png'

// La nota "RZHub" es la que pone la propia cuenta de RZ Hub
// (rzhub1932@gmail.com) — una valoración oficial más, no fabricada,
// distinta de la media de la comunidad.
const RZHUB_USER_ID = '20cca270-3dfa-4a7c-8cab-918eeffa5940'

// La posición en la base de datos no siempre usa POR/DEF/MED/DEL (hay
// jugadores históricos con códigos como LD, LI, MC, ED...), así que
// agrupamos por prefijo/alias en vez de comparar el valor exacto.
function grupoPosicion(pos) {
  const p = (pos || '').toUpperCase()
  if (p.startsWith('POR')) return 0
  if (p === 'LD' || p === 'LI' || p.startsWith('DEF')) return 1
  if (p === 'MC' || p.startsWith('MED')) return 2
  if (p === 'ED' || p === 'EI' || p.startsWith('DEL')) return 3
  return 4
}

function byPosicion(a, b) {
  return grupoPosicion(a.position) - grupoPosicion(b.position)
}

function formatFecha(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatFechaCorta(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function rawPlayerId(player) {
  return Number(String(player.id).replace('db_', ''))
}

// Cuenta atrás real hasta partido.cierre (calculado en usePartidos: la
// fecha del partido + 7 días, o el día del siguiente partido si es
// antes — nunca un plazo inventado).
function useCuentaAtras(cierre) {
  const [restante, setRestante] = useState(null)
  useEffect(() => {
    if (!cierre) { setRestante(null); return }
    function tick() {
      const diff = new Date(cierre).getTime() - Date.now()
      if (diff <= 0) { setRestante(null); return }
      setRestante({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [cierre])
  return restante
}

function Marcador({ partido }) {
  const rivalCrest = useEscudo(partido.rival)
  const zaragoza = { nombre: 'Real Zaragoza', escudo: ESCUDO_ZARAGOZA }
  const rival = { nombre: partido.rival, escudo: rivalCrest }

  // goles_local/goles_visitante son siempre del equipo que juega en casa,
  // sea o no el Zaragoza — así que el orden en pantalla depende de "local".
  const local = partido.local
    ? { ...zaragoza, goles: partido.goles_local }
    : { ...rival, goles: partido.goles_local }
  const visitante = partido.local
    ? { ...rival, goles: partido.goles_visitante }
    : { ...zaragoza, goles: partido.goles_visitante }

  return (
    <div className="notas-marcador">
      <p className="notas-marcador__competicion">{partido.competicion} · {formatFecha(partido.fecha)}</p>
      <div className="notas-marcador__strip">
        <div className="notas-marcador__cell">
          <span className="notas-marcador__crest">
            {local.escudo
              ? <img src={local.escudo} alt="" />
              : <span className="notas-marcador__crest-fallback">{local.nombre[0]}</span>}
          </span>
          <span className="notas-marcador__name">{local.nombre}</span>
        </div>
        <div className="notas-marcador__score">
          <span>{local.goles}</span>
          <span className="notas-marcador__score-sep">-</span>
          <span>{visitante.goles}</span>
        </div>
        <div className="notas-marcador__cell">
          <span className="notas-marcador__crest">
            {visitante.escudo
              ? <img src={visitante.escudo} alt="" />
              : <span className="notas-marcador__crest-fallback">{visitante.nombre[0]}</span>}
          </span>
          <span className="notas-marcador__name">{visitante.nombre}</span>
        </div>
      </div>
    </div>
  )
}

export default function NotasPartido() {
  const { partido: partidoId } = useParams()
  const navigate = useNavigate()
  const { partido, loading: loadingPartido } = usePartido(partidoId)
  const { partidos: todosPartidos } = usePartidos()
  const { players, loading: loadingPlayers } = usePlayers()
  const { user, signInWithGoogle } = useAuth()

  // El dorsal de estadisticas_jugadores (AupaZaragoza) es más fiable
  // que players.number, que en varios casos quedó desfasado de altas
  // y bajas — mismo criterio que Estadísticas y la ficha de jugador.
  const [dorsales, setDorsales] = useState({})
  useEffect(() => {
    supabase.from('estadisticas_jugadores').select('player_id, dorsal').then(({ data }) => {
      const map = {}
      data?.forEach(s => { if (s.dorsal) map[s.player_id] = s.dorsal })
      setDorsales(map)
    })
  }, [])

  const convocadosIds = partido?.convocatoria || []
  const zaragozaPlayers = useMemo(() => players
    .filter(p => convocadosIds.includes(rawPlayerId(p)))
    .sort(byPosicion), [players, partido?.partido_id]) // eslint-disable-line react-hooks/exhaustive-deps

  const [misNotas, setMisNotas] = useState({})
  const [medias, setMedias] = useState(null)
  const [notaRzhub, setNotaRzhub] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [editando, setEditando] = useState(false)
  const [error, setError] = useState(null)
  const [focoIdx, setFocoIdx] = useState(0)
  const [ordenPorNota, setOrdenPorNota] = useState(false)

  useEffect(() => {
    setMisNotas({}); setGuardado(false); setEditando(false); setMedias(null); setNotaRzhub({}); setFocoIdx(0)
  }, [partidoId])

  useEffect(() => {
    if (!user || !partidoId) return
    supabase
      .from('notas')
      .select('player_id, puntuacion')
      .eq('partido_id', partidoId)
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const propias = {}
          data.forEach(n => { propias[n.player_id] = Number(n.puntuacion) })
          setMisNotas(propias)
          setGuardado(true)
        }
      })
  }, [user, partidoId])

  // Con la votación cerrada las medias son públicas para cualquiera; con
  // la votación abierta solo se cargan si ya has votado tú.
  useEffect(() => {
    if (!partidoId || !partido) return
    if (partido.abierta && !guardado) return
    cargarMedias()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partidoId, partido?.abierta, guardado])

  async function cargarMedias() {
    const { data } = await supabase
      .from('notas')
      .select('player_id, puntuacion, user_id')
      .eq('partido_id', partidoId)

    if (!data) return
    const acum = {}
    const rzhub = {}
    data.forEach(({ player_id, puntuacion, user_id }) => {
      const valor = Number(puntuacion)
      if (!acum[player_id]) acum[player_id] = { sum: 0, count: 0 }
      acum[player_id].sum += valor
      acum[player_id].count += 1
      if (user_id === RZHUB_USER_ID) rzhub[player_id] = valor
    })
    const result = {}
    Object.entries(acum).forEach(([id, { sum, count }]) => {
      result[id] = { avg: sum / count, count }
    })
    setMedias(result)
    setNotaRzhub(rzhub)
  }

  function handleVotar(playerId, puntuacion) {
    setMisNotas(prev => ({ ...prev, [playerId]: puntuacion }))
  }

  async function handleGuardar() {
    if (!user) return
    const filas = Object.entries(misNotas).map(([player_id, puntuacion]) => ({
      partido_id: partidoId,
      player_id: Number(player_id),
      user_id: user.id,
      puntuacion,
    }))
    if (filas.length === 0) return

    setGuardando(true)
    setError(null)
    const { error: err } = await supabase
      .from('notas')
      .upsert(filas, { onConflict: 'partido_id,player_id,user_id' })

    setGuardando(false)
    if (err) { setError('No se han podido guardar las notas. Inténtalo de nuevo.'); return }

    setGuardado(true)
    setEditando(false)
    cargarMedias()
  }

  const ventanaAbierta = partido?.abierta
  const puedeVotar = !!user && ventanaAbierta && (!guardado || editando)
  const notasPendientes = Object.keys(misNotas).length
  const mostrarMedias = (!ventanaAbierta || guardado) && !!medias

  const restante = useCuentaAtras(ventanaAbierta ? partido?.cierre : null)

  const ranking = useMemo(() => {
    if (!mostrarMedias || !medias) return []
    return zaragozaPlayers
      .map(p => ({ player: p, id: rawPlayerId(p), media: medias[rawPlayerId(p)] }))
      .filter(x => x.media)
      .sort((a, b) => b.media.avg - a.media.avg)
  }, [mostrarMedias, medias, zaragozaPlayers])
  const mvp = ranking[0] || null
  const peor = ranking.length > 2 ? ranking[ranking.length - 1] : null

  const listaOrdenada = useMemo(() => {
    if (!ordenPorNota || !mostrarMedias) return zaragozaPlayers
    return [...zaragozaPlayers].sort((a, b) => {
      const ma = medias?.[rawPlayerId(a)]?.avg ?? -1
      const mb = medias?.[rawPlayerId(b)]?.avg ?? -1
      return mb - ma
    })
  }, [zaragozaPlayers, ordenPorNota, mostrarMedias, medias])

  const jugadorFoco = zaragozaPlayers[focoIdx] || null
  const idFoco = jugadorFoco ? rawPlayerId(jugadorFoco) : null
  const mediaFoco = idFoco != null ? medias?.[idFoco] : null

  function irAJugador(player) {
    const idx = zaragozaPlayers.findIndex(p => p.id === player.id)
    if (idx >= 0) setFocoIdx(idx)
    document.getElementById('notas-foco')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function ajustarNota(delta) {
    if (!puedeVotar || idFoco == null) return
    const actual = misNotas[idFoco] ?? 5
    // De 0 a 10 en pasos de 0.5 — el redondeo evita errores de coma
    // flotante (0.1 + 0.2 !== 0.3) al ir sumando/restando 0.5 muchas veces.
    const nueva = Math.round((actual + delta) * 2) / 2
    handleVotar(idFoco, Math.min(10, Math.max(0, nueva)))
  }

  if (!loadingPartido && !partido) {
    return (
      <div className="notas-page">
        <div className="notas-page__body" style={{ paddingTop: 60 }}>
          <div className="notas-page__container">
            <p className="notas-page__state">No hemos encontrado este partido.</p>
            <button type="button" className="rz-btn rz-btn--ghost" onClick={() => navigate('/notas')}>← Volver a Las Notas</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="notas-page">
      {partido && (
        <SEO
          title={`Notas: ${partido.local ? 'Real Zaragoza' : partido.rival} ${partido.goles_local ?? ''}-${partido.goles_visitante ?? ''} ${partido.local ? partido.rival : 'Real Zaragoza'} | RZ Hub`}
          description={`Puntúa a los jugadores del Real Zaragoza en el partido frente al ${partido.rival} (${formatFecha(partido.fecha)}) y consulta la nota media de la afición.`}
          keywords={`notas Real Zaragoza ${partido.rival}, puntuar jugadores Real Zaragoza, Real Zaragoza vs ${partido.rival}, valoración afición Real Zaragoza`}
          path={`/notas/${partido.partido_id}`}
          jsonLd={[
            {
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: `Las Notas: Real Zaragoza vs ${partido.rival}`,
              url: `${SITE_URL}/notas/${partido.partido_id}`,
              isPartOf: { '@type': 'WebSite', name: 'RZ Hub', url: SITE_URL },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'SportsEvent',
              name: `${partido.local ? 'Real Zaragoza' : partido.rival} vs ${partido.local ? partido.rival : 'Real Zaragoza'}`,
              startDate: partido.fecha,
              sport: 'https://en.wikipedia.org/wiki/Association_football',
              competitor: [
                { '@type': 'SportsTeam', name: 'Real Zaragoza' },
                { '@type': 'SportsTeam', name: partido.rival },
              ],
              homeTeam: { '@type': 'SportsTeam', name: partido.local ? 'Real Zaragoza' : partido.rival },
              awayTeam: { '@type': 'SportsTeam', name: partido.local ? partido.rival : 'Real Zaragoza' },
              ...(partido.goles_local != null && partido.goles_visitante != null && {
                eventStatus: 'https://schema.org/EventCompleted',
              }),
            },
          ]}
        />
      )}

      <div className="notas-page__hero">
        <p className="rz-eyebrow rz-eyebrow--yellow notas-page__eyebrow">Real Zaragoza · Temporada 26/27</p>
        <h1 className="notas-page__title">Las Notas</h1>
        <p className="notas-page__subtitle">Puntúa la actuación de cada jugador tras el partido.</p>
      </div>

      <div className="notas-page__body">
        <div className="notas-page__container">
          <div className="notas-toolbar-top">
            <button type="button" className="notas-back" onClick={() => navigate('/notas')}>← Todos los partidos</button>

            {todosPartidos.filter(p => p.estado !== 'futuro').length > 0 && (
              <select
                className="notas-selector-partido"
                value={partidoId}
                onChange={e => navigate(`/notas/${e.target.value}`)}
              >
                {todosPartidos.filter(p => p.estado !== 'futuro').map(p => (
                  <option key={p.partido_id} value={p.partido_id}>
                    {p.competicion} · {p.local ? 'Real Zaragoza' : p.rival} - {p.local ? p.rival : 'Real Zaragoza'} ({formatFechaCorta(p.fecha)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {loadingPartido ? (
            <p className="notas-page__state">Cargando partido…</p>
          ) : (
            <>
              <Marcador partido={partido} />

              {partido.estado === 'futuro' && (
                <div className="notas-aviso">
                  <span>Este partido todavía no se ha jugado. Vuelve cuando acabe para puntuar a los jugadores.</span>
                </div>
              )}

              {partido.estado === 'cerrada' && (
                <div className="notas-aviso">
                  <span>La votación de este partido ya está cerrada. Aquí tienes los resultados.</span>
                </div>
              )}

              {mvp && (
                <div className="notas-mvp">
                  <div className="notas-mvp__foto">
                    <img src={mvp.player.photo} alt="" onError={e => { e.target.src = DEFAULT_PHOTO }} />
                    <span className="notas-mvp__foto-nombre">{mvp.player.shortName}</span>
                  </div>
                  <div className="notas-mvp__info">
                    <span className="notas-mvp__tag">🏆 MVP del partido</span>
                    <span className="notas-mvp__nombre">{mvp.player.name}</span>
                    <span className="notas-mvp__desc">El más votado de Las Notas, según la comunidad</span>
                    <div className="notas-mvp__runners">
                      {ranking[1] && <span><b>2º</b> {ranking[1].player.shortName} <b className="notas-mvp__runner-nota">{ranking[1].media.avg.toFixed(1)}</b></span>}
                      {ranking[2] && <span><b>3º</b> {ranking[2].player.shortName} <b className="notas-mvp__runner-nota">{ranking[2].media.avg.toFixed(1)}</b></span>}
                    </div>
                  </div>
                  <div className="notas-mvp__nota">
                    <span className="notas-mvp__nota-valor">{mvp.media.avg.toFixed(1)}</span>
                    <span className="notas-mvp__nota-votos">{mvp.media.count} voto{mvp.media.count === 1 ? '' : 's'}</span>
                  </div>
                </div>
              )}

              {ventanaAbierta && restante && (
                <div className="notas-cuenta-atras">
                  <span className="notas-cuenta-atras__label">⏱ Tiempo restante para votar</span>
                  <span className="notas-cuenta-atras__reloj">
                    <b>{restante.d}</b>d <b>{restante.h}</b>h <b>{restante.m}</b>m <b>{restante.s}</b>s
                  </span>
                </div>
              )}

              {ventanaAbierta && !user && (
                <div className="notas-aviso">
                  <span>Inicia sesión para poder votar. Mientras tanto puedes ver la plantilla.</span>
                  <button type="button" className="rz-btn rz-btn--primary" onClick={signInWithGoogle}>Iniciar sesión con Google</button>
                </div>
              )}

              {ventanaAbierta && user && (
                <div className="notas-acciones">
                  {guardado && !editando ? (
                    <>
                      <span className="notas-acciones__estado">Ya has votado en este partido.</span>
                      <button type="button" className="rz-btn rz-btn--ghost" onClick={() => setEditando(true)}>Editar tus notas</button>
                    </>
                  ) : (
                    <>
                      <span className="notas-acciones__estado">{notasPendientes} de {zaragozaPlayers.length} jugadores puntuados</span>
                      <button
                        type="button"
                        className="rz-btn rz-btn--primary"
                        disabled={guardando || notasPendientes === 0}
                        onClick={handleGuardar}
                      >
                        {guardando ? 'Guardando…' : 'Guardar notas'}
                      </button>
                    </>
                  )}
                  {error && <span className="notas-acciones__error">{error}</span>}
                </div>
              )}

              {partido.estado !== 'futuro' && (
                loadingPlayers ? (
                  <p className="notas-page__state">Cargando plantilla…</p>
                ) : zaragozaPlayers.length === 0 ? (
                  <p className="notas-page__state">No hay convocatoria registrada para este partido.</p>
                ) : (
                  <>
                    <section id="notas-foco" className="notas-foco">
                      <div className="notas-foco__panel">
                        <span className="notas-foco__nombre">{jugadorFoco.name}</span>
                        <div className="notas-foco__fila">
                          <span>Posición</span>
                          <b>{jugadorFoco.position}</b>
                        </div>
                        <div className="notas-foco__fila notas-foco__fila--comunidad">
                          <span>Comunidad</span>
                          <b>{mostrarMedias && mediaFoco ? mediaFoco.avg.toFixed(1) : '—'}</b>
                        </div>
                        <div className="notas-foco__fila notas-foco__fila--rzhub">
                          <span>RZHub</span>
                          <b>{mostrarMedias && notaRzhub[idFoco] != null ? notaRzhub[idFoco].toFixed(1) : '—'}</b>
                        </div>
                        {mostrarMedias && mediaFoco && (
                          <span className="notas-foco__votos">{mediaFoco.count} voto{mediaFoco.count === 1 ? '' : 's'}</span>
                        )}
                      </div>

                      {/* ‹ tarjeta › agrupados: así en móvil (donde .notas-foco
                          pasa a columna) las flechas nunca se separan de la
                          tarjeta que controlan. */}
                      <div className="notas-foco__carrusel">
                        <button
                          type="button"
                          className="notas-foco__flecha"
                          onClick={() => setFocoIdx(i => Math.max(0, i - 1))}
                          disabled={focoIdx === 0}
                          aria-label="Jugador anterior"
                        >‹</button>

                        <div className="notas-foco__card">
                          {dorsales[idFoco] && <span className="notas-foco__card-dorsal">{dorsales[idFoco]}</span>}
                          <img
                            src={jugadorFoco.photo}
                            alt=""
                            className="notas-foco__card-foto"
                            onError={e => { e.target.src = DEFAULT_PHOTO }}
                          />
                          <span className="notas-foco__card-nombre">{jugadorFoco.shortName}</span>
                        </div>

                        <button
                          type="button"
                          className="notas-foco__flecha"
                          onClick={() => setFocoIdx(i => Math.min(zaragozaPlayers.length - 1, i + 1))}
                          disabled={focoIdx === zaragozaPlayers.length - 1}
                          aria-label="Siguiente jugador"
                        >›</button>
                      </div>

                      {puedeVotar ? (
                        <div className="notas-foco__stepper">
                          <button type="button" onClick={() => ajustarNota(-0.5)} aria-label="Bajar nota">−</button>
                          <span className="notas-foco__stepper-valor">{(misNotas[idFoco] ?? 5).toFixed(1)}</span>
                          <button type="button" onClick={() => ajustarNota(0.5)} aria-label="Subir nota">+</button>
                          <span className="notas-foco__stepper-label">Tu nota</span>
                        </div>
                      ) : (
                        <div className="notas-foco__stepper notas-foco__stepper--lectura">
                          <span className="notas-foco__stepper-valor">{mostrarMedias && mediaFoco ? mediaFoco.avg.toFixed(1) : '—'}</span>
                          <span className="notas-foco__stepper-label">Nota media</span>
                        </div>
                      )}
                    </section>

                    {zaragozaPlayers.length > 1 && (
                      <div className="notas-slider">
                        <input
                          type="range"
                          min={0}
                          max={zaragozaPlayers.length - 1}
                          value={focoIdx}
                          onChange={e => setFocoIdx(Number(e.target.value))}
                        />
                        <span className="notas-slider__contador">{focoIdx + 1} / {zaragozaPlayers.length}</span>
                      </div>
                    )}

                    {mostrarMedias && (
                      <div className="notas-orden">
                        <span className="notas-orden__label">Ordenar por</span>
                        <button type="button" className={`notas-orden__btn${!ordenPorNota ? ' is-active' : ''}`} onClick={() => setOrdenPorNota(false)}>Posición</button>
                        <button type="button" className={`notas-orden__btn${ordenPorNota ? ' is-active' : ''}`} onClick={() => setOrdenPorNota(true)}>Nota</button>
                      </div>
                    )}

                    <div className="notas-grid-v2">
                      {listaOrdenada.map(p => {
                        const id = rawPlayerId(p)
                        const media = medias?.[id]
                        const esFoco = jugadorFoco?.id === p.id
                        const esMvp = mvp?.id === id
                        const esPeor = peor?.id === id
                        return (
                          <button
                            key={p.id}
                            type="button"
                            className={`notas-mini-card${esFoco ? ' is-foco' : ''}${esPeor ? ' is-peor' : ''}`}
                            onClick={() => irAJugador(p)}
                          >
                            {mostrarMedias && (
                              <span className="notas-mini-card__nota">{media ? media.avg.toFixed(1) : '—'}</span>
                            )}
                            {esMvp && <span className="notas-mini-card__trofeo" aria-hidden="true">🏆</span>}
                            <div className="notas-mini-card__foto">
                              <img src={p.photo} alt="" loading="lazy" onError={e => { e.target.src = DEFAULT_PHOTO }} />
                            </div>
                            <span className="notas-mini-card__nombre">{p.shortName}</span>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )
              )}
            </>
          )}
        </div>

        <Footer />
      </div>
    </div>
  )
}
