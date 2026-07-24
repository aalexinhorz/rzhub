import './MarketStats.css'

const ICON_PROPS = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' }

const STATS_CONFIG = [
  {
    key: 'altas',
    label: 'Altas',
    color: '#22c55e',
    icon: (
      <svg {...ICON_PROPS} stroke="#22c55e"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
    ),
  },
  {
    key: 'bajas',
    label: 'Bajas',
    color: '#ef4444',
    icon: (
      <svg {...ICON_PROPS} stroke="#ef4444"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
    ),
  },
  {
    key: 'movimientos',
    label: 'Movimientos',
    color: '#ffc800',
    icon: (
      <svg {...ICON_PROPS} stroke="#ffc800"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
    ),
  },
]

function StatCard({ stat, value, loading }) {
  return (
    <div className="market-stats__card" role="group" aria-label={`${stat.label}: ${loading ? 'cargando' : value}`}>
      <span className="market-stats__icon" aria-hidden="true">{stat.icon}</span>
      <div className="market-stats__text">
        {loading ? (
          <span className="market-stats__skeleton" />
        ) : (
          <span className="market-stats__value" style={{ color: stat.color }}>{value}</span>
        )}
        <span className="market-stats__label">{stat.label}</span>
      </div>
    </div>
  )
}

/**
 * MarketStats — KPIs de temporada (Altas / Bajas / Movimientos).
 * Puramente presentacional: los totales llegan por props ya
 * calculados (sobre el total de la temporada, no sobre el filtro
 * activo del listado).
 */
export default function MarketStats({ altas, bajas, loading }) {
  const totals = { altas, bajas, movimientos: altas + bajas }

  return (
    <div className="market-stats">
      {STATS_CONFIG.map(stat => (
        <StatCard key={stat.key} stat={stat} value={totals[stat.key]} loading={loading} />
      ))}
    </div>
  )
}
