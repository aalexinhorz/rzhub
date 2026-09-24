import { useEffect, useMemo, useState } from 'react'
import SEO, { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'
import useAuth from '../hooks/useAuth'
import { supabase } from '../hooks/useAuth'
import usePlayers from '../hooks/usePlayers'
import useFantasy from '../hooks/useFantasy'
import { formations, formationsList } from '../lib/formations'
import './Fantasy.css'

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/fallback-dark.png'
const BUDGET_INICIAL = 100000000

function grupoPosicion(pos) {
  const p = (pos || '').toUpperCase()
  if (p.startsWith('POR')) return 'POR'
  if (p === 'LD' || p === 'LI' || p.startsWith('DEF')) return 'DEF'
  if (p === 'MC' || p.startsWith('MED')) return 'MED'
  if (p === 'ED' || p === 'EI' || p.startsWith('DEL')) return 'DEL'
  return 'MED'
}

function formatEuros(v) {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(v / 1000000) + 'M €'
}

function rawPlayerId(player) {
  return Number(String(player.id).replace('db_', ''))
}

function useProximoPartido() {
  const [partido, setPartido] = useState(null)
  useEffect(() => {
    supabase.from('porra_partidos').select('id, rival, kickoff')
      .gt('kickoff', new Date().toISOString())
      .order('kickoff', { ascending: true }).limit(1)
      .then(({ data }) => setPartido(data?.[0] || null))
  }, [])
  return partido
}

/* ============================================================
   MERCADO
   ============================================================ */
function TarjetaJugador({ jugador, precio, poseido, onComprar, onVender, disabled }) {
  return (
    <div className="fantasy-card">
      <div className="fantasy-card__foto">
        <div className="fantasy-card__foto-recorte">
          <img src={jugador.photo || DEFAULT_PHOTO} alt="" onError={e => { e.target.src = DEFAULT_PHOTO }} />
        </div>
        <span className="fantasy-card__pos">{grupoPosicion(jugador.position)}</span>
      </div>
      <div className="fantasy-card__info">
        <span className="fantasy-card__nombre">{jugador.shortName || jugador.name}</span>
        <span className="fantasy-card__precio">{formatEuros(precio)}</span>
      </div>
      {poseido ? (
        <button className="fantasy-card__btn fantasy-card__btn--vender" onClick={onVender} disabled={disabled}>Vender</button>
      ) : (
        <button className="fantasy-card__btn fantasy-card__btn--comprar" onClick={onComprar} disabled={disabled}>Comprar</button>
      )}
    </div>
  )
}

function Mercado({ players, precios, plantilla, mercadoHoy, saldo, onComprar, onVender, procesando, error }) {
  const [filtro, setFiltro] = useState('TODAS')
  const idsEnPlantilla = useMemo(() => new Set(plantilla.map(p => p.player_id)), [plantilla])
  const idsEnMercadoHoy = useMemo(() => new Set(mercadoHoy), [mercadoHoy])

  const filas = players
    .filter(p => p.isZaragoza)
    // El mercado rota cada día: solo se pueden fichar los jugadores del
    // día de hoy. Los que ya tienes en tu plantilla se siguen viendo
    // siempre aquí (para poder venderlos), aunque hoy no les toque salir.
    .filter(p => idsEnMercadoHoy.has(rawPlayerId(p)) || idsEnPlantilla.has(rawPlayerId(p)))
    .map(p => ({ jugador: p, id: rawPlayerId(p), precio: precios.get(rawPlayerId(p))?.precio ?? null }))
    .filter(f => f.precio !== null)
    .filter(f => filtro === 'TODAS' || grupoPosicion(f.jugador.position) === filtro)
    .sort((a, b) => b.precio - a.precio)

  return (
    <div className="fantasy-mercado">
      <p className="fantasy-mercado__aviso">El mercado cambia cada día — hoy solo puedes fichar a estos jugadores (los que ya tienes en tu plantilla siempre puedes venderlos).</p>
      {plantilla.length >= 15 && (
        <p className="fantasy-mercado__aviso fantasy-mercado__aviso--lleno">Tu plantilla está completa (15/15) — vende a alguien para poder fichar otro.</p>
      )}
      <div className="fantasy-mercado__filtros">
        {['TODAS', 'POR', 'DEF', 'MED', 'DEL'].map(g => (
          <button key={g} className={`fantasy-filtro${filtro === g ? ' fantasy-filtro--activo' : ''}`} onClick={() => setFiltro(g)}>{g}</button>
        ))}
      </div>
      {error && <p className="fantasy-error">{error}</p>}
      <div className="fantasy-mercado__grid">
        {filas.map(({ jugador, id, precio }) => (
          <TarjetaJugador
            key={id}
            jugador={jugador}
            precio={precio}
            poseido={idsEnPlantilla.has(id)}
            disabled={procesando || (!idsEnPlantilla.has(id) && (precio > saldo || plantilla.length >= 15))}
            onComprar={() => onComprar(id)}
            onVender={() => onVender(id)}
          />
        ))}
      </div>
    </div>
  )
}

/* ============================================================
   MI EQUIPO
   ============================================================ */
function HuecoCampo({ slot, jugador, precio, onClick }) {
  return (
    <button
      className={`fantasy-hueco${jugador ? '' : ' fantasy-hueco--vacio'}`}
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      onClick={onClick}
    >
      {jugador ? (
        <>
          <img src={jugador.photo || DEFAULT_PHOTO} alt="" onError={e => { e.target.src = DEFAULT_PHOTO }} />
          <span className="fantasy-hueco__nombre">{jugador.shortName || jugador.name}</span>
          {precio != null && <span className="fantasy-hueco__precio">{formatEuros(precio)}</span>}
        </>
      ) : (
        <span className="fantasy-hueco__mas">+</span>
      )}
    </button>
  )
}

function MiEquipo({ players, precios, plantilla, saldo, partido, alineacionInicial, onGuardar, guardando }) {
  const [formation, setFormation] = useState(alineacionInicial?.formation || '4-3-3')
  const [slots, setSlots] = useState(alineacionInicial?.slots || {})
  const [slotActivo, setSlotActivo] = useState(null)

  const jugadoresPorId = useMemo(() => {
    const m = new Map()
    players.forEach(p => m.set(rawPlayerId(p), p))
    return m
  }, [players])

  const misJugadores = plantilla.map(p => ({ ...p, jugador: jugadoresPorId.get(p.player_id) })).filter(p => p.jugador)
  const idsAsignados = new Set(Object.values(slots))
  // Cada jugador solo puede ir en su propia posición (portero con portero,
  // defensa con defensa...), para forzar a tener plantilla de las 4 líneas
  // en vez de rellenar el once con lo que sea.
  const slotActivoObj = slotActivo ? formations[formation].find(sl => sl.id === slotActivo) : null
  const disponibles = misJugadores.filter(p =>
    !idsAsignados.has(p.player_id) && (!slotActivoObj || grupoPosicion(p.jugador.position) === slotActivoObj.label)
  )

  const bloqueado = partido && new Date(partido.kickoff) <= new Date()

  function asignar(slotId, playerId) {
    setSlots(s => ({ ...s, [slotId]: playerId }))
    setSlotActivo(null)
  }
  function quitar(slotId) {
    setSlots(s => { const n = { ...s }; delete n[slotId]; return n })
    setSlotActivo(null)
  }

  useEffect(() => {
    // Al cambiar de formación, se quitan los jugadores en slots que ya no existen.
    setSlots(s => {
      const idsValidos = new Set(formations[formation].map(sl => sl.id))
      const n = {}
      Object.entries(s).forEach(([k, v]) => { if (idsValidos.has(k)) n[k] = v })
      return n
    })
  }, [formation])

  if (misJugadores.length === 0) {
    return (
      <div className="fantasy-vacio">
        <p>Todavía no tienes jugadores en tu plantilla.</p>
        <p className="fantasy-vacio__hint">Ve a "Mercado" y ficha a tus primeros jugadores del Real Zaragoza.</p>
      </div>
    )
  }

  return (
    <div className="fantasy-equipo">
      <div className="fantasy-equipo__toolbar">
        <select value={formation} onChange={e => setFormation(e.target.value)} className="fantasy-select">
          {formationsList.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        {partido && (
          <span className="fantasy-equipo__rival">
            {bloqueado ? 'Alineación bloqueada' : 'Próximo partido'} vs {partido.rival}
          </span>
        )}
        <button className="fantasy-btn fantasy-btn--primary" disabled={bloqueado || guardando} onClick={() => onGuardar(formation, slots)}>
          {guardando ? 'Guardando…' : 'Guardar alineación'}
        </button>
      </div>

      <div className="fantasy-campo">
        <img src="/CAMPO_PARA_WEB.svg" alt="" className="fantasy-campo__fondo" />
        {formations[formation].map(slot => {
          const playerId = slots[slot.id]
          const item = playerId ? misJugadores.find(p => p.player_id === playerId) : null
          return (
            <HuecoCampo
              key={slot.id}
              slot={slot}
              jugador={item?.jugador}
              precio={playerId ? precios.get(playerId)?.precio : null}
              onClick={() => !bloqueado && setSlotActivo(slot.id === slotActivo ? null : slot.id)}
            />
          )
        })}
      </div>

      {slotActivo && !bloqueado && (
        <div className="fantasy-selector">
          <div className="fantasy-selector__header">
            <span>Elige un {slotActivoObj?.label} para esta posición</span>
            <button onClick={() => setSlotActivo(null)}>✕</button>
          </div>
          {slots[slotActivo] && (
            <button className="fantasy-selector__quitar" onClick={() => quitar(slotActivo)}>Quitar del once</button>
          )}
          <div className="fantasy-selector__lista">
            {disponibles.length === 0 && (
              <p className="fantasy-vacio__hint">
                No tienes ningún {slotActivoObj?.label} libre en tu plantilla — ficha uno en Mercado.
              </p>
            )}
            {disponibles.map(p => (
              <button key={p.player_id} className="fantasy-selector__item" onClick={() => asignar(slotActivo, p.player_id)}>
                <img src={p.jugador.photo || DEFAULT_PHOTO} alt="" onError={e => { e.target.src = DEFAULT_PHOTO }} />
                <span>{p.jugador.shortName || p.jugador.name}</span>
                <span className="fantasy-selector__item-pos">{grupoPosicion(p.jugador.position)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   CLASIFICACIÓN
   ============================================================ */
function Clasificacion({ userId }) {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('fantasy_clasificacion').select('user_id, puntos_total, saldo').order('puntos_total', { ascending: false })
      .then(async ({ data }) => {
        if (!data || data.length === 0) { setRanking([]); setLoading(false); return }
        const { data: perfiles } = await supabase.from('profiles').select('id, name, username, avatar_url').in('id', data.map(d => d.user_id))
        const porId = new Map((perfiles || []).map(p => [p.id, p]))
        setRanking(data.map(d => ({ ...d, perfil: porId.get(d.user_id) })))
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="fantasy-page__state">Cargando clasificación…</p>
  if (ranking.length === 0) return <p className="fantasy-page__state">Todavía no hay nadie en la clasificación. ¡Sé el primero en fichar!</p>

  return (
    <div className="fantasy-ranking">
      {ranking.map((r, i) => (
        <div key={r.user_id} className={`fantasy-ranking__row${r.user_id === userId ? ' is-me' : ''}`}>
          <span className={`fantasy-ranking__pos fantasy-ranking__pos--${i + 1}`}>{i + 1}</span>
          <img className="fantasy-ranking__avatar" src={r.perfil?.avatar_url || DEFAULT_PHOTO} alt="" />
          <span className="fantasy-ranking__nombre">{r.perfil?.name || r.perfil?.username || 'Zaragocista'}</span>
          <span className="fantasy-ranking__saldo">{formatEuros(r.saldo)}</span>
          <span className="fantasy-ranking__puntos">{r.puntos_total} pts</span>
        </div>
      ))}
    </div>
  )
}

/* ============================================================
   PÁGINA
   ============================================================ */
export default function Fantasy() {
  const { user, signInWithGoogle } = useAuth()
  const { players, loading: loadingPlayers } = usePlayers()
  const { precios, plantilla, clasificacion, mercadoHoy, loading, error, comprar, vender } = useFantasy(user?.id)
  const partido = useProximoPartido()
  const [tab, setTab] = useState('mercado')
  const [procesando, setProcesando] = useState(false)
  const [alineacion, setAlineacion] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [avisoGuardado, setAvisoGuardado] = useState(false)

  const preciosMap = useMemo(() => {
    const m = new Map()
    precios.forEach(p => m.set(p.player_id, p))
    return m
  }, [precios])

  const saldo = clasificacion?.saldo ?? BUDGET_INICIAL
  const puntos = clasificacion?.puntos_total ?? 0

  useEffect(() => {
    if (!user || !partido) return
    supabase.from('fantasy_alineaciones').select('formation, slots').eq('user_id', user.id).eq('partido_id', partido.id).maybeSingle()
      .then(({ data }) => setAlineacion(data || null))
  }, [user, partido])

  async function handleComprar(playerId) {
    if (!user) return
    setProcesando(true)
    await comprar(playerId)
    setProcesando(false)
  }
  async function handleVender(playerId) {
    if (!user) return
    setProcesando(true)
    await vender(playerId)
    setProcesando(false)
  }
  async function handleGuardarAlineacion(formation, slots) {
    if (!user || !partido) return
    setGuardando(true)
    await supabase.from('fantasy_alineaciones').upsert({
      user_id: user.id, partido_id: partido.id, formation, slots, subs: {},
    }, { onConflict: 'user_id,partido_id' })
    setGuardando(false)
    setAvisoGuardado(true)
    setTimeout(() => setAvisoGuardado(false), 3000)
  }

  return (
    <div className="fantasy-page">
      <SEO
        title="Fantasy Real Zaragoza | RZ Hub"
        description="Ficha a los jugadores del Real Zaragoza, monta tu once cada jornada y compite en la clasificación con el resto de la comunidad."
        path="/fantasy"
      />

      <div className="fantasy-page__hero">
        <p className="fantasy-page__eyebrow">Real Zaragoza · Fantasy</p>
        <h1 className="fantasy-page__title">Fantasy RZ Hub</h1>
        <p className="fantasy-page__subtitle">Ficha a la plantilla del Zaragoza, monta tu once cada jornada y gana puntos por su rendimiento real.</p>
      </div>

      <div className="fantasy-page__body">
        <div className="fantasy-page__container">
          {!user ? (
            <div className="fantasy-aviso">
              <span>Inicia sesión para poder fichar jugadores y jugar al Fantasy.</span>
              <button onClick={signInWithGoogle} className="rz-btn rz-btn--primary">Iniciar sesión con Google</button>
            </div>
          ) : (
            <div className="fantasy-resumen">
              <span><strong>{formatEuros(saldo)}</strong> disponibles</span>
              <span><strong>{plantilla.length}</strong> jugadores en plantilla</span>
              <span><strong>{puntos}</strong> puntos totales</span>
            </div>
          )}

          <div className="fantasy-tabs">
            <button className={`fantasy-tab${tab === 'mercado' ? ' is-activo' : ''}`} onClick={() => setTab('mercado')}>Mercado</button>
            <button className={`fantasy-tab${tab === 'equipo' ? ' is-activo' : ''}`} onClick={() => setTab('equipo')}>Mi equipo</button>
            <button className={`fantasy-tab${tab === 'clasificacion' ? ' is-activo' : ''}`} onClick={() => setTab('clasificacion')}>Clasificación</button>
          </div>

          {avisoGuardado && <p className="fantasy-aviso-ok">✓ Alineación guardada</p>}

          {loadingPlayers || loading ? (
            <p className="fantasy-page__state">Cargando…</p>
          ) : tab === 'mercado' ? (
            <Mercado
              players={players} precios={preciosMap} plantilla={user ? plantilla : []} mercadoHoy={mercadoHoy} saldo={saldo}
              onComprar={handleComprar} onVender={handleVender} procesando={procesando || !user} error={error}
            />
          ) : tab === 'equipo' ? (
            user ? (
              <MiEquipo
                players={players} precios={preciosMap} plantilla={plantilla} saldo={saldo}
                partido={partido} alineacionInicial={alineacion} onGuardar={handleGuardarAlineacion} guardando={guardando}
              />
            ) : <p className="fantasy-page__state">Inicia sesión para montar tu equipo.</p>
          ) : (
            <Clasificacion userId={user?.id} />
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
