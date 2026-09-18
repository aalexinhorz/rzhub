import { useState, useEffect } from 'react'
import { supabase } from '../hooks/useAuth'
import useAuth from '../hooks/useAuth'
import usePlayers from '../hooks/usePlayers'
import SEO from '../components/SEO'
import Footer from '../components/Footer'
import './Porra.css'
import './Porra2.css'

// ============================================================
// PORRA2 — PROTOTIPO VISUAL, NO ES UNA PÁGINA REAL
// ============================================================
// Segundo intento: la primera versión reskineaba todo a claro/rojo
// (estilo Atlético Stats) y no era lo pedido. Esta usa la MISMA
// estética que la Porra real —fondo, Porra.css tal cual, colores,
// tipografías— y solo añade/reordena elementos para acercarse a la
// estructura de la referencia: carrusel de jornadas con escudos,
// marcador en una sola fila (escudo-selector-separador-selector-escudo,
// sin fila de nombres aparte), ganador de la jornada anterior,
// clasificación completa con buscador+paginación siempre visible.
//
// Todo lo de esta página es real: partido activo, marcador,
// goleadores (5 pts resultado exacto, 3 pts todos los goleadores —
// mismas reglas que la Porra real), guardar predicción, ranking, "tu
// temporada", ganador de la última jornada (calculado de verdad
// contra porra_predicciones), últimas jornadas.
//
// Qué se deja fuera a propósito: "pregunta stats" y "MVP del
// partido" de la referencia (no existen esas columnas en Supabase, se
// quitaron tras la primera vuelta), "pases de temporada" y "palmarés"
// (no existen como concepto en nuestro esquema — una sola porra por
// temporada) y la exportación a imagen/compartir en X/Instagram de
// Porra.jsx (no aporta nada a la comparación de layout).

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
const EXCLUIDOS_GOLEADORES = ['Jorge Franco', 'Berrar', 'Marcos Manolache']
const HORA_PLACEHOLDER = '18:30'
const FILAS_POR_PAGINA = 10

function formatFechaHora(kickoff) {
  const d = new Date(kickoff)
  const dia = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')
  const diaCap = dia.charAt(0).toUpperCase() + dia.slice(1)
  const fecha = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
  const horaConocida = !(d.getUTCHours() === 0 && d.getUTCMinutes() === 0)
  const hora = horaConocida ? d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : HORA_PLACEHOLDER
  return `${diaCap}. ${fecha} · ${hora} h`
}
function haEmpezado(kickoff) { return new Date() >= new Date(kickoff) }
function isCerrada(partido) { return !partido.abierto || haEmpezado(partido.kickoff) }
function getPartidoActivo(partidos) {
  const abierto = partidos.find(p => p.abierto)
  if (abierto) return abierto
  const ahora = new Date()
  const proximos = partidos.filter(p => new Date(p.kickoff) > ahora)
  if (proximos.length > 0) return proximos[0]
  return [...partidos].reverse()[0] || null
}
const inicialesDe = nombre => (nombre || 'U').trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
function normalizarBusqueda(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g'), '')
}

// -------- Carrusel de jornadas (nuevo: no existía en Porra.jsx) --------
function CarruselItem({ p, activo, onClick }) {
  const escudoRivalP = ESCUDOS[p.rival] || ESCUDO_ZARAGOZA
  const abiertaP = p.abierto && !haEmpezado(p.kickoff)
  return (
    <button type="button" className={`p2-carrusel__item${activo ? ' is-activa' : ''}`} onClick={onClick}>
      <img className="p2-carrusel__crest" src={escudoRivalP} alt="" onError={e => { e.target.style.visibility = 'hidden' }} />
      <span className="p2-carrusel__fecha">{new Date(p.kickoff).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '')}</span>
      {activo && <span className="p2-carrusel__badge">ACTIVA</span>}
      {!activo && p.finalizado && <span className="p2-carrusel__dot" />}
      {!activo && abiertaP && <span className="p2-carrusel__dot p2-carrusel__dot--open" />}
    </button>
  )
}

