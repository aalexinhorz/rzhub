import { useState, useEffect, useRef } from 'react'
import SEO, { SITE_URL } from '../components/SEO'
import { supabase } from '../hooks/useAuth'
import useAuth from '../hooks/useAuth'
import Footer from '../components/Footer'
import './Porra.css'

const ESCUDOS = {
  'Gimnàstic de Tarragona': '/escudos/Gimnastic_de_Tarragona_logo.svg',
  'Antequera CF': '/escudos/spain_antequera.football-logos.cc.svg',
  'Juventud de Torremolinos CF': '/escudos/spain_juventud-torremolinos.football-logos.cc.svg',
  'FC Cartagena': '/escudos/spain_fc-cartagena.football-logos.cc.svg',
  'UD Ibiza': '/escudos/UD_Ibiza_logo.svg',
  'CD Teruel': '/escudos/CD_Teruel_logo.svg',
  'Atlético Madrileño': '/escudos/Atletico_Madrid_Logo_2024.svg',
  'Real Murcia CF': '/escudos/Real_Murcia_CF_logo.svg',
  'CE Europa': '/escudos/Club_Esportiu_Europa.svg',
  'Villarreal CF B': '/escudos/Villarreal_CF_logo-en.svg',
  'SD Huesca': '/escudos/Logo_of_SD_Huesca.svg',
  'Real Jaén CF': '/escudos/spain_real-jaen-cf.football-logos.cc.svg',
  'CF Rayo Majadahonda': '/escudos/Rayo_Majadahonda_(logo).svg',
  'AD Alcorcón': '/escudos/AD_Alcorcon_logo.svg',
  'Águilas FC': '/escudos/logo.svg',
  'Real Madrid Castilla': '/escudos/Real_Madrid_CF.svg',
  'Hércules de Alicante CF': '/escudos/Hercules_CF_crest.svg',
  'Algeciras CF': '/escudos/spain_algeciras.football-logos.cc.svg',
  'UE Sant Andreu': '/escudos/ue-sant-andreu-vector-logo.png',
}

const ESCUDO_ZARAGOZA = '/escudos/Real_Zaragoza_logo (3).svg'
const HORA_PLACEHOLDER = '18:30'
// Debe coincidir con el min-height de .porra-ranking__row en desktop
// (Porra.css) — se usa para calcular cuántas filas completas caben en el
// espacio que el panel lateral gana al igualar la altura de la tarjeta.
const RANKING_ROW_HEIGHT = 50

// "Dom. 27 septiembre" — si la hora del kickoff está a medianoche UTC es
// que aún no se ha fijado de verdad (mismo criterio que CalendarSection),
// así que mostramos la hora placeholder en vez de un "00:00" engañoso.
function formatFechaHora(kickoff) {
  const d = new Date(kickoff)
  const dia = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')
  const diaCap = dia.charAt(0).toUpperCase() + dia.slice(1)
  const fecha = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
  const horaConocida = !(d.getUTCHours() === 0 && d.getUTCMinutes() === 0)
  const hora = horaConocida ? d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : HORA_PLACEHOLDER
  return `${diaCap}. ${fecha} · ${hora} h`
}

function haEmpezado(kickoff) {
  return new Date() >= new Date(kickoff)
}

function isCerrada(partido) {
  return !partido.abierto || haEmpezado(partido.kickoff)
}

function getPartidoActivo(partidos) {
  const abierto = partidos.find(p => p.abierto)
  if (abierto) return abierto
  const ahora = new Date()
  const proximos = partidos.filter(p => new Date(p.kickoff) > ahora)
  if (proximos.length > 0) return proximos[0]
  const pasados = [...partidos].reverse()
  return pasados[0] || null
}

const inicialesDe = nombre => (nombre || 'U').trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

// Comportamiento de accesibilidad compartido por las modales de Porra
// (clasificación completa, cómo se juega): bloquea el scroll de la
// página, mueve el foco al diálogo al abrir, lo atrapa dentro mientras
// está abierto y lo devuelve al botón que lo abrió al cerrar.
function useModalA11y(abierta, dialogRef, triggerRef, onClose) {
  useEffect(() => {
    if (!abierta) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const dialog = dialogRef.current
    dialog?.focus()

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab' && dialog) {
        const focusables = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      triggerRef.current?.focus()
    }
  }, [abierta])
}

