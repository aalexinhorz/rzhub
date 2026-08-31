import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SEO, { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'
import usePlayers from '../hooks/usePlayers'
import useAuth, { supabase } from '../hooks/useAuth'
import { usePartido } from '../hooks/usePartidos'
import { ESCUDO_ZARAGOZA, useEscudo } from '../lib/escudos'
import './Notas.css'

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/fallback-dark.png'

const PUNTUACIONES = Array.from({ length: 10 }, (_, i) => i + 1)

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

function rawPlayerId(player) {
  return Number(String(player.id).replace('db_', ''))
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

function JugadorCard({ player, puedeVotar, miNota, onVotar, media, mostrarMedia }) {
  const id = rawPlayerId(player)

  return (
    <div className="notas-jugador">
      <div className="notas-jugador__foto">
        <img
          src={player.photo || DEFAULT_PHOTO}
          alt={player.name}
          loading="lazy"
          onError={e => { e.target.src = DEFAULT_PHOTO }}
        />
      </div>
      <div className="notas-jugador__info">
        <span className="notas-jugador__nombre">{player.name}</span>
        <span className="notas-jugador__posicion">{player.position}</span>
      </div>

      {mostrarMedia && (
        <div className="notas-jugador__media">
          {media ? (
            <>
              <span className="notas-jugador__media-valor">{media.avg.toFixed(1)}</span>
              <span className="notas-jugador__media-votos">{media.count} voto{media.count === 1 ? '' : 's'}</span>
            </>
          ) : (
            <span className="notas-jugador__media-votos">Sin votos aún</span>
          )}
        </div>
      )}

      {puedeVotar && (
        <div className="notas-jugador__votos" role="group" aria-label={`Puntuar a ${player.name}`}>
          {PUNTUACIONES.map(n => (
            <button
              key={n}
              type="button"
              className={`notas-jugador__voto${miNota === n ? ' is-active' : ''}`}
              onClick={() => onVotar(id, n)}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NotasPartido() {
  const { partido: partidoId } = useParams()
  const navigate = useNavigate()
  const { partido, loading: loadingPartido } = usePartido(partidoId)
  const { players, loading: loadingPlayers } = usePlayers()
  const { user, signInWithGoogle } = useAuth()

  const convocadosIds = partido?.convocatoria || []
  const zaragozaPlayers = players
    .filter(p => convocadosIds.includes(rawPlayerId(p)))
    .sort(byPosicion)

  const [misNotas, setMisNotas] = useState({})
  const [medias, setMedias] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [editando, setEditando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setMisNotas({}); setGuardado(false); setEditando(false); setMedias(null)
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
          data.forEach(n => { propias[n.player_id] = n.puntuacion })
          setMisNotas(propias)
          setGuardado(true)
        }
      })
  }, [user, partidoId])

  // Con la votación cerrada las medias son públicas para cualquiera; con
  // la votación abierta solo se cargan si ya has votado tú (mismo criterio
  // que "mostrarMedia" al pintar cada jugador).
  useEffect(() => {
    if (!partidoId || !partido) return
    if (partido.abierta && !guardado) return
    cargarMedias()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partidoId, partido?.abierta, guardado])

  async function cargarMedias() {
    const { data } = await supabase
      .from('notas')
      .select('player_id, puntuacion')
      .eq('partido_id', partidoId)

    if (!data) return
    const acum = {}
    data.forEach(({ player_id, puntuacion }) => {
      if (!acum[player_id]) acum[player_id] = { sum: 0, count: 0 }
      acum[player_id].sum += puntuacion
      acum[player_id].count += 1
    })
    const result = {}
    Object.entries(acum).forEach(([id, { sum, count }]) => {
      result[id] = { avg: sum / count, count }
    })
    setMedias(result)
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

  const ventanaAbierta = partido?.abierta
  const puedeVotar = !!user && ventanaAbierta && (!guardado || editando)
  const notasPendientes = Object.keys(misNotas).length

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
          <button type="button" className="notas-back" onClick={() => navigate('/notas')}>← Todos los partidos</button>

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
                ) : (
                  <div className="notas-grid">
                    {zaragozaPlayers.map(p => (
                      <JugadorCard
                        key={p.id}
                        player={p}
                        puedeVotar={puedeVotar}
                        miNota={misNotas[rawPlayerId(p)]}
                        onVotar={handleVotar}
                        media={medias?.[rawPlayerId(p)]}
                        mostrarMedia={(!ventanaAbierta || guardado) && !!medias}
                      />
                    ))}
                  </div>
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
