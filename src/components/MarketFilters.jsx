import './MarketFilters.css'

const FILTERS = [
  {
    key: 'todos', label: 'Todos',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    key: 'entradas', label: 'Entradas',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
      </svg>
    ),
  },
  {
    key: 'salidas', label: 'Salidas',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
      </svg>
    ),
  },
]

/**
 * MarketFilters — segmented control Todos/Entradas/Salidas. Opera
 * sobre los datos ya cargados de la temporada activa (no dispara
 * ningún fetch nuevo), por eso el cambio es instantáneo.
 */
export default function MarketFilters({ value, onChange }) {
  return (
    <div className="market-filters" role="tablist" aria-label="Filtrar movimientos de mercado">
      {FILTERS.map(f => (
        <button
          key={f.key}
          type="button"
          role="tab"
          aria-selected={value === f.key}
          className={`market-filters__tab${value === f.key ? ' is-active' : ''}`}
          onClick={() => onChange(f.key)}
        >
          <span aria-hidden="true">{f.icon}</span>
          {f.label}
        </button>
      ))}
    </div>
  )
}
