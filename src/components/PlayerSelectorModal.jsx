import { useState, useEffect, useRef, useMemo, useId } from 'react'
import { createPortal } from 'react-dom'
import './PlayerSelectorModal.css'

const DEFAULT_PHOTO = 'https://gqslryreaiqmvnyyhwzf.supabase.co/storage/v1/object/public/photoplayers/fallback-dark.png'

// Únicas categorías de posición que existen hoy en la base de datos y en
// las formaciones (slot.label) — ver src/lib/formations.js y
// scripts/sync_jugador.py. No hay granularidad tipo DFC/MCD.
const POSITIONS = ['POR', 'DEF', 'MED', 'DEL']
const POSITION_INFO = {
  POR: { singular: 'Portero', plural: 'Porteros' },
  DEF: { singular: 'Defensa', plural: 'Defensas' },
  MED: { singular: 'Medio', plural: 'Medios' },
  DEL: { singular: 'Delantero', plural: 'Delanteros' },
}

// Códigos más granulares que también existen en players.position (ver
// CLAUDE.md: la API de sugerencias de FotMob casi nunca devuelve la
// posición exacta, así que hay de todo) y que cuentan como parte de
// cada categoría a efectos de sugerencias/plantilla/contadores, aunque
// no coincidan carácter a carácter con el código canónico.
const POSITION_ALIASES = {
  POR: [],
  DEF: ['LD', 'LI', 'DFC'],
  MED: ['MC', 'MCD', 'MCO', 'MED/DEF'],
  DEL: ['EI', 'ED', 'DEL/MCO'],
}

function coincidePosicion(player, codigo) {
  return player.position === codigo || POSITION_ALIASES[codigo]?.includes(player.position)
}

const TABS = [
  { id: 'sugerencias', label: 'Sugerencias' },
  { id: 'plantilla', label: 'Plantilla actual' },
]

const SUGERENCIAS_TAMANO_GRUPO = 4

// Selección curada a mano para estas tres posiciones (pedida así
// explícitamente, en vez de la mezcla automática zaragoza-primero +
// alfabético). Se busca por nombre exacto dentro de allPlayers en el
// momento de renderizar, así que sigue usando los datos reales (foto,
// equipo, etc.) — esto solo fija el ORDEN/selección, no inventa
// jugadores. Si un nombre no se encuentra (dato editado en el futuro),
// simplemente se omite esa card en vez de romper el render.
const SUGERENCIAS_CURADAS = {
  DEL: {
    sugeridos: ['Jaume Jardí', 'Joaquín Delgado', 'Iker Vadillo', 'Óscar Ureña'],
    otros: ['Cuenca', 'Diego Monzón', 'Adrián Liso', 'Agada'],
  },
  MED: {
    sugeridos: ['Peter Ademo', 'Lucas Terrer', 'Ander Herrera', 'Saidu'],
    otros: ['Enzo Facchin', 'Jaime Tobajas', 'Aarón Ochoa', 'Aitor Gelardo'],
  },
  DEF: {
    sugeridos: ['Raúl Pereira', 'Diego González', 'Rubén Iranzo', 'Marco Sangalli'],
    otros: ['Barrachina', 'David Garcia', 'Alberto Dadie', 'Alberto Quintana'],
  },
}

function byZaragozaFirst(a, b) {
  return Number(b.isZaragoza) - Number(a.isZaragoza)
}

function IconSearch(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
function IconClose(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" {...props}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  )
}
function IconPlus(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
function IconChevronRight(props) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <polyline points="9 5 16 12 9 19" />
    </svg>
  )
}
function IconAlert(props) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <line x1="12" y1="16.5" x2="12" y2="16.51" />
    </svg>
  )
}

