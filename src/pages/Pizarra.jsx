import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SEO, { SITE_URL } from '../components/SEO'
import Footer from '../components/Footer'
import PizarraCampo from '../components/PizarraCampo'
import usePlayers from '../hooks/usePlayers'
import usePizarraPlayback from '../hooks/usePizarraPlayback'
import { descargarPizarra } from '../lib/pizarraCanvas'
import { descargarVideoPizarra, soportaGrabacionVideo } from '../lib/pizarraVideo'
import './Pizarra.css'

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/fallback-dark.png'

const GRUPOS_POSICION = [
  { id: null, label: 'Todos' },
  { id: 'POR', label: 'Porteros' },
  { id: 'DEF', label: 'Defensas' },
  { id: 'MED', label: 'Centrocampistas' },
  { id: 'DEL', label: 'Delanteros' },
]

// Solo para las pestañas de filtro del buscador — no restringe nada,
// a diferencia de la antigua carga de formación (quitada): es pura
// presentación sobre los mismos jugadores de siempre.
function grupoPosicion(pos) {
  const p = (pos || '').toUpperCase()
  if (p.startsWith('POR')) return 'POR'
  if (p === 'LD' || p === 'LI' || p.startsWith('DEF')) return 'DEF'
  if (p === 'MC' || p.startsWith('MED')) return 'MED'
  if (p === 'ED' || p === 'EI' || p.startsWith('DEL')) return 'DEL'
  return 'MED'
}

function clamp(v) { return Math.max(3, Math.min(97, v)) }