export default function Porra() {
  const { user, signInWithGoogle } = useAuth()
  const [partidos, setPartidos] = useState([])
  const [predicciones, setPredicciones] = useState({})
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [form, setForm] = useState({ goles_zaragoza: 0, goles_rival: 0, goleadores: '' })
  const [partidoActivo, setPartidoActivo] = useState(null)
  const [participantes, setParticipantes] = useState(null)
  const [mostrarGoleadores, setMostrarGoleadores] = useState(false)
  const [vistaJornadas, setVistaJornadas] = useState('ultimas')
  const [rowsToShow, setRowsToShow] = useState(5)
  const [modalRankingAbierto, setModalRankingAbierto] = useState(false)
  const [modalComoSeJuegaAbierto, setModalComoSeJuegaAbierto] = useState(false)
  const participantesReq = useRef(0)
  const matchCardRef = useRef(null)
  const sidebarRef = useRef(null)
  const seasonRef = useRef(null)
  const rankingHeaderRef = useRef(null)
  const rankingFooterRef = useRef(null)
  const modalRankingRef = useRef(null)
  const modalRankingTriggerRef = useRef(null)
  const modalComoSeJuegaRef = useRef(null)
  const modalComoSeJuegaTriggerRef = useRef(null)

  useEffect(() => {
    fetchPartidos()
    fetchRanking()
  }, [])

  useEffect(() => {
    if (user) fetchPredicciones()
  }, [user])

  useEffect(() => {
    if (partidos.length > 0 && !partidoActivo) {
      setPartidoActivo(getPartidoActivo(partidos))
    }
  }, [partidos])

  useEffect(() => {
    if (partidoActivo && predicciones[partidoActivo.id]) {
      const pred = predicciones[partidoActivo.id]
      setForm({
        goles_zaragoza: pred.goles_zaragoza,
        goles_rival: pred.goles_rival,
        goleadores: pred.goleadores?.join(', ') || '',
      })
      if (pred.goleadores?.length > 0) setMostrarGoleadores(true)
    } else {
      setForm({ goles_zaragoza: 0, goles_rival: 0, goleadores: '' })
      setMostrarGoleadores(false)
    }
  }, [partidoActivo, predicciones])

  // Nº real de zaragocistas que ya han pronosticado este partido.
  useEffect(() => {
    if (!partidoActivo) return
    const miReq = ++participantesReq.current
    supabase
      .from('porra_predicciones')
      .select('*', { count: 'exact', head: true })
      .eq('partido_id', partidoActivo.id)
      .then(({ count }) => {
        if (miReq === participantesReq.current) setParticipantes(count || 0)
      })
  }, [partidoActivo])

  // Nº de filas del ranking que caben en el panel lateral. Solo tiene
  // sentido en el layout de dos columnas (desktop). OJO: la altura de
  // referencia se mide en .porra-match-card, que en desktop lleva
  // align-self:start y por tanto NUNCA se estira — su clientHeight
  // depende solo de su propio contenido, nunca del nº de filas del
  // ranking. Si en cambio midiéramos el propio panel de ranking (que sí
  // se estira para igualar la tarjeta), cada fila añadida agrandaría el
  // panel, lo que agrandaría la fila del grid, lo que volvería a agrandar
  // el panel... un bucle real que llegó a "colar" ~70 filas y a inflar la
  // tarjeta con hueco vacío. Al medir la tarjeta (independiente) y fijar
  // la altura del panel lateral por CSS var en vez de por stretch de
  // grid, se rompe ese ciclo.
  useEffect(() => {
    const card = matchCardRef.current
    if (!card) return
    const mq = window.matchMedia('(min-width: 1101px)')

    function recompute() {
      const cardH = card.clientHeight
      if (sidebarRef.current) sidebarRef.current.style.setProperty('--porra-card-h', `${cardH}px`)

      if (!mq.matches) {
        setRowsToShow(prev => (prev === 5 ? prev : 5))
        return
      }
      const season = seasonRef.current?.clientHeight || 0
      const header = rankingHeaderRef.current?.clientHeight || 0
      const footer = rankingFooterRef.current?.clientHeight || 0
      const disponible = Math.max(0, cardH - season - header - footer)
      const filas = Math.max(3, Math.floor(disponible / RANKING_ROW_HEIGHT))
      setRowsToShow(prev => (prev === filas ? prev : filas))
    }

    recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(card)
    if (seasonRef.current) ro.observe(seasonRef.current)
    if (rankingHeaderRef.current) ro.observe(rankingHeaderRef.current)
    if (rankingFooterRef.current) ro.observe(rankingFooterRef.current)
    mq.addEventListener('change', recompute)
    return () => {
      ro.disconnect()
      mq.removeEventListener('change', recompute)
    }
  }, [loading, partidoActivo])

  useModalA11y(modalRankingAbierto, modalRankingRef, modalRankingTriggerRef, () => setModalRankingAbierto(false))
  useModalA11y(modalComoSeJuegaAbierto, modalComoSeJuegaRef, modalComoSeJuegaTriggerRef, () => setModalComoSeJuegaAbierto(false))

  async function fetchPartidos() {
    const { data } = await supabase
      .from('porra_partidos')
      .select('*')
      .order('kickoff', { ascending: true })
    setPartidos(data || [])
    setLoading(false)
  }

  async function fetchPredicciones() {
    const { data } = await supabase.from('porra_predicciones').select('*').eq('user_id', user.id)
    const map = {}
    data?.forEach(p => { map[p.partido_id] = p })
    setPredicciones(map)
  }

  async function fetchRanking() {
    const { data: puntos } = await supabase
      .from('porra_puntos')
      .select('*')
      .order('puntos_total', { ascending: false })
    if (!puntos || puntos.length === 0) { setRanking([]); return }

    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url')
      .in('id', puntos.map(p => p.user_id))
    const perfilesMap = {}
    perfiles?.forEach(p => { perfilesMap[p.id] = p })

    setRanking(puntos.map(p => ({ ...p, profiles: perfilesMap[p.user_id] || null })))
  }

  async function guardarPrediccion() {
    if (!user) return signInWithGoogle()
    if (!partidoActivo) return
    setGuardando(true)
    const payload = {
      user_id: user.id,
      partido_id: partidoActivo.id,
      goles_zaragoza: form.goles_zaragoza,
      goles_rival: form.goles_rival,
      goleadores: form.goleadores ? form.goleadores.split(',').map(g => g.trim()).filter(Boolean) : [],
    }
    const existing = predicciones[partidoActivo.id]
    if (existing) {
      await supabase.from('porra_predicciones').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('porra_predicciones').insert(payload)
    }
    await fetchPredicciones()
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  const cerrada = partidoActivo ? isCerrada(partidoActivo) : false
  const empezado = partidoActivo ? haEmpezado(partidoActivo.kickoff) : false
  const abiertaDeVerdad = partidoActivo ? (partidoActivo.abierto && !empezado) : false
  const pred = partidoActivo ? predicciones[partidoActivo.id] : null
  const esLocal = partidoActivo?.sede === 'local'
  const venue = partidoActivo ? (esLocal ? 'Ibercaja Estadio' : 'Fuera de casa') : ''
  const escudoRival = partidoActivo ? (ESCUDOS[partidoActivo.rival] || null) : null

  const marcadorFinal = partidoActivo?.finalizado
    ? (esLocal ? [partidoActivo.goles_zaragoza, partidoActivo.goles_rival] : [partidoActivo.goles_rival, partidoActivo.goles_zaragoza])
    : null
  const marcadorPred = pred
    ? (esLocal ? [pred.goles_zaragoza, pred.goles_rival] : [pred.goles_rival, pred.goles_zaragoza])
    : null

  const miEntrada = user ? ranking.find(entry => entry.user_id === user.id) : null
  const miPosicion = user ? ranking.findIndex(entry => entry.user_id === user.id) : -1

  // Racha real: jornadas ya empezadas, contadas hacia atrás desde la más
  // reciente, mientras haya una predicción guardada para cada una — no
  // inventamos una tendencia de posición porque no guardamos histórico
  // de clasificación, pero esto sí es 100% derivable de los datos reales.
  let racha = 0
  if (user) {
    const jugadas = [...partidos].filter(p => haEmpezado(p.kickoff)).sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff))
    for (const p of jugadas) {
      if (predicciones[p.id]) racha++
      else break
    }
  }

  let rankingVisible = ranking.slice(0, rowsToShow)
  if (miPosicion > rowsToShow - 1) {
    let inicio = Math.max(0, miPosicion - Math.floor(rowsToShow / 2))
    inicio = Math.min(inicio, Math.max(0, ranking.length - rowsToShow))
    rankingVisible = ranking.slice(inicio, inicio + rowsToShow)
  }
  const offsetVisible = miPosicion > rowsToShow - 1
    ? Math.min(Math.max(0, miPosicion - Math.floor(rowsToShow / 2)), Math.max(0, ranking.length - rowsToShow))
    : 0

  function abrirModalRanking(e) {
    modalRankingTriggerRef.current = e.currentTarget
    setModalRankingAbierto(true)
  }

  function abrirModalComoSeJuega(e) {
    modalComoSeJuegaTriggerRef.current = e.currentTarget
    setModalComoSeJuegaAbierto(true)
  }

  // Siempre visibles, también sin sesión: si no hay predicción propia para
  // esa jornada (invitado, o logueado sin haber pronosticado) se muestran
  // 0 puntos por defecto en vez de ocultar la tarjeta.
  const ultimasJornadas = partidos
    .filter(p => p.finalizado)
    .sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff))
    .slice(0, 3)

  const proximasJornadas = partidos
    .filter(p => !p.finalizado)
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))
    .slice(0, 3)

  function ajustarMarcador(campo, delta) {
    setForm(f => ({ ...f, [campo]: Math.max(0, Math.min(20, f[campo] + delta)) }))
  }

  const avataresParticipantes = ranking.slice(0, 3)

  return (
    <div className="porra-page">
      <SEO
        title="La Porra del Real Zaragoza | Pronósticos y Ranking | RZ Hub"
        description="Predice los resultados del Real Zaragoza, suma puntos por acertar el marcador y los goleadores, y compite en el ranking de la comunidad zaragocista."
        keywords="porra Real Zaragoza, quiniela Real Zaragoza, pronósticos Real Zaragoza, predicciones Real Zaragoza, ranking porra Real Zaragoza"
        path="/porra"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'La Porra del Real Zaragoza | RZ Hub',
          url: `${SITE_URL}/porra`,
          applicationCategory: 'GameApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          description: 'Juego de pronósticos de los partidos del Real Zaragoza con ranking de la comunidad.',
        }}
      />

      {/* Envuelve cabecera + tarjeta del partido: el fondo fotográfico
          compartido (desktop) vive en este contenedor, así que termina
          exactamente donde termina su contenido real — no en una altura
          fija — y nunca se prolonga bajo el historial. */}
      <div className="porra-atmosphere">
      {/* CABECERA */}
      <div className="porra-hero">
        <div className="porra-hero__inner">
          <h1 className="porra-hero__title">La Porra</h1>
          <div className="porra-hero__row">
            <p className="porra-hero__subtitle">Participa cada jornada y gana premios a final de temporada.</p>
            <button className="porra-hero__howto" onClick={abrirModalComoSeJuega}>
              Cómo se juega ↗
            </button>
          </div>
        </div>
      </div>

      <div className="porra-container">
        {loading && <p style={{ color: '#a9bcdc', fontFamily: 'Archivo, sans-serif' }}>Cargando...</p>}

        {!loading && !partidoActivo && (
          <div className="porra-match-card" style={{ padding: '48px 28px', textAlign: 'center' }}>
            <p style={{ color: '#a9bcdc', fontFamily: 'Archivo, sans-serif', margin: 0 }}>No hay jornadas disponibles en este momento.</p>
          </div>
        )}

        {!loading && partidoActivo && (
          <div className="porra-grid">
            {/* IZQUIERDA — partido y pronóstico */}
            <div className="porra-match-card" ref={matchCardRef}>
              <div className="porra-match-card__top">
                <div className="porra-match-card__comp">
                  Primera Federación · Jornada {partidoActivo.jornada}
                  <span className={`porra-badge ${abiertaDeVerdad ? 'porra-badge--open' : 'porra-badge--closed'}`}>
                    {abiertaDeVerdad ? 'Porra abierta' : 'Porra cerrada'}
                  </span>
                </div>
                <div className="porra-match-card__when">
                  <div className="porra-match-card__date">{formatFechaHora(partidoActivo.kickoff)}</div>
                  <div className="porra-match-card__venue">{venue}</div>
                </div>
              </div>

              <div className="porra-teams">
                <div className="porra-team">
                  {(esLocal ? ESCUDO_ZARAGOZA : escudoRival) ? (
                    <img className="porra-team__crest" src={esLocal ? ESCUDO_ZARAGOZA : escudoRival} alt="" onError={e => { e.target.style.visibility = 'hidden' }} />
                  ) : (
                    <span className="porra-team__crest-fallback">{(esLocal ? 'Real Zaragoza' : partidoActivo.rival)[0]}</span>
                  )}
                  <span className="porra-team__name">{esLocal ? 'Real Zaragoza' : partidoActivo.rival}</span>
                  {!cerrada && (
                    <div className="porra-team__selector">
                      <button className="porra-stepper-btn" onClick={() => ajustarMarcador(esLocal ? 'goles_zaragoza' : 'goles_rival', -1)} disabled={(esLocal ? form.goles_zaragoza : form.goles_rival) <= 0}>−</button>
                      <span className="porra-score-value">{esLocal ? form.goles_zaragoza : form.goles_rival}</span>
                      <button className="porra-stepper-btn" onClick={() => ajustarMarcador(esLocal ? 'goles_zaragoza' : 'goles_rival', 1)}>+</button>
                    </div>
                  )}
                </div>

                <span className="porra-teams__sep">–</span>

                <div className="porra-team">
                  {(esLocal ? escudoRival : ESCUDO_ZARAGOZA) ? (
                    <img className="porra-team__crest" src={esLocal ? escudoRival : ESCUDO_ZARAGOZA} alt="" onError={e => { e.target.style.visibility = 'hidden' }} />
                  ) : (
                    <span className="porra-team__crest-fallback">{(esLocal ? partidoActivo.rival : 'Real Zaragoza')[0]}</span>
                  )}
                  <span className="porra-team__name">{esLocal ? partidoActivo.rival : 'Real Zaragoza'}</span>
                  {!cerrada && (
                    <div className="porra-team__selector">
                      <button className="porra-stepper-btn" onClick={() => ajustarMarcador(esLocal ? 'goles_rival' : 'goles_zaragoza', -1)} disabled={(esLocal ? form.goles_rival : form.goles_zaragoza) <= 0}>−</button>
                      <span className="porra-score-value">{esLocal ? form.goles_rival : form.goles_zaragoza}</span>
                      <button className="porra-stepper-btn" onClick={() => ajustarMarcador(esLocal ? 'goles_rival' : 'goles_zaragoza', 1)}>+</button>
                    </div>
                  )}
                </div>
              </div>

              {!user && !cerrada && (
                <>
                  <p className="porra-tu-pronostico-label">Tu pronóstico</p>
                  <button className="porra-cta" onClick={signInWithGoogle}>Inicia sesión para participar →</button>
                </>
              )}

              {user && !cerrada && (
                <>
                  <p className="porra-tu-pronostico-label">Tu pronóstico</p>

                  <div className="porra-goleadores" onClick={() => setMostrarGoleadores(v => !v)}>
                    <span className="porra-goleadores__label">{mostrarGoleadores ? '− Goleadores' : '+ Añadir goleadores'}</span>
                    <span className="porra-goleadores__pts">+3 pts · Opcional</span>
                  </div>
                  {mostrarGoleadores && (
                    <input
                      className="porra-goleadores-input"
                      type="text"
                      value={form.goleadores}
                      onClick={e => e.stopPropagation()}
                      onChange={e => setForm(f => ({ ...f, goleadores: e.target.value }))}
                      placeholder="Ej: Escobar, Gabilondo"
                    />
                  )}

                  <button
                    className={`porra-cta${guardado ? ' porra-cta--saved' : ''}`}
                    onClick={guardarPrediccion}
                    disabled={guardando}
                  >
                    {guardado ? '✓ ¡Guardado!' : guardando ? 'Guardando...' : 'Guardar pronóstico →'}
                  </button>
                  <div className="porra-cta-meta">
                    <span>5 pts por el resultado exacto</span>
                    <span className="porra-cta-meta__dot">·</span>
                    <span>Puedes editarlo hasta el inicio del partido</span>
                  </div>
                </>
              )}

              {cerrada && (
                pred ? (
                  <div className="porra-locked">
                    <p className="porra-locked__label">Tu predicción</p>
                    <div className="porra-locked__score">{marcadorPred[0]} - {marcadorPred[1]}</div>
                    {pred.goleadores?.length > 0 && (
                      <p style={{ fontSize: '12px', color: '#a9bcdc', marginTop: '8px', fontFamily: 'Archivo, sans-serif' }}>⚽ {pred.goleadores.join(', ')}</p>
                    )}
                    {partidoActivo.finalizado && (
                      <p style={{ fontSize: '12px', color: '#a9bcdc', marginTop: '8px', fontFamily: 'Archivo, sans-serif' }}>
                        Resultado final: {marcadorFinal[0]} - {marcadorFinal[1]}
                      </p>
                    )}
                    {pred.puntos > 0 && <div className="porra-locked__pts">+{pred.puntos} puntos</div>}
                  </div>
                ) : (
                  <div className="porra-locked">
                    <p className="porra-locked__label">Porra cerrada</p>
                    <p style={{ color: '#a9bcdc', fontFamily: 'Archivo, sans-serif', fontSize: '13px', margin: 0 }}>
                      {partidoActivo.finalizado ? `Resultado final: ${marcadorFinal[0]} - ${marcadorFinal[1]}` : 'No hiciste tu pronóstico a tiempo.'}
                    </p>
                  </div>
                )
              )}

              <div className="porra-participants">
                <div className="porra-participants__avatars">
                  {avataresParticipantes.map((entry, i) => (
                    entry.profiles?.avatar_url ? (
                      <img key={i} className="porra-avatar-mini" src={entry.profiles.avatar_url} alt="" />
                    ) : (
                      <span key={i} className="porra-avatar-mini">{inicialesDe(entry.profiles?.name || entry.profiles?.username)}</span>
                    )
                  ))}
                </div>
                {participantes !== null && (
                  <span className="porra-participants__text">{participantes.toLocaleString('es-ES')} zaragocistas ya participan</span>
                )}
              </div>
            </div>

            {/* DERECHA — temporada y clasificación */}
            <div className="porra-sidebar" ref={sidebarRef}>
              <div className="porra-season" ref={seasonRef}>
                <p className="porra-season__title">Tu temporada</p>
                {user && miEntrada ? (
                  <>
                    <div className="porra-season__stats">
                      <div className="porra-season__stat">
                        <span className="porra-season__value">{miEntrada.puntos_total}</span>
                        <span className="porra-season__stat-label">Puntos</span>
                      </div>
                      {miPosicion !== -1 && (
                        <div className="porra-season__stat">
                          <span className="porra-season__value">{miPosicion + 1}.º</span>
                          <span className="porra-season__stat-label">Posición</span>
                        </div>
                      )}
                    </div>
                    {racha > 0 && (
                      <p className="porra-season__streak">{racha} {racha === 1 ? 'jornada seguida participando' : 'jornadas seguidas participando'}</p>
                    )}
                  </>
                ) : user ? (
                  <p className="porra-season__empty">Aún no tienes puntos — haz tu primer pronóstico.</p>
                ) : (
                  <>
                    <p className="porra-season__empty">Inicia sesión para ver tu temporada y competir en el ranking.</p>
                    <button className="porra-season__login" onClick={signInWithGoogle}>Iniciar sesión</button>
                  </>
                )}
              </div>

              <div className="porra-ranking">
                <div className="porra-ranking__header" ref={rankingHeaderRef}>
                  <p className="porra-ranking__title">Clasificación</p>
                </div>

                <div className="porra-ranking__rows">
                  {ranking.length === 0 && <p className="porra-ranking__empty">Aún no hay puntuaciones.</p>}

                  {rankingVisible.map((entry, i) => {
                    const pos = offsetVisible + i
                    const nombre = entry.profiles?.name || entry.profiles?.username || 'Usuario'
                    const esYo = user?.id === entry.user_id
                    return (
                      <div key={entry.user_id} className={`porra-ranking__row${esYo ? ' is-me' : ''}`}>
                        <span className={`porra-ranking__pos${pos === 0 ? ' porra-ranking__pos--1' : pos === 1 ? ' porra-ranking__pos--2' : pos === 2 ? ' porra-ranking__pos--3' : ''}`}>
                          {pos + 1}
                        </span>
                        <div className="porra-ranking__user">
                          {entry.profiles?.avatar_url ? (
                            <img className="porra-ranking__avatar" src={entry.profiles.avatar_url} alt="" />
                          ) : (
                            <span className="porra-ranking__avatar">{inicialesDe(nombre)}</span>
                          )}
                          <span className="porra-ranking__name">{esYo ? `${nombre} · Tú` : nombre}</span>
                        </div>
                        <span className="porra-ranking__pts">{entry.puntos_total} pts</span>
                      </div>
                    )
                  })}
                </div>

                {ranking.length > 0 && (
                  <div className="porra-ranking__footer" ref={rankingFooterRef}>
                    <button onClick={abrirModalRanking}>Ver clasificación completa ↗</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      <div className="porra-container">
        {/* ÚLTIMAS / PRÓXIMAS JORNADAS */}
        {!loading && partidos.length > 0 && (
          <div className="porra-jornadas">
            <div className="porra-jornadas__header">
              <div className="porra-jornadas__tabs">
                <button
                  className={`porra-jornadas__tab${vistaJornadas === 'ultimas' ? ' is-active' : ''}`}
                  onClick={() => setVistaJornadas('ultimas')}
                >
                  Últimas jornadas
                </button>
                <button
                  className={`porra-jornadas__tab${vistaJornadas === 'proximas' ? ' is-active' : ''}`}
                  onClick={() => setVistaJornadas('proximas')}
                >
                  Próximas jornadas
                </button>
              </div>
              <button className="porra-jornadas__see-all">Ver todo ↗</button>
            </div>

            {vistaJornadas === 'ultimas' ? (
              ultimasJornadas.length === 0 ? (
                <p className="porra-jornadas__empty">Aún no se ha disputado ninguna jornada.</p>
              ) : (
                <div className="porra-jornadas__list">
                  {ultimasJornadas.map(p => {
                    const pr = predicciones[p.id]
                    const esLocalP = p.sede === 'local'
                    const final = esLocalP ? [p.goles_zaragoza, p.goles_rival] : [p.goles_rival, p.goles_zaragoza]
                    const prono = pr ? (esLocalP ? [pr.goles_zaragoza, pr.goles_rival] : [pr.goles_rival, pr.goles_zaragoza]) : null
                    const escudoRivalP = ESCUDOS[p.rival]
                    return (
                      <div key={p.id} className="porra-jornada-card">
                        <div className="porra-jornada-card__top">
                          <span className="porra-jornada-card__meta">J{p.jornada} · {p.rival}</span>
                          <span className="porra-jornada-card__badge">Final</span>
                        </div>
                        <div className="porra-jornada-card__score">
                          <img className="porra-jornada-card__crest" src={esLocalP ? ESCUDO_ZARAGOZA : (escudoRivalP || ESCUDO_ZARAGOZA)} alt="" onError={e => { e.target.style.visibility = 'hidden' }} />
                          <span className="porra-jornada-card__result">{final[0]} - {final[1]}</span>
                          <img className="porra-jornada-card__crest" src={esLocalP ? (escudoRivalP || ESCUDO_ZARAGOZA) : ESCUDO_ZARAGOZA} alt="" onError={e => { e.target.style.visibility = 'hidden' }} />
                        </div>
                        <div className="porra-jornada-card__divider" />
                        <div className="porra-jornada-card__bottom">
                          <div>
                            <div className="porra-jornada-card__label">Tu pronóstico</div>
                            <div className="porra-jornada-card__value">{prono ? `${prono[0]} - ${prono[1]}` : '—'}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="porra-jornada-card__label">Puntos</div>
                            <div className={`porra-jornada-card__value${pr?.puntos > 0 ? ' porra-jornada-card__value--pts' : ''}`}>
                              {pr?.puntos > 0 ? `+${pr.puntos} pts` : '0 pts'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            ) : (
              proximasJornadas.length === 0 ? (
                <p className="porra-jornadas__empty">No hay más jornadas programadas.</p>
              ) : (
                <div className="porra-jornadas__list">
                  {proximasJornadas.map(p => {
                    const esLocalP = p.sede === 'local'
                    const escudoRivalP = ESCUDOS[p.rival]
                    const abiertaP = p.abierto && !haEmpezado(p.kickoff)
                    return (
                      <div key={p.id} className="porra-jornada-card">
                        <div className="porra-jornada-card__top">
                          <span className="porra-jornada-card__meta">J{p.jornada} · {p.rival}</span>
                          <span className={`porra-badge ${abiertaP ? 'porra-badge--open' : 'porra-badge--closed'}`}>
                            {abiertaP ? 'Abierta' : 'Próximamente'}
                          </span>
                        </div>
                        <div className="porra-jornada-card__score">
                          <img className="porra-jornada-card__crest" src={esLocalP ? ESCUDO_ZARAGOZA : (escudoRivalP || ESCUDO_ZARAGOZA)} alt="" onError={e => { e.target.style.visibility = 'hidden' }} />
                          <span className="porra-jornada-card__result">VS</span>
                          <img className="porra-jornada-card__crest" src={esLocalP ? (escudoRivalP || ESCUDO_ZARAGOZA) : ESCUDO_ZARAGOZA} alt="" onError={e => { e.target.style.visibility = 'hidden' }} />
                        </div>
                        <div className="porra-jornada-card__divider" />
                        <div className="porra-jornada-card__bottom">
                          <div>
                            <div className="porra-jornada-card__label">Fecha</div>
                            <div className="porra-jornada-card__value">{new Date(p.kickoff).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '')}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="porra-jornada-card__label">Estadio</div>
                            <div className="porra-jornada-card__value">{esLocalP ? 'Ibercaja Estadio' : 'Fuera de casa'}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {modalRankingAbierto && (
        <div className="porra-modal-overlay" onClick={() => setModalRankingAbierto(false)}>
          <div
            className="porra-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="porra-modal-ranking-title"
            tabIndex={-1}
            ref={modalRankingRef}
            onClick={e => e.stopPropagation()}
          >
            <div className="porra-modal__header">
              <h2 id="porra-modal-ranking-title" className="porra-modal__title">Clasificación completa</h2>
              <button className="porra-modal__close" onClick={() => setModalRankingAbierto(false)} aria-label="Cerrar clasificación">✕</button>
            </div>
            <div className="porra-modal__body">
              {ranking.length === 0 ? (
                <p className="porra-ranking__empty">Aún no hay puntuaciones.</p>
              ) : (
                ranking.map((entry, i) => {
                  const nombre = entry.profiles?.name || entry.profiles?.username || 'Usuario'
                  const esYo = user?.id === entry.user_id
                  return (
                    <div key={entry.user_id} className={`porra-ranking__row${esYo ? ' is-me' : ''}`}>
                      <span className={`porra-ranking__pos${i === 0 ? ' porra-ranking__pos--1' : i === 1 ? ' porra-ranking__pos--2' : i === 2 ? ' porra-ranking__pos--3' : ''}`}>
                        {i + 1}
                      </span>
                      <div className="porra-ranking__user">
                        {entry.profiles?.avatar_url ? (
                          <img className="porra-ranking__avatar" src={entry.profiles.avatar_url} alt="" />
                        ) : (
                          <span className="porra-ranking__avatar">{inicialesDe(nombre)}</span>
                        )}
                        <span className="porra-ranking__name">{esYo ? `${nombre} · Tú` : nombre}</span>
                      </div>
                      <span className="porra-ranking__pts">{entry.puntos_total} pts</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {modalComoSeJuegaAbierto && (
        <div className="porra-modal-overlay" onClick={() => setModalComoSeJuegaAbierto(false)}>
          <div
            className="porra-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="porra-modal-howto-title"
            tabIndex={-1}
            ref={modalComoSeJuegaRef}
            onClick={e => e.stopPropagation()}
          >
            <div className="porra-modal__header">
              <h2 id="porra-modal-howto-title" className="porra-modal__title">Cómo se juega</h2>
              <button className="porra-modal__close" onClick={() => setModalComoSeJuegaAbierto(false)} aria-label="Cerrar cómo se juega">✕</button>
            </div>
            <div className="porra-modal__body porra-modal__body--howto">
              <div className="porra-howto-box__item">
                <span className="porra-howto-box__pts">5 PTS</span>
                <span className="porra-howto-box__label">Resultado exacto</span>
              </div>
              <div className="porra-howto-box__item">
                <span className="porra-howto-box__pts">3 PTS</span>
                <span className="porra-howto-box__label">Todos los goleadores</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
