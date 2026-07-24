import { ESCUDO_ZARAGOZA, useEscudo } from '../lib/escudos'
import './TransferTimeline.css'

const POSITION_COLORS = {
  POR: { bg: 'rgba(255, 152, 0, 0.15)', border: '#ff9800', text: '#ff9800' },
  DEF: { bg: 'rgba(33, 150, 243, 0.15)', border: '#2196f3', text: '#2196f3' },
  MED: { bg: 'rgba(76, 175, 80, 0.15)', border: '#4caf50', text: '#4caf50' },
  DEL: { bg: 'rgba(233, 30, 99, 0.15)', border: '#e91e63', text: '#e91e63' },
}

function toDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Agrupa los movimientos ya ordenados (desc por fecha) en HOY / AYER /
// fecha completa, preservando el orden — un Map basta, no hace falta
// re-ordenar nada.
function groupByDate(movements) {
  const now = new Date()
  const todayKey = toDateKey(now)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = toDateKey(yesterday)

  const groups = new Map()
  for (const mov of movements) {
    const key = mov.date
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(mov)
  }

  return [...groups.entries()].map(([dateKey, movs]) => {
    let label
    if (dateKey === todayKey) label = 'Hoy'
    else if (dateKey === yesterdayKey) label = 'Ayer'
    else {
      const d = new Date(`${dateKey}T00:00:00`)
      label = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    }
    return { key: dateKey, label, movements: movs }
  })
}

// Resuelve el escudo una única vez por club — tanto la ruta detallada
// como el resumen grande de cabecera (desktop) consumen el mismo
// valor ya resuelto, en vez de repetir la búsqueda/fetch cada uno.
function useResolvedClub(club) {
  const isZaragoza = club.crest === ESCUDO_ZARAGOZA
  const fallbackCrest = useEscudo(isZaragoza ? null : club.name)
  return { ...club, crest: club.crest || fallbackCrest }
}

function ClubRoute({ club }) {
  return (
    <div className="transfer-card__club">
      {club.crest ? (
        <img className="transfer-card__crest" src={club.crest} alt="" aria-hidden="true" loading="lazy" width={30} height={30} onError={e => { e.target.style.visibility = 'hidden' }} />
      ) : (
        <span className="transfer-card__crest transfer-card__crest--fallback" aria-hidden="true">{club.name[0]}</span>
      )}
      <div className="transfer-card__club-text">
        <span className="transfer-card__club-name">{club.name}</span>
        {club.country && <span className="transfer-card__club-country">{club.country}</span>}
      </div>
    </div>
  )
}

function HeaderCrest({ club }) {
  return club.crest ? (
    <img className="transfer-card__header-crest" src={club.crest} alt="" aria-hidden="true" loading="lazy" width={36} height={36} onError={e => { e.target.style.visibility = 'hidden' }} />
  ) : (
    <span className="transfer-card__header-crest transfer-card__crest--fallback" aria-hidden="true">{club.name[0]}</span>
  )
}

function formatShortDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
function formatFullDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function TransferCard({ movement }) {
  const isSigning = movement.type === 'signing'
  const posColors = POSITION_COLORS[movement.player.position] || { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.2)', text: 'rgba(255,255,255,0.7)' }
  const origin = useResolvedClub(movement.originClub)
  const destination = useResolvedClub(movement.destinationClub)
  const arrowColor = isSigning ? '#22c55e' : '#ef4444'

  return (
    <article className={`transfer-card transfer-card--${movement.type}`}>
      <header className="transfer-card__header">
        <img
          className="transfer-card__photo"
          src={movement.player.image}
          alt=""
          loading="lazy"
          width={48}
          height={48}
        />
        <div className="transfer-card__who">
          <h3 className="transfer-card__name">{movement.player.name}</h3>
          <div className="transfer-card__badges">
            {movement.player.position && (
              <span className="transfer-card__badge" style={{ background: posColors.bg, border: `1px solid ${posColors.border}`, color: posColors.text }}>
                {movement.player.position}
              </span>
            )}
            <span className={`transfer-card__type transfer-card__type--${movement.type}`}>
              {isSigning ? '↑ Alta' : '↓ Baja'}
            </span>
          </div>
        </div>
        <time className="transfer-card__date" dateTime={movement.date}>
          <span className="transfer-card__date-full">{formatFullDate(movement.date)}</span>
          <span className="transfer-card__date-short">{formatShortDate(movement.date)}</span>
        </time>

        {/* Solo tablet grande / desktop (ver CSS): resumen visual grande
            del movimiento, sustituyendo a la fecha en ese hueco. En ese
            rango la ruta detallada de abajo está oculta, así que esta
            es la única fuente de origen/destino — no aria-hidden. */}
        <div className="transfer-card__header-route">
          <span className="transfer-card__header-club-name">{origin.name}</span>
          <HeaderCrest club={origin} />
          <svg className="transfer-card__header-arrow" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={arrowColor} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
          <HeaderCrest club={destination} />
          <span className="transfer-card__header-club-name">{destination.name}</span>
        </div>
      </header>

      <div className="transfer-card__route">
        <ClubRoute club={origin} />
        <svg className="transfer-card__arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={arrowColor} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
        <ClubRoute club={destination} />
      </div>
    </article>
  )
}

function TransferDateGroup({ group }) {
  return (
    <section className="transfer-date-group" aria-label={group.label}>
      <h2 className="transfer-date-group__heading">{group.label}</h2>
      <div className="transfer-date-group__grid">
        {group.movements.map(mov => <TransferCard key={mov.id} movement={mov} />)}
      </div>
    </section>
  )
}

/**
 * TransferTimeline — listado de movimientos agrupado por fecha.
 * Puramente presentacional: recibe la lista ya filtrada (Todos /
 * Entradas / Salidas) y solo se encarga de agruparla y pintarla.
 */
export default function TransferTimeline({ movements }) {
  const groups = groupByDate(movements)

  return (
    <div className="transfer-timeline">
      {groups.map(group => <TransferDateGroup key={group.key} group={group} />)}
    </div>
  )
}