function crearFicha(player, x, y) {
  return {
    id: `ficha_${player.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    playerId: player.id,
    nombre: player.name,
    nombreCorto: player.shortName,
    foto: player.photo || DEFAULT_PHOTO,
    isZaragoza: player.isZaragoza,
    x, y,
  }
}

function PanelJugadores({ allPlayers, onAdd }) {
  const [busqueda, setBusqueda] = useState('')
  const [grupo, setGrupo] = useState(null)

  const resultados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return allPlayers.filter(p => {
      if (grupo && grupoPosicion(p.position) !== grupo) return false
      if (q && !p.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [allPlayers, grupo, busqueda])

  return (
    <div className="pizarra-jugadores">
      <input
        placeholder="Buscar jugador..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        className="pizarra-buscador__input"
      />

      <div className="pizarra-chips">
        {GRUPOS_POSICION.map(g => (
          <button key={g.label} className={`pizarra-chips__item${grupo === g.id ? ' is-activo' : ''}`} onClick={() => setGrupo(g.id)}>
            {g.label}
          </button>
        ))}
      </div>

      <div className="pizarra-grid-jugadores">
        {resultados.map(p => (
          <button key={p.id} className="pizarra-grid-jugadores__item" onClick={() => onAdd(p)} title={`Añadir a ${p.name}`}>
            <span className="pizarra-grid-jugadores__avatar">
              <span className="pizarra-grid-jugadores__foto" style={{ borderColor: p.isZaragoza ? '#0B4390' : '#f5c400' }}>
                <img src={p.photo || DEFAULT_PHOTO} alt="" />
              </span>
              <span className="pizarra-grid-jugadores__mas">+</span>
            </span>
            <span className="pizarra-grid-jugadores__nombre">{p.shortName || p.name}</span>
          </button>
        ))}
        {resultados.length === 0 && <p className="pizarra-panel-bloque__ayuda">Sin resultados.</p>}
      </div>
    </div>
  )
}

export default function Pizarra() {
  const navigate = useNavigate()
  const { players, loading } = usePlayers()
  const zaragozaPlayers = useMemo(() => players.filter(p => p.isZaragoza), [players])
  const [fichas, setFichas] = useState([])
  const [balon, setBalon] = useState(null)
  const [instantaneas, setInstantaneas] = useState([])
  const [exportando, setExportando] = useState(false)
  const [grabandoVideo, setGrabandoVideo] = useState(false)
  const [errorVideo, setErrorVideo] = useState(null)
  const campoRef = useRef(null)

  const { reproduciendo, frame, reproducir, detener } = usePizarraPlayback(instantaneas)

  function tomarInstantanea() {
    setInstantaneas(prev => [...prev, {
      id: `inst_${Date.now()}`,
      fichas: fichas.map(f => ({ ...f })),
      balon: balon ? { ...balon } : null,
    }])
  }

  function quitarInstantanea(id) {
    setInstantaneas(prev => prev.filter(i => i.id !== id))
  }

  function agregarFicha(player) {
    const jitterX = (Math.random() - 0.5) * 14
    const jitterY = (Math.random() - 0.5) * 14
    setFichas(prev => [...prev, crearFicha(player, clamp(50 + jitterX), clamp(50 + jitterY))])
  }

  function quitarFicha(id) {
    setFichas(prev => prev.filter(f => f.id !== id))
  }

  function moverFicha(id, dxPct, dyPct) {
    setFichas(prev => prev.map(f => f.id === id ? { ...f, x: clamp(f.x + dxPct), y: clamp(f.y + dyPct) } : f))
  }

  function agregarBalon() {
    setBalon({ x: 50, y: 50 })
  }

  function moverBalon(dxPct, dyPct) {
    setBalon(prev => prev ? { x: clamp(prev.x + dxPct), y: clamp(prev.y + dyPct) } : prev)
  }

  function limpiarPizarra() {
    detener()
    setFichas([])
    setBalon(null)
  }

  async function handleDescargar() {
    setExportando(true)
    await new Promise(r => setTimeout(r, 30)) // deja repintar sin los botones ✕ (capturing=true)
    try {
      await descargarPizarra(fichas, balon)
    } finally {
      setExportando(false)
    }
  }

  async function handleDescargarVideo() {
    setErrorVideo(null)
    setGrabandoVideo(true)
    try {
      await descargarVideoPizarra(instantaneas)
    } catch (err) {
      setErrorVideo(err.message || 'No se pudo grabar el vídeo.')
    } finally {
      setGrabandoVideo(false)
    }
  }

  const tableroVacio = fichas.length === 0 && !balon
  const fichasVisibles = reproduciendo && frame ? frame.fichas : fichas
  const balonVisible = reproduciendo && frame ? frame.balon : balon

  return (
    <div className="pizarra-page">
      <SEO
        title="La Pizarra Táctica del Real Zaragoza | RZ Hub"
        description="Monta tu pizarra táctica del Real Zaragoza gratis: coloca a cualquier jugador de la plantilla donde quieras, añade el balón, crea instantáneas animadas y descarga el resultado como imagen o vídeo para redes sociales."
        keywords="pizarra táctica Real Zaragoza, pizarra fútbol online, tactic board Real Zaragoza, crear táctica fútbol, pizarra interactiva fútbol, montar jugada Real Zaragoza, pizarra virtual gratis"
        path="/pizarra"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'La Pizarra | RZ Hub',
            url: `${SITE_URL}/pizarra`,
            applicationCategory: 'SportsApplication',
            operatingSystem: 'Web',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
            description: 'Pizarra táctica interactiva: coloca libremente a los jugadores del Real Zaragoza sobre el campo, crea animaciones y descarga el resultado como imagen o vídeo.',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '¿Cómo funciona la Pizarra Táctica de RZ Hub?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Buscas al jugador del Real Zaragoza que quieras en el lateral, lo añades al campo con un clic y lo arrastras a cualquier posición. También puedes añadir el balón y mover todo libremente, sin casillas fijas.',
                },
              },
              {
                '@type': 'Question',
                name: '¿Se puede animar la jugada en la Pizarra?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Sí. Guardando varias "instantáneas" de distintas posiciones, la Pizarra las reproduce una detrás de otra deslizando a cada jugador de una posición a la siguiente, como una animación.',
                },
              },
              {
                '@type': 'Question',
                name: '¿Puedo descargar mi pizarra como imagen o vídeo?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Sí, puedes descargar una imagen PNG de tu jugada, y si has creado varias instantáneas también puedes descargar un vídeo con la animación completa, listo para compartir en redes sociales.',
                },
              },
              {
                '@type': 'Question',
                name: '¿Es gratis usar la Pizarra Táctica de RZ Hub?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Sí, la Pizarra es una herramienta totalmente gratuita de RZ Hub para cualquier aficionado del Real Zaragoza.',
                },
              },
            ],
          },
        ]}
      />

      <div className="pizarra-page__hero">
        <button className="pizarra-page__volver" onClick={() => navigate('/herramientas')}>‹ Herramientas</button>
        <h1 className="pizarra-page__title">LA <span>PIZARRA</span></h1>
        <p className="pizarra-page__subtitle">Crea tu alineación, prueba distintas posiciones y comparte tu idea de juego. La herramienta definitiva para montar tu Real Zaragoza.</p>
      </div>

      <div className="pizarra-page__body">
        <div className="pizarra-page__container">
          {loading ? (
            <p className="pizarra-page__state">Cargando jugadores…</p>
          ) : (
            <div className="pizarra-layout">
              <div className="pizarra-layout__campo">
                <div className="pizarra-toolbar">
                  <button className="rz-btn rz-btn--outline-yellow pizarra-toolbar__descargar" onClick={handleDescargar} disabled={exportando || reproduciendo || tableroVacio}>
                    {exportando ? 'Generando…' : '⬇ Descargar imagen'}
                  </button>
                </div>
                <PizarraCampo
                  fichas={fichasVisibles}
                  onMoverFicha={moverFicha}
                  onRemoveFicha={quitarFicha}
                  balon={balonVisible}
                  onMoverBalon={moverBalon}
                  onRemoveBalon={() => setBalon(null)}
                  capturing={exportando || reproduciendo}
                  campoRef={campoRef}
                />
              </div>

              <div className="pizarra-layout__panel">
                <div className="pizarra-panel-bloque">
                  <PanelJugadores allPlayers={zaragozaPlayers} onAdd={agregarFicha} />
                </div>

                <div className="pizarra-panel-bloque">
                  <p className="pizarra-panel-bloque__titulo">Balón</p>
                  <button className="rz-btn rz-btn--ghost pizarra-panel-bloque__boton" onClick={agregarBalon} disabled={!!balon || reproduciendo}>
                    {balon ? 'Balón ya en el campo' : '⚽ Añadir balón'}
                  </button>
                </div>

                <div className="pizarra-panel-bloque">
                  <p className="pizarra-panel-bloque__titulo">Animación</p>
                  <button className="rz-btn rz-btn--ghost pizarra-panel-bloque__boton" onClick={tomarInstantanea} disabled={reproduciendo || tableroVacio}>
                    📸 Tomar instantánea
                  </button>

                  {instantaneas.length > 0 && (
                    <div className="pizarra-instantaneas">
                      {instantaneas.map((inst, i) => (
                        <span key={inst.id} className="pizarra-instantaneas__chip">
                          {i + 1}
                          {!reproduciendo && (
                            <button onClick={() => quitarInstantanea(inst.id)} aria-label={`Quitar instantánea ${i + 1}`}>✕</button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    className="rz-btn rz-btn--primary pizarra-panel-bloque__boton"
                    onClick={reproduciendo ? detener : reproducir}
                    disabled={grabandoVideo || (!reproduciendo && instantaneas.length < 2)}
                  >
                    {reproduciendo ? '■ Detener' : `▶ Reproducir (${instantaneas.length})`}
                  </button>
                  {instantaneas.length === 1 && (
                    <p className="pizarra-panel-bloque__ayuda">Necesitas al menos 2 instantáneas para reproducir.</p>
                  )}

                  {soportaGrabacionVideo() && (
                    <button
                      className="rz-btn rz-btn--outline-yellow pizarra-panel-bloque__boton"
                      onClick={handleDescargarVideo}
                      disabled={reproduciendo || grabandoVideo || instantaneas.length < 2}
                    >
                      {grabandoVideo ? 'Grabando vídeo…' : '🎥 Descargar vídeo'}
                    </button>
                  )}
                  {errorVideo && <p className="pizarra-panel-bloque__ayuda">{errorVideo}</p>}
                </div>

                <div className="pizarra-panel-bloque pizarra-panel-bloque--acciones">
                  <button className="rz-btn rz-btn--outline-yellow" onClick={handleDescargar} disabled={exportando || reproduciendo || tableroVacio}>
                    {exportando ? 'Generando…' : '⬇ Descargar imagen'}
                  </button>
                  <button className="rz-btn rz-btn--ghost" onClick={limpiarPizarra} disabled={reproduciendo || tableroVacio}>
                    Limpiar pizarra
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  )
}