// Un icono por opción del filtro de posición, en vez del marcador de
// "seleccionado" con una barra de color (::before) — así se distingue
// cada posición de un vistazo incluso antes de fijarse en cuál está
// activa.
function IconPosAll(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}
function IconPosPortero(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M7 13V6.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M10 11V5a1.5 1.5 0 0 1 3 0v6" />
      <path d="M13 11V6a1.5 1.5 0 0 1 3 0v6" />
      <path d="M16 12V8a1.5 1.5 0 0 1 3 0v6c0 3.31-2.69 6-6 6h-1c-2.5 0-4-1-5.5-3L4 15.5c-.5-.7-.3-1.6.5-2 .6-.3 1.3-.1 1.7.4L7 15" />
    </svg>
  )
}
function IconPosDefensa(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    </svg>
  )
}
function IconPosCentrocampista(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12 4v3M12 17v3M4 12h3M17 12h3" />
    </svg>
  )
}
function IconPosDelantero(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}
const POSITION_FILTER_ICON = {
  ALL: IconPosAll,
  POR: IconPosPortero,
  DEF: IconPosDefensa,
  MED: IconPosCentrocampista,
  DEL: IconPosDelantero,
}

// Mismo patrón de focus trap / Escape / bloqueo de scroll / devolución de
// foco que el resto de modales nuevos del proyecto (p. ej. Porra.jsx).
function useModalA11y(open, dialogRef, triggerRef, onClose) {
  useEffect(() => {
    if (!open) return
    // body{overflow:hidden} a secas no basta en iOS Safari: el body
    // sigue "rebotando" al hacer scroll con el dedo y ese gesto se come
    // el touch que debería mover el contenido interno del modal. Fijar
    // el body en su sitio (position:fixed + top negativo) es el único
    // bloqueo que iOS respeta de verdad; hay que restaurar el scroll a
    // mano al cerrar porque position:fixed lo resetea a 0.
    const scrollY = window.scrollY
    const previousBodyStyle = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    }
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
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
      document.body.style.overflow = previousBodyStyle.overflow
      document.body.style.position = previousBodyStyle.position
      document.body.style.top = previousBodyStyle.top
      document.body.style.width = previousBodyStyle.width
      // scrollTo() hereda scroll-behavior:smooth del <html> global (ver
      // index.css) y esto no es una navegación del usuario sino solo
      // deshacer el position:fixed de arriba — sin behavior:'instant' se
      // ve un scroll animado de vuelta a la posición que ya "debería"
      // tener la página.
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' })
      document.removeEventListener('keydown', onKeyDown)
      triggerRef?.current?.focus()
    }
  }, [open])
}

function PlayerSelectorHeader({ posLabel, onClose, closeBtnRef, titleId }) {
  return (
    <div className="psm-header">
      <div className="psm-header__text">
        <h2 className="psm-header__title" id={titleId}>Añadir jugador</h2>
        <p className="psm-header__subtitle">Busca un jugador y añádelo a la posición seleccionada.</p>
      </div>
      <div className="psm-header__side">
        {posLabel && (
          <div className="psm-position-chip">
            <span className="psm-position-chip__code">{posLabel.code}</span>
            <span className="psm-position-chip__name">{posLabel.singular}</span>
          </div>
        )}
        <button ref={closeBtnRef} type="button" className="psm-close" onClick={onClose} aria-label="Cerrar selector de jugador">
          <IconClose />
        </button>
      </div>
    </div>
  )
}

// Cuando el slot ya tiene titular (se abrió desde el clic en la card,
// no desde el "+" de un hueco vacío), aquí se ve a quién se está a
// punto de sustituir y se ofrece quitarlo sin necesidad de elegir un
// reemplazo.
function CurrentPlayerBanner({ player, onRemove }) {
  return (
    <div className="psm-current-player">
      <span className="psm-current-player__photo">
        <img src={player.photo || DEFAULT_PHOTO} alt="" onError={e => { e.currentTarget.src = DEFAULT_PHOTO }} />
      </span>
      <span className="psm-current-player__info">
        <span className="psm-current-player__label">Titular actual</span>
        <span className="psm-current-player__name">{player.name}</span>
      </span>
      <button type="button" className="psm-current-player__remove" onClick={onRemove}>
        Quitar
      </button>
    </div>
  )
}

