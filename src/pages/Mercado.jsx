import { useMemo, useState } from 'react'
import useMarketData, { CURRENT_SEASON } from '../hooks/useMarketData'
import MarketHero from '../components/MarketHero'
import MarketFilters from '../components/MarketFilters'
import TransferTimeline from '../components/TransferTimeline'
import Footer from '../components/Footer'
import './Mercado.css'

const FILTER_NOUN = { entradas: 'entradas', salidas: 'salidas' }

function TimelineSkeleton() {
  return (
    <div className="mercado-page__skeleton" aria-hidden="true">
      <div className="mercado-page__skeleton-heading" />
      <div className="mercado-page__skeleton-grid">
        <div className="mercado-page__skeleton-card" />
        <div className="mercado-page__skeleton-card" />
      </div>
    </div>
  )
}

function EmptyState({ filter, hasAnyMovement }) {
  const message = hasAnyMovement
    ? `No hay ${FILTER_NOUN[filter]} registradas para esta temporada.`
    : 'No hay movimientos registrados para esta temporada.'

  return (
    <div className="mercado-page__state" role="status">
      <p>{message}</p>
    </div>
  )
}

function ErrorState({ onRetry }) {
  return (
    <div className="mercado-page__state mercado-page__state--error" role="alert">
      <p>No hemos podido cargar el mercado. Inténtalo de nuevo.</p>
      <button type="button" className="mercado-page__retry" onClick={onRetry}>
        Reintentar
      </button>
    </div>
  )
}

export default function Mercado() {
  const [season, setSeason] = useState(CURRENT_SEASON)
  const [filter, setFilter] = useState('todos')
  const { loading, error, movements, refetch } = useMarketData(season)

  const altas = useMemo(() => movements.filter(m => m.type === 'signing').length, [movements])
  const bajas = useMemo(() => movements.filter(m => m.type === 'departure').length, [movements])

  const filtered = useMemo(() => {
    if (filter === 'entradas') return movements.filter(m => m.type === 'signing')
    if (filter === 'salidas') return movements.filter(m => m.type === 'departure')
    return movements
  }, [movements, filter])

  function handleSeasonChange(next) {
    setSeason(next)
    setFilter('todos')
  }

  return (
    <div className="mercado-page">
      <MarketHero
        season={season}
        onSeasonChange={handleSeasonChange}
        altas={altas}
        bajas={bajas}
        loading={loading}
      />

      <div className="mercado-page__body">
        <div className="mercado-page__container">
          <MarketFilters value={filter} onChange={setFilter} />

          <div className="mercado-page__listing">
            {loading && <TimelineSkeleton />}
            {!loading && error && <ErrorState onRetry={refetch} />}
            {!loading && !error && filtered.length === 0 && (
              <EmptyState filter={filter} hasAnyMovement={movements.length > 0} />
            )}
            {!loading && !error && filtered.length > 0 && <TransferTimeline movements={filtered} />}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}
