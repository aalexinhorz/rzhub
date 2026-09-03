import { useState, useEffect, useRef } from 'react'
import SEO, { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'
import useAuth, { supabase } from '../hooks/useAuth'
import { ESCUDO_ZARAGOZA, useEscudo } from '../lib/escudos'
import './AdivinaResultado.css'

const NUM_RONDAS = 10
const PUNTOS_MAX = 1000
const PUNTOS_MIN = 100
const TIEMPO_MAX_S = 15 // a partir de aquí, si aciertas, siempre da el mínimo
const NUMEROS = Array.from({ length: 10 }, (_, i) => i)

function calcularPuntos(segundos) {
  const t = Math.min(segundos, TIEMPO_MAX_S)
  return Math.round(PUNTOS_MAX - (PUNTOS_MAX - PUNTOS_MIN) * (t / TIEMPO_MAX_S))
}

function EscudoEquipo({ nombre }) {
  const crestFallback = useEscudo(nombre)
  const crest = nombre === 'Real Zaragoza' ? ESCUDO_ZARAGOZA : crestFallback
  return (
    <div className="adivina-vs__equipo">
      <span className="adivina-vs__escudo">
        {crest ? <img src={crest} alt="" /> : <span className="adivina-vs__escudo-fallback">{nombre[0]}</span>}
      </span>
      <span className="adivina-vs__nombre">{nombre}</span>
    </div>
  )
}

function RankingView({ ranking, user }) {
  return (
    <div style={{ width: '100%' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', textAlign: 'center', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Clasificación
      </h3>
      <div className="adivina-ranking__header">
        <span>POS</span><span>USUARIO</span><span style={{ textAlign: 'right' }}>PUNTOS</span>
      </div>
      {ranking.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--rz-text-muted)', padding: '24px 0' }}>Aún no hay puntuaciones.</p>
      )}
      {ranking.map((entry, i) => {
        const nombre = entry.profiles?.name || entry.profiles?.username || 'Usuario'
        return (
          <div key={entry.id} className="adivina-ranking__row" style={{ background: user?.id === entry.user_id ? 'rgba(255,200,0,0.06)' : 'transparent' }}>
            <span className={`adivina-ranking__pos${i === 0 ? ' pos-1' : i === 1 ? ' pos-2' : i === 2 ? ' pos-3' : ''}`}>{i + 1}</span>
            <span className="adivina-ranking__usuario">
              {entry.profiles?.avatar_url ? (
                <img className="adivina-ranking__avatar" src={entry.profiles.avatar_url} alt="" />
              ) : (
                <span className="adivina-ranking__avatar-fallback">{nombre[0].toUpperCase()}</span>
              )}
              <span className="adivina-ranking__nombre">{nombre}</span>
            </span>
            <span className="adivina-ranking__puntos">{entry.puntuacion}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function AdivinaResultado() {
  const { user, signInWithGoogle } = useAuth()

  const [fase, setFase] = useState('intro') // intro | jugando | fin
  const [mostrarRanking, setMostrarRanking] = useState(false)
  const [ranking, setRanking] = useState([])
  const [cargando, setCargando] = useState(false)

  const [rondas, setRondas] = useState([])
  const [rondaActual, setRondaActual] = useState(0)
  const [golesLocalSel, setGolesLocalSel] = useState(null)
  const [golesVisitanteSel, setGolesVisitanteSel] = useState(null)
  const [respondida, setRespondida] = useState(false)
  const [ultimoResultado, setUltimoResultado] = useState(null)
  const [historial, setHistorial] = useState([])
  const [segundos, setSegundos] = useState(0)
  const [guardado, setGuardado] = useState(false)

  const inicioRef = useRef(0)
  const guardadoRef = useRef(false)

  useEffect(() => { cargarRanking() }, [])

  // Cronómetro visible mientras no se haya respondido la ronda.
  useEffect(() => {
    if (fase !== 'jugando' || respondida) return
    const interval = setInterval(() => setSegundos((Date.now() - inicioRef.current) / 1000), 100)
    return () => clearInterval(interval)
  }, [fase, respondida, rondaActual])

  // En cuanto hay número elegido a los dos lados, se corrige la ronda al momento.
  // Va en el manejador de clic (no en un efecto) porque es la reacción directa
  // a la interacción del usuario, no una sincronización con algo externo.
  function elegirGol(lado, n) {
    if (respondida) return
    const nuevoLocal = lado === 'local' ? n : golesLocalSel
    const nuevoVisitante = lado === 'visitante' ? n : golesVisitanteSel
    if (lado === 'local') setGolesLocalSel(n)
    else setGolesVisitanteSel(n)
    if (nuevoLocal === null || nuevoVisitante === null) return

    const partido = rondas[rondaActual]
    const transcurrido = (Date.now() - inicioRef.current) / 1000
    const acierto = nuevoLocal === partido.goles_local && nuevoVisitante === partido.goles_visitante
    const puntos = acierto ? calcularPuntos(transcurrido) : 0
    setRespondida(true)
    setUltimoResultado({ acierto, puntos })
    setHistorial(h => [...h, { partido, golesLocalSel: nuevoLocal, golesVisitanteSel: nuevoVisitante, acierto, puntos }])
  }

  // Avanza sola a la siguiente ronda (o al final) tras mostrar el acierto/fallo.
  useEffect(() => {
    if (!respondida) return
    const timeout = setTimeout(() => {
      if (rondaActual + 1 >= rondas.length) {
        setFase('fin')
      } else {
        setRondaActual(r => r + 1)
        setGolesLocalSel(null)
        setGolesVisitanteSel(null)
        setRespondida(false)
        setUltimoResultado(null)
        setSegundos(0)
        inicioRef.current = Date.now()
      }
    }, 1600)
    return () => clearTimeout(timeout)
  }, [respondida, rondaActual, rondas.length])

  const puntuacionTotal = historial.reduce((acc, h) => acc + h.puntos, 0)

  // Si terminas la partida ya logueado (o inicias sesión desde la pantalla
  // final), se guarda sola en el ranking sin que haga falta pulsar nada más.
  useEffect(() => {
    if (fase !== 'fin' || !user || guardadoRef.current) return
    guardadoRef.current = true
    supabase.from('adivina_puntuaciones').insert({ user_id: user.id, puntuacion: puntuacionTotal }).then(() => {
      setGuardado(true)
      cargarRanking()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, user])

  async function cargarRanking() {
    const { data: puntuaciones } = await supabase
      .from('adivina_puntuaciones')
      .select('*')
      .order('puntuacion', { ascending: false })
      .limit(200)
    if (!puntuaciones) { setRanking([]); return }

    const mejorPorUsuario = new Map()
    puntuaciones.forEach(p => { if (!mejorPorUsuario.has(p.user_id)) mejorPorUsuario.set(p.user_id, p) })
    const top = Array.from(mejorPorUsuario.values()).slice(0, 50)

    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url')
      .in('id', top.map(p => p.user_id))
    const perfilesMap = {}
    perfiles?.forEach(p => { perfilesMap[p.id] = p })

    setRanking(top.map(p => ({ ...p, profiles: perfilesMap[p.user_id] || null })))
  }

  async function iniciarJuego() {
    setCargando(true)
    const { data } = await supabase.rpc('adivina_partidos_aleatorios', { cantidad: NUM_RONDAS })
    setCargando(false)
    if (!data || data.length === 0) return

    setRondas(data)
    setRondaActual(0)
    setHistorial([])
    setGolesLocalSel(null)
    setGolesVisitanteSel(null)
    setRespondida(false)
    setUltimoResultado(null)
    setGuardado(false)
    guardadoRef.current = false
    setSegundos(0)
    inicioRef.current = Date.now()
    setMostrarRanking(false)
    setFase('jugando')
  }

  const partidoActual = rondas[rondaActual]

  return (
    <div className="adivina-page">
      <SEO
        title="Adivina el Resultado | Real Zaragoza | RZ Hub"
        description="Adivina el marcador exacto de partidos reales del Real Zaragoza desde la temporada 2009-10 hasta hoy. Cuanto más rápido aciertes, más puntos. No hace falta registrarse para jugar."
        keywords="adivina el resultado Real Zaragoza, juego Real Zaragoza, trivia Real Zaragoza, resultados históricos Real Zaragoza, ranking Real Zaragoza"
        path="/adivina-resultado"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Adivina el Resultado | RZ Hub',
          url: `${SITE_URL}/adivina-resultado`,
          applicationCategory: 'GameApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
          description: 'Juego de trivia de resultados históricos del Real Zaragoza con ranking de la comunidad.',
        }}
      />

      <div className="adivina-page__hero">
        <p className="rz-eyebrow rz-eyebrow--yellow adivina-page__eyebrow">Real Zaragoza · Desde la 2009-10</p>
        <h1 className="adivina-page__title">Adivina el Resultado</h1>
        <p className="adivina-page__subtitle">Enfrentamientos reales del Real Zaragoza. Acierta el marcador exacto lo más rápido que puedas.</p>
      </div>

      <div className="adivina-page__body">
        <div className="adivina-page__container">

          {fase === 'intro' && (
            <div className="adivina-card">
              {!mostrarRanking ? (
                <>
                  <p style={{ textAlign: 'center', color: 'var(--rz-text-secondary)', fontSize: 'var(--text-sm)', margin: 0, lineHeight: 1.5 }}>
                    Van saliendo enfrentamientos reales del Real Zaragoza de distintas temporadas. Elige el marcador con los números del 0 al 9: cuanto más rápido aciertes, más puntos ganas.
                  </p>
                  <div className="adivina-reglas">
                    <div className="adivina-regla">
                      <span className="adivina-regla__valor">10</span>
                      <span className="adivina-regla__label">rondas por partida</span>
                    </div>
                    <div className="adivina-regla">
                      <span className="adivina-regla__valor">⚡</span>
                      <span className="adivina-regla__label">cuanto más rápido, más puntos</span>
                    </div>
                    <div className="adivina-regla">
                      <span className="adivina-regla__valor">0</span>
                      <span className="adivina-regla__label">puntos si fallas el marcador</span>
                    </div>
                  </div>
                  <button className="rz-btn rz-btn--primary rz-btn--lg" onClick={iniciarJuego} disabled={cargando}>
                    {cargando ? 'Cargando...' : '▶ Jugar'}
                  </button>
                  <button className="rz-btn rz-btn--ghost" onClick={() => setMostrarRanking(true)}>🏆 Ver ranking</button>
                  {!user && (
                    <p style={{ textAlign: 'center', color: 'var(--rz-text-muted)', fontSize: 'var(--text-xs)', margin: 0 }}>
                      No hace falta iniciar sesión para jugar. Solo la necesitas para guardar tu puntuación en el ranking.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <RankingView ranking={ranking} user={user} />
                  <button className="rz-btn rz-btn--ghost" onClick={() => setMostrarRanking(false)}>← Volver</button>
                </>
              )}
            </div>
          )}

          {fase === 'jugando' && partidoActual && (
            <div className="adivina-card">
              <div className="adivina-progreso">
                <span className="adivina-progreso__ronda">Ronda {rondaActual + 1}/{rondas.length}</span>
                {rondas.map((_, i) => (
                  <span key={i} className={`adivina-progreso__dot${i < rondaActual ? ' is-hecha' : i === rondaActual ? ' is-actual' : ''}`} />
                ))}
              </div>

              <div className="adivina-crono">
                {segundos.toFixed(1)}<span className="adivina-crono__unidad">s</span>
              </div>

              <div className="adivina-vs">
                <EscudoEquipo nombre={partidoActual.local} />
                <span className="adivina-vs__separador">VS</span>
                <EscudoEquipo nombre={partidoActual.visitante} />
              </div>
              <span className="adivina-vs__contexto">
                {partidoActual.competicion ? `${partidoActual.competicion} · ` : ''}{partidoActual.temporada}
              </span>

              {!respondida ? (
                <div className="adivina-picker">
                  <div className="adivina-picker__lado">
                    <span className="adivina-picker__label">{partidoActual.local}</span>
                    <div className="adivina-picker__numeros">
                      {NUMEROS.map(n => (
                        <button key={n} className={`adivina-numero${golesLocalSel === n ? ' is-activo' : ''}`} onClick={() => elegirGol('local', n)}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="adivina-picker__lado">
                    <span className="adivina-picker__label">{partidoActual.visitante}</span>
                    <div className="adivina-picker__numeros">
                      {NUMEROS.map(n => (
                        <button key={n} className={`adivina-numero${golesVisitanteSel === n ? ' is-activo' : ''}`} onClick={() => elegirGol('visitante', n)}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`adivina-feedback ${ultimoResultado.acierto ? 'es-acierto' : 'es-fallo'}`}>
                  <span className="adivina-feedback__titulo">
                    {ultimoResultado.acierto ? `¡Acierto! +${ultimoResultado.puntos}` : 'Fallo'}
                  </span>
                  <span className="adivina-feedback__detalle">
                    El resultado fue {partidoActual.local} {partidoActual.goles_local}-{partidoActual.goles_visitante} {partidoActual.visitante}
                  </span>
                </div>
              )}
            </div>
          )}

          {fase === 'fin' && (
            <div className="adivina-card">
              <span className="adivina-fin__puntuacion-label">Puntuación total</span>
              <span className="adivina-fin__puntuacion">{puntuacionTotal}</span>

              <div className="adivina-desglose">
                {historial.map((h, i) => (
                  <div key={i} className="adivina-desglose__item">
                    <span className="adivina-desglose__equipos">
                      {h.partido.local} {h.golesLocalSel}-{h.golesVisitanteSel} {h.partido.visitante}
                      {!h.acierto && <span style={{ opacity: 0.6 }}> (real {h.partido.goles_local}-{h.partido.goles_visitante})</span>}
                    </span>
                    <span className={`adivina-desglose__puntos ${h.acierto ? 'es-acierto' : 'es-fallo'}`}>
                      {h.acierto ? `+${h.puntos}` : '0'}
                    </span>
                  </div>
                ))}
              </div>

              {user ? (
                <p style={{ color: 'var(--rz-green)', fontSize: 'var(--text-sm)', margin: 0 }}>
                  {guardado ? '✅ Resultado guardado en el ranking' : 'Guardando resultado...'}
                </p>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: 'var(--rz-text-secondary)', fontSize: 'var(--text-sm)', margin: '0 0 10px' }}>
                    Inicia sesión para guardar tu resultado y aparecer en el ranking.
                  </p>
                  <button className="rz-btn rz-btn--primary" onClick={signInWithGoogle}>Iniciar sesión con Google</button>
                </div>
              )}

              <div className="adivina-fin__acciones">
                <button className="rz-btn rz-btn--primary" onClick={iniciarJuego}>🔁 Jugar de nuevo</button>
                <button className="rz-btn rz-btn--ghost" onClick={() => { setFase('intro'); setMostrarRanking(true); cargarRanking() }}>
                  🏆 Ver ranking
                </button>
              </div>
            </div>
          )}

        </div>
        <Footer />
      </div>
    </div>
  )
}