// Tarjetas de jornada — mismo componente que Porra.jsx (ver ese archivo
// para el comentario original de por qué están extraídas).
function JornadaFinalCard({ p, pred }) {
  const esLocalP = p.sede === 'local'
  const final = esLocalP ? [p.goles_zaragoza, p.goles_rival] : [p.goles_rival, p.goles_zaragoza]
  const prono = pred ? (esLocalP ? [pred.goles_zaragoza, pred.goles_rival] : [pred.goles_rival, pred.goles_zaragoza]) : null
  const escudoRivalP = ESCUDOS[p.rival]
  return (
    <div className="porra-jornada-card">
      <div className="porra-jornada-card__top">
        <span className="porra-jornada-card__meta">J{p.jornada} · {p.rival}</span>
        <span className="porra-badge porra-badge--closed">Final</span>
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
          <div className={`porra-jornada-card__value${pred?.puntos > 0 ? ' porra-jornada-card__value--pts' : ''}`}>{pred?.puntos > 0 ? `+${pred.puntos} pts` : '0 pts'}</div>
        </div>
      </div>
    </div>
  )
}

export default function Porra2() {
  const { user, signInWithGoogle } = useAuth()
  const [partidos, setPartidos] = useState([])
  const [predicciones, setPredicciones] = useState({})
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [form, setForm] = useState({ goles_zaragoza: 0, goles_rival: 0, goleadores: [] })
  const { players } = usePlayers()
  const jugadoresZaragoza = players.filter(p => p.isZaragoza && !EXCLUIDOS_GOLEADORES.includes(p.name))
  const [partidoActivo, setPartidoActivo] = useState(null)
  const [participantes, setParticipantes] = useState(null)
  const [mostrarGoleadores, setMostrarGoleadores] = useState(false)
  const [ganadorAnterior, setGanadorAnterior] = useState(null) // null=cargando, []=sin datos, [...]=nombres

  // Clasificación completa con búsqueda + paginación, siempre visible
  // (en Porra.jsx esto vive en una modal; aquí va directamente en la
  // página, como en la referencia).
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)

  useEffect(() => { fetchPartidos(); fetchRanking() }, [])
  useEffect(() => { if (user) fetchPredicciones() }, [user])
  useEffect(() => {
    if (partidos.length > 0 && !partidoActivo) setPartidoActivo(getPartidoActivo(partidos))
  }, [partidos])
  useEffect(() => {
    if (partidoActivo && predicciones[partidoActivo.id]) {
      const pred = predicciones[partidoActivo.id]
      setForm({ goles_zaragoza: pred.goles_zaragoza, goles_rival: pred.goles_rival, goleadores: pred.goleadores || [] })
      if (pred.goleadores?.length > 0) setMostrarGoleadores(true)
    } else {
      setForm({ goles_zaragoza: 0, goles_rival: 0, goleadores: [] })
      setMostrarGoleadores(false)
    }
  }, [partidoActivo, predicciones])
  useEffect(() => {
    if (!partidoActivo) return
    supabase.from('porra_predicciones').select('*', { count: 'exact', head: true }).eq('partido_id', partidoActivo.id)
      .then(({ count }) => setParticipantes(count || 0))
  }, [partidoActivo])

  // Ganador real de la última jornada finalizada: quien tenga más
  // puntos en porra_predicciones para ese partido_id (empate -> se
  // muestran todos los que están en el máximo).
  useEffect(() => {
    const ultimaFinalizada = [...partidos].filter(p => p.finalizado).sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff))[0]
    if (!ultimaFinalizada) { setGanadorAnterior([]); return }
    supabase
      .from('porra_predicciones')
      .select('user_id, puntos')
      .eq('partido_id', ultimaFinalizada.id)
      .order('puntos', { ascending: false })
      .then(async ({ data }) => {
        if (!data || data.length === 0 || data[0].puntos <= 0) { setGanadorAnterior([]); return }
        const max = data[0].puntos
        const ganadores = data.filter(d => d.puntos === max)
        const { data: perfiles } = await supabase.from('profiles').select('id, name, username').in('id', ganadores.map(g => g.user_id))
        setGanadorAnterior(ganadores.map(g => {
          const perfil = perfiles?.find(p => p.id === g.user_id)
          return { nombre: perfil?.name || perfil?.username || 'Usuario', puntos: g.puntos }
        }))
      })
  }, [partidos])

  async function fetchPartidos() {
    const { data } = await supabase.from('porra_partidos').select('*').order('kickoff', { ascending: true })
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
    const { data: puntos } = await supabase.from('porra_puntos').select('*').order('puntos_total', { ascending: false })
    if (!puntos || puntos.length === 0) { setRanking([]); return }
    const { data: perfiles } = await supabase.from('profiles').select('id, name, username, avatar_url').in('id', puntos.map(p => p.user_id))
    const perfilesMap = {}
    perfiles?.forEach(p => { perfilesMap[p.id] = p })
    setRanking(puntos.map(p => ({ ...p, profiles: perfilesMap[p.user_id] || null })))
  }
  async function guardarPrediccion() {
    if (!user) return signInWithGoogle()
    if (!partidoActivo) return
    setGuardando(true)
    const payload = { user_id: user.id, partido_id: partidoActivo.id, goles_zaragoza: form.goles_zaragoza, goles_rival: form.goles_rival, goleadores: form.goleadores }
    const existing = predicciones[partidoActivo.id]
    if (existing) await supabase.from('porra_predicciones').update(payload).eq('id', existing.id)
    else await supabase.from('porra_predicciones').insert(payload)
    await fetchPredicciones()
    setGuardando(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }
  function ajustarMarcador(campo, delta) {
    setForm(f => ({ ...f, [campo]: Math.max(0, Math.min(20, f[campo] + delta)) }))
  }
  function toggleGoleador(nombre) {
    setForm(f => ({ ...f, goleadores: f.goleadores.includes(nombre) ? f.goleadores.filter(n => n !== nombre) : [...f.goleadores, nombre] }))
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
  const marcadorPred = pred ? (esLocal ? [pred.goles_zaragoza, pred.goles_rival] : [pred.goles_rival, pred.goles_zaragoza]) : null

  const miEntrada = user ? ranking.find(entry => entry.user_id === user.id) : null
  const miPosicion = user ? ranking.findIndex(entry => entry.user_id === user.id) : -1
  const rankingVisible = ranking.slice(0, 8)

  const ultimasJornadas = partidos.filter(p => p.finalizado).sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff)).slice(0, 3)

  const rankingFiltrado = busqueda.trim()
    ? ranking.filter(e => normalizarBusqueda(e.profiles?.name || e.profiles?.username || '').includes(normalizarBusqueda(busqueda)))
    : ranking
  const totalPaginas = Math.max(1, Math.ceil(rankingFiltrado.length / FILAS_POR_PAGINA))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const rankingPagina = rankingFiltrado.slice((paginaSegura - 1) * FILAS_POR_PAGINA, paginaSegura * FILAS_POR_PAGINA)

  return (
    <div className="porra-page">
      {/* Prototipo sin enlazar en la navegación — noindex explícito
          por si alguien comparte la URL directa. */}
      <SEO title="Porra2 (prototipo interno) | RZ Hub" description="Prototipo visual interno, no es una página pública." path="/porra2" noindex />
      <div className="porra-atmosphere">
        <div className="porra-hero">
          <div className="porra-hero__inner">
            <h1 className="porra-hero__title">La Porra</h1>
            <div className="porra-hero__row">
              <p className="porra-hero__subtitle">Participa cada jornada y gana premios a final de temporada.</p>
            </div>

            {/* Carrusel de jornadas — nuevo, inspirado en la referencia */}
            {!loading && partidos.length > 0 && (
              <div className="p2-carrusel">
                {partidos.map(p => (
                  <CarruselItem key={p.id} p={p} activo={partidoActivo?.id === p.id} onClick={() => setPartidoActivo(p)} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="porra-container">
          {loading && <p style={{ color: '#a9bcdc', fontFamily: 'Archivo, sans-serif' }}>Cargando...</p>}

          {!loading && partidoActivo && (
            <div className="porra-grid">
              {/* IZQUIERDA */}
              <div className="porra-match-card">
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

                {/* Marcador en una sola fila (escudo–selector–separador–selector–escudo),
                    igual que la referencia — sin fila de nombres aparte. */}
                <div className="p2-marcador-fila">
                  <img
                    className="p2-marcador-fila__crest"
                    src={esLocal ? ESCUDO_ZARAGOZA : (escudoRival || ESCUDO_ZARAGOZA)}
                    alt={esLocal ? 'Real Zaragoza' : partidoActivo.rival}
                    onError={e => { e.target.style.visibility = 'hidden' }}
                  />
                  {!cerrada ? (
                    <div className="porra-team__selector">
                      <button className="porra-stepper-btn" onClick={() => ajustarMarcador(esLocal ? 'goles_zaragoza' : 'goles_rival', -1)} disabled={(esLocal ? form.goles_zaragoza : form.goles_rival) <= 0}>−</button>
                      <span className="porra-score-value">{esLocal ? form.goles_zaragoza : form.goles_rival}</span>
                      <button className="porra-stepper-btn" onClick={() => ajustarMarcador(esLocal ? 'goles_zaragoza' : 'goles_rival', 1)}>+</button>
                    </div>
                  ) : (
                    <span className="porra-score-value">{marcadorPred ? marcadorPred[0] : '–'}</span>
                  )}

                  <span className="porra-teams__sep">–</span>

                  {!cerrada ? (
                    <div className="porra-team__selector">
                      <button className="porra-stepper-btn" onClick={() => ajustarMarcador(esLocal ? 'goles_rival' : 'goles_zaragoza', -1)} disabled={(esLocal ? form.goles_rival : form.goles_zaragoza) <= 0}>−</button>
                      <span className="porra-score-value">{esLocal ? form.goles_rival : form.goles_zaragoza}</span>
                      <button className="porra-stepper-btn" onClick={() => ajustarMarcador(esLocal ? 'goles_rival' : 'goles_zaragoza', 1)}>+</button>
                    </div>
                  ) : (
                    <span className="porra-score-value">{marcadorPred ? marcadorPred[1] : '–'}</span>
                  )}
                  <img
                    className="p2-marcador-fila__crest"
                    src={esLocal ? (escudoRival || ESCUDO_ZARAGOZA) : ESCUDO_ZARAGOZA}
                    alt={esLocal ? partidoActivo.rival : 'Real Zaragoza'}
                    onError={e => { e.target.style.visibility = 'hidden' }}
                  />
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
                      <div className="porra-goleadores-grid" onClick={e => e.stopPropagation()}>
                        {jugadoresZaragoza.map(jugador => {
                          const seleccionado = form.goleadores.includes(jugador.name)
                          return (
                            <button type="button" key={jugador.id} className={`porra-goleador-card${seleccionado ? ' is-selected' : ''}`} onClick={() => toggleGoleador(jugador.name)}>
                              <img className="porra-goleador-card__foto" src={jugador.photo} alt="" onError={e => { e.target.style.visibility = 'hidden' }} />
                              <span className="porra-goleador-card__nombre">{jugador.shortName}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    <button className={`porra-cta${guardado ? ' porra-cta--saved' : ''}`} onClick={guardarPrediccion} disabled={guardando}>
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
                    {ranking.slice(0, 3).map((entry, i) => (
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

              {/* DERECHA */}
              <div className="porra-sidebar">
                <div className="porra-season">
                  <p className="porra-season__title">Tu temporada</p>
                  {user && miEntrada ? (
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
                  ) : user ? (
                    <p className="porra-season__empty">Aún no tienes puntos — haz tu primer pronóstico.</p>
                  ) : (
                    <div className="porra-season__guest">
                      <p className="porra-season__headline">Cada jornada cuenta</p>
                      <p className="porra-season__empty">Inicia sesión para guardar tus pronósticos y seguir tus puntos.</p>
                      <button className="porra-season__login" onClick={signInWithGoogle}>Iniciar sesión</button>
                    </div>
                  )}
                </div>

                <div className="porra-ranking">
                  <div className="porra-ranking__header">
                    <p className="porra-ranking__title">Clasificación</p>
                  </div>
                  <div className="porra-ranking__rows">
                    {ranking.length === 0 && <p className="porra-ranking__empty">Aún no hay puntuaciones.</p>}
                    {rankingVisible.map((entry, i) => {
                      const nombre = entry.profiles?.name || entry.profiles?.username || 'Usuario'
                      const esYo = user?.id === entry.user_id
                      return (
                        <div key={entry.user_id} className={`porra-ranking__row${esYo ? ' is-me' : ''}`}>
                          <span className={`porra-ranking__pos${i === 0 ? ' porra-ranking__pos--1' : i === 1 ? ' porra-ranking__pos--2' : i === 2 ? ' porra-ranking__pos--3' : ''}`}>{i + 1}</span>
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
                </div>

                {/* Ganador de la jornada anterior — nuevo, dato real */}
                {ganadorAnterior && ganadorAnterior.length > 0 && (
                  <div className="p2-ganador-anterior">
                    <span className="p2-ganador-anterior__label">Ganador jornada anterior</span>
                    <span className="p2-ganador-anterior__nombre">{ganadorAnterior.map(g => g.nombre).join(' · ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="porra-container">
        {/* CLASIFICACIÓN GENERAL — nuevo: siempre visible, con buscador y paginación */}
        {!loading && ranking.length > 0 && (
          <div className="p2-clasificacion-completa">
            <h2 className="p2-section-title">La clasificación general</h2>
            <div className="p2-buscador">
              <input type="text" placeholder="Buscar usuario..." value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(1) }} />
            </div>
            <div className="p2-tabla-completa">
              <div className="p2-tabla-completa__cabecera"><span>#</span><span>Usuario</span><span>Puntos</span></div>
              {rankingPagina.map((entry, i) => {
                const posReal = (paginaSegura - 1) * FILAS_POR_PAGINA + i
                const nombre = entry.profiles?.name || entry.profiles?.username || 'Usuario'
                const esYo = user?.id === entry.user_id
                return (
                  <div key={entry.user_id} className={`p2-tabla-completa__fila${esYo ? ' is-me' : ''}`}>
                    <span>{posReal + 1}</span>
                    <span className="p2-tabla-completa__usuario">
                      {entry.profiles?.avatar_url ? <img src={entry.profiles.avatar_url} alt="" /> : <span className="p2-tabla-completa__avatar-fallback">{inicialesDe(nombre)}</span>}
                      {nombre}
                    </span>
                    <span>{entry.puntos_total}</span>
                  </div>
                )
              })}
              {rankingPagina.length === 0 && <p className="p2-vacio" style={{ padding: '20px' }}>Sin resultados para "{busqueda}".</p>}
            </div>
            <div className="p2-paginacion">
              <span>{rankingFiltrado.length === 0 ? 0 : (paginaSegura - 1) * FILAS_POR_PAGINA + 1}–{Math.min(paginaSegura * FILAS_POR_PAGINA, rankingFiltrado.length)} de {rankingFiltrado.length}</span>
              <div className="p2-paginacion__botones">
                <button disabled={paginaSegura <= 1} onClick={() => setPagina(1)}>«</button>
                <button disabled={paginaSegura <= 1} onClick={() => setPagina(p => p - 1)}>‹</button>
                <button disabled={paginaSegura >= totalPaginas} onClick={() => setPagina(p => p + 1)}>›</button>
                <button disabled={paginaSegura >= totalPaginas} onClick={() => setPagina(totalPaginas)}>»</button>
              </div>
            </div>
          </div>
        )}

        {/* ÚLTIMAS JORNADAS (igual que Porra.jsx) */}
        {!loading && ultimasJornadas.length > 0 && (
          <div className="porra-jornadas">
            <div className="porra-jornadas__header">
              <div className="porra-jornadas__tabs"><span className="porra-jornadas__tab is-active">Últimas jornadas</span></div>
            </div>
            <div className="porra-jornadas__list">
              {ultimasJornadas.map(p => <JornadaFinalCard key={p.id} p={p} pred={predicciones[p.id]} />)}
            </div>
          </div>
        )}

        {/* CÓMO FUNCIONA — reglas reales, en fila (en Porra.jsx está en modal) */}
        <div className="p2-howto">
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

      <Footer />
    </div>
  )
}
