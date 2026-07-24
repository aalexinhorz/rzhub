import SeasonSelector from './SeasonSelector'
import MarketStats from './MarketStats'
import './MarketHero.css'

/**
 * MarketHero — cabecera de la página Mercado: eyebrow dinámico por
 * temporada, título, descripción, selector de temporada y KPIs.
 * Puramente presentacional; los totales y el cambio de temporada
 * llegan/salen por props.
 */
export default function MarketHero({ season, onSeasonChange, altas, bajas, loading }) {
  return (
    <section className="market-hero">
      <div className="market-hero__container">
        <div className="market-hero__top">
          <div className="market-hero__intro">
            <p className="market-hero__eyebrow">Real Zaragoza · Temporada {season}</p>
            <h1 className="market-hero__title">Mercado</h1>
            <p className="market-hero__desc">Sigue todos los movimientos del Real Zaragoza.</p>
          </div>
          <SeasonSelector value={season} onChange={onSeasonChange} />
        </div>

        <MarketStats altas={altas} bajas={bajas} loading={loading} />
      </div>
    </section>
  )
}