function PlayerSearch({ value, onChange, inputRef }) {
  return (
    <div className="psm-search">
      <IconSearch className="psm-search__icon" />
      <input
        ref={inputRef}
        type="text"
        className="psm-search__input"
        placeholder="Buscar jugador..."
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label="Buscar jugador"
      />
    </div>
  )
}

function PlayerTabs({ active, onChange, idPrefix, panelId }) {
  return (
    <div className="psm-tabs" role="tablist" aria-label="Filtrar jugadores">
      {TABS.map(tab => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`${idPrefix}-${tab.id}`}
          aria-selected={active === tab.id}
          aria-controls={panelId}
          className={`psm-tabs__item${active === tab.id ? ' psm-tabs__item--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function PositionFilters({ variant, counts, active, onChange }) {
  const items = [{ code: 'ALL', label: 'Todos' }, ...POSITIONS.map(code => ({ code, label: POSITION_INFO[code].plural }))]
  return (
    <div className={`psm-position-filters psm-position-filters--${variant}`} role="radiogroup" aria-label="Filtrar por posición">
      {items.map(item => {
        const Icon = POSITION_FILTER_ICON[item.code]
        return (
          <button
            key={item.code}
            type="button"
            role="radio"
            aria-checked={active === item.code}
            className={`psm-position-filters__item${active === item.code ? ' psm-position-filters__item--active' : ''}`}
            onClick={() => onChange(item.code)}
          >
            <Icon className="psm-position-filters__icon" />
            <span className="psm-position-filters__label">{item.label}</span>
            <span className="psm-position-filters__count">{counts[item.code]}</span>
          </button>
        )
      })}
    </div>
  )
}

function PlayerCard({ player, onSelect }) {
  const posInfo = POSITION_INFO[player.position]
  const posShort = posInfo ? player.position : player.position || '—'
  const equipo = player.isZaragoza ? 'Real Zaragoza' : (player.team || 'Otros equipos')
  return (
    <button
      type="button"
      className="psm-card"
      onClick={() => onSelect(player)}
      aria-label={`Añadir a ${player.name}${posInfo ? `, ${posInfo.singular}` : ''}${equipo ? `, ${equipo}` : ''}`}
    >
      <span className="psm-card__photo">
        <img
          src={player.photo || DEFAULT_PHOTO}
          alt=""
          loading="lazy"
          onError={e => { e.currentTarget.src = DEFAULT_PHOTO }}
        />
      </span>
      <span className="psm-card__info">
        <span className="psm-card__row">
          <span className="psm-card__name">{player.name}</span>
          <span className="psm-card__badge">{posShort}</span>
        </span>
        <span className="psm-card__team">{equipo}</span>
      </span>
      <span className="psm-card__add" aria-hidden="true">
        <IconPlus />
      </span>
    </button>
  )
}

// Caso exclusivo del buscador: el jugador escrito no existe en la base
// de datos (0 resultados). Mismo comportamiento que el modal antiguo —
// se da de alta como jugador externo con la posición del slot actual y
// se añade directamente, sin pasar por la base de datos real.
function AddCustomPlayerCard({ name, onAdd }) {
  return (
    <button type="button" className="psm-card psm-card--custom" onClick={onAdd}>
      <span className="psm-card__photo">
        <img src={DEFAULT_PHOTO} alt="" />
      </span>
      <span className="psm-card__info">
        <span className="psm-card__name">{name}</span>
        <span className="psm-card__custom-label">Añadir como jugador externo</span>
      </span>
      <span className="psm-card__add" aria-hidden="true">
        <IconPlus />
      </span>
    </button>
  )
}

function PlayerCardSkeleton() {
  return (
    <div className="psm-card psm-card--skeleton" aria-hidden="true">
      <span className="psm-skel psm-skel--photo" />
      <span className="psm-card__info">
        <span className="psm-skel psm-skel--line" style={{ width: '70%' }} />
        <span className="psm-skel psm-skel--line" style={{ width: '45%' }} />
      </span>
    </div>
  )
}

function PlayerGrid({ players, onSelect, emptyMessage, onEmptyAction, emptyActionLabel }) {
  if (players.length === 0) {
    return (
      <div className="psm-empty">
        <p>{emptyMessage}</p>
        {onEmptyAction && (
          <button type="button" className="psm-empty__action" onClick={onEmptyAction}>
            {emptyActionLabel} <IconChevronRight />
          </button>
        )}
      </div>
    )
  }
  return (
    <div className="psm-grid" role="list">
      {players.map(p => (
        <div role="listitem" key={p.id}>
          <PlayerCard player={p} onSelect={onSelect} />
        </div>
      ))}
    </div>
  )
}

function SectionHeading({ title, subtitle, onVerTodos }) {
  return (
    <div className="psm-section-heading">
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {onVerTodos && (
        <button type="button" className="psm-ver-todos" onClick={onVerTodos}>
          Ver todos <IconChevronRight />
        </button>
      )}
    </div>
  )
}

export default function PlayerSelectorModal({ open, slot, currentPlayer, allPlayers, loading, error, onRetry, onSelect, onClose, onAddCustomPlayer, onRemoveCurrent, triggerRef }) {
  const dialogRef = useRef(null)
  const searchInputRef = useRef(null)
  const closeBtnRef = useRef(null)
  const titleId = useId()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('sugerencias')
  const [activePosition, setActivePosition] = useState(slot?.label || 'ALL')
  // "Ver todos" en una sección de Sugerencias quita el recorte de 4+4
  // de ESA posición (se queda en la misma posición, no salta a ALL).
  // Se resetea en cuanto cambia la pestaña o la posición para no dejar
  // una lista expandida "pegada" a un contexto distinto.
  const [verCompletoPosicion, setVerCompletoPosicion] = useState(false)
  // Sigue montado un instante más tras cerrar para poder reproducir la
  // animación de salida (en mobile, el bottom sheet deslizándose hacia
  // abajo) en vez de desaparecer de golpe — 320ms coincide con la
  // duración de psm-sheet-out en el CSS.
  const [shouldRender, setShouldRender] = useState(open)
  const [closing, setClosing] = useState(false)
  useEffect(() => {
    if (open) {
      setShouldRender(true)
      setClosing(false)
      return
    }
    if (!shouldRender) return
    // Con "menos movimiento" el CSS no reproduce psm-sheet-out (ver
    // prefers-reduced-motion en PlayerSelectorModal.css) — esperar los
    // 320ms igualmente solo retrasaría el cierre sin ningún beneficio
    // visual para ese usuario.
    const sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (sinAnimacion) {
      setShouldRender(false)
      return
    }
    setClosing(true)
    const t = setTimeout(() => {
      setShouldRender(false)
      setClosing(false)
    }, 320)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useModalA11y(open, dialogRef, triggerRef, onClose)

  // Cada apertura arranca limpia: pestaña "Sugerencias", filtro de
  // posición igual al de la posición que se está rellenando, sin texto
  // de búsqueda residual de una apertura anterior.
  useEffect(() => {
    if (!open) return
    setSearch('')
    setActiveTab('sugerencias')
    setActivePosition(slot?.label || 'ALL')
    setVerCompletoPosicion(false)
    // Autofocus solo en desktop: en mobile enfocar el input dispara el
    // teclado nativo al instante, que junto al modal a pantalla completa
    // se come toda la pantalla y tapa las sugerencias — justo lo
    // contrario de lo que se busca (que muchas veces ni haga falta
    // escribir).
    const esMobile = window.matchMedia('(max-width: 767px)').matches
    if (esMobile) return
    const t = setTimeout(() => searchInputRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [open, slot?.id])

  useEffect(() => {
    setVerCompletoPosicion(false)
  }, [activeTab, activePosition])

  const searchActive = search.trim().length >= 2

  const searchResults = useMemo(() => {
    if (!searchActive) return []
    const term = search.trim().toLowerCase()
    return allPlayers.filter(p => p.name.toLowerCase().includes(term)).sort(byZaragozaFirst)
  }, [allPlayers, search, searchActive])

  const counts = useMemo(() => {
    const c = { ALL: allPlayers.length }
    POSITIONS.forEach(code => { c[code] = allPlayers.filter(p => coincidePosicion(p, code)).length })
    return c
  }, [allPlayers])

  const pool = useMemo(() => {
    const base = activePosition === 'ALL' ? allPlayers : allPlayers.filter(p => coincidePosicion(p, activePosition))
    return [...base].sort(byZaragozaFirst)
  }, [allPlayers, activePosition])

  if (!shouldRender) return null

  const posInfo = activePosition !== 'ALL' ? POSITION_INFO[activePosition] : null
  const posChip = slot ? { code: slot.label, singular: POSITION_INFO[slot.label]?.singular || slot.label } : null

  // Sustituye a la antigua pestaña "Todos los jugadores" (eliminada):
  // en vez de saltar a otra pestaña, quita el filtro de posición y se
  // queda en la pestaña actual mostrando el universo completo.
  function verTodasLasPosiciones() {
    setActivePosition('ALL')
  }

  function handleAddCustomPlayer() {
    const name = search.trim()
    if (name.length < 2) return
    const customPlayer = onAddCustomPlayer({
      name, shortName: name,
      position: slot?.label, photo: DEFAULT_PHOTO, team: '', teamLogo: '',
    })
    if (customPlayer) onSelect(customPlayer)
  }

  function renderTabContent() {
    if (loading) {
      return (
        <div className="psm-grid" role="list" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => <PlayerCardSkeleton key={i} />)}
        </div>
      )
    }
    if (error) {
      return (
        <div className="psm-error">
          <IconAlert />
          <p>No hemos podido cargar los jugadores.</p>
          <button type="button" className="psm-error__retry" onClick={onRetry}>Reintentar</button>
        </div>
      )
    }
    if (searchActive) {
      if (searchResults.length === 0) {
        return (
          <div className="psm-grid" role="list">
            <p className="psm-search-empty">No hemos encontrado jugadores con ese nombre.</p>
            <div role="listitem">
              <AddCustomPlayerCard name={search.trim()} onAdd={handleAddCustomPlayer} />
            </div>
          </div>
        )
      }
      return <PlayerGrid players={searchResults} onSelect={onSelect} />
    }

    if (activeTab === 'sugerencias') {
      // "Todos": el agrupamiento en Sugerencias/Otros solo tiene sentido
      // cuando hay una posición concreta detrás — con el filtro en ALL
      // se enseña la lista completa sin recortar ni dividir en grupos.
      if (activePosition === 'ALL') {
        return (
          <PlayerGrid
            players={pool}
            onSelect={onSelect}
            emptyMessage="No hay jugadores disponibles."
          />
        )
      }
      if (pool.length === 0) {
        return (
          <PlayerGrid
            players={[]}
            emptyMessage="No hay sugerencias disponibles para esta posición."
            onEmptyAction={verTodasLasPosiciones}
            emptyActionLabel="Ver todas las posiciones"
          />
        )
      }
      const tituloGrupo = posInfo ? `Sugerencias para ${posInfo.singular.toLowerCase()}` : 'Sugerencias'
      const curada = SUGERENCIAS_CURADAS[activePosition]
      // "Ver todos" de esta sección: se queda en la misma posición y solo
      // quita el recorte de 4+4 (o la selección curada) para enseñar el
      // pool completo real, no salta a otras posiciones.
      if (curada && !verCompletoPosicion) {
        const buscarPorNombre = nombres => nombres
          .map(nombre => allPlayers.find(p => p.name === nombre))
          .filter(Boolean)
        const sugeridosCurados = buscarPorNombre(curada.sugeridos)
        const otrosCurados = buscarPorNombre(curada.otros)
        const tituloOtrosCurado = posInfo ? `Otros ${posInfo.plural.toLowerCase()}` : 'Otros jugadores'
        return (
          <>
            <SectionHeading
              title={tituloGrupo}
              subtitle="Jugadores recomendados para esta posición."
              onVerTodos={() => setVerCompletoPosicion(true)}
            />
            <PlayerGrid players={sugeridosCurados} onSelect={onSelect} />
            {otrosCurados.length > 0 && (
              <>
                <SectionHeading title={tituloOtrosCurado} />
                <PlayerGrid players={otrosCurados} onSelect={onSelect} />
              </>
            )}
          </>
        )
      }
      if (verCompletoPosicion) {
        return (
          <>
            <SectionHeading title={tituloGrupo} subtitle="Jugadores recomendados para esta posición." />
            <PlayerGrid players={pool} onSelect={onSelect} />
          </>
        )
      }
      const sugeridos = pool.slice(0, SUGERENCIAS_TAMANO_GRUPO)
      const otros = pool.slice(SUGERENCIAS_TAMANO_GRUPO, SUGERENCIAS_TAMANO_GRUPO * 2)
      const tituloOtros = posInfo ? `Otros ${posInfo.plural.toLowerCase()}` : 'Otros jugadores'
      return (
        <>
          <SectionHeading
            title={tituloGrupo}
            subtitle="Jugadores recomendados para esta posición."
            onVerTodos={pool.length > sugeridos.length ? () => setVerCompletoPosicion(true) : undefined}
          />
          <PlayerGrid players={sugeridos} onSelect={onSelect} />
          {otros.length > 0 && (
            <>
              <SectionHeading title={tituloOtros} />
              <PlayerGrid players={otros} onSelect={onSelect} />
            </>
          )}
        </>
      )
    }

    if (activeTab === 'plantilla') {
      const plantilla = pool.filter(p => p.isZaragoza)
      return (
        <PlayerGrid
          players={plantilla}
          onSelect={onSelect}
          emptyMessage="No hay jugadores de la plantilla en esta posición."
          onEmptyAction={activePosition !== 'ALL' ? verTodasLasPosiciones : undefined}
          emptyActionLabel="Ver todas las posiciones"
        />
      )
    }
  }

  const panelId = `${titleId}-tabpanel`

  const modal = (
    <div className="psm-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div
        className={`psm-modal${closing ? ' psm-modal--closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        tabIndex={-1}
      >
        <PlayerSelectorHeader posLabel={posChip ? { code: posChip.code, singular: posChip.singular } : null} onClose={onClose} closeBtnRef={closeBtnRef} titleId={titleId} />

        {currentPlayer && (
          <CurrentPlayerBanner
            player={currentPlayer}
            onRemove={onRemoveCurrent}
          />
        )}

        <div className="psm-toolbar">
          <PlayerSearch value={search} onChange={setSearch} inputRef={searchInputRef} />
          <PlayerTabs active={activeTab} onChange={setActiveTab} idPrefix={titleId} panelId={panelId} />
        </div>

        <PositionFilters variant="pills" counts={counts} active={activePosition} onChange={setActivePosition} />

        <div className="psm-body">
          <PositionFilters variant="sidebar" counts={counts} active={activePosition} onChange={setActivePosition} />
          <div className="psm-content" id={panelId} role="tabpanel" aria-labelledby={`${titleId}-${activeTab}`}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
